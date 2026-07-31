import { z } from "zod";

import { aiInsightsSchema } from "../schemas/aiInsightsSchema";
import type { SavedSimulation } from "../types/simulation";

/**
 * Schema da resposta completa devolvida pelo backend.
 *
 * Além dos insights financeiros, o servidor informa:
 * - O modelo Gemini utilizado.
 * - A versão do prompt que produziu a análise.
 */
const financialInsightsApiResponseSchema = z.object({
  insights: aiInsightsSchema,

  model: z.string().trim().min(1),

  promptVersion: z.string().trim().min(1),
});

/**
 * Resposta validada recebida da API interna do Grana Clara.
 */
export type FinancialInsightsApiResponse = z.infer<
  typeof financialInsightsApiResponseSchema
>;

/**
 * Estrutura enviada pelo frontend ao backend.
 *
 * O endpoint utiliza o nome simulationId, enquanto a simulação
 * persistida localmente armazena o identificador como id.
 */
type FinancialInsightsRequest = {
  simulationId: string;
  promptVersion: string;
  input: SavedSimulation["input"];
  result: SavedSimulation["result"];
  onboarding: SavedSimulation["onboarding"];
};

/**
 * Erro especializado para falhas na comunicação com a API de IA.
 *
 * O status HTTP permite que a interface apresente mensagens
 * específicas para:
 * - Dados inválidos.
 * - Limite de requisições.
 * - Indisponibilidade temporária.
 * - Erros internos.
 */
export class AIInsightsApiError extends Error {
  public readonly status: number;

  public readonly details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);

    this.name = "AIInsightsApiError";
    this.status = status;
    this.details = details;
  }
}

/**
 * Requisições que ainda estão sendo processadas.
 *
 * Durante o desenvolvimento, o React StrictMode pode executar
 * alguns ciclos de montagem mais de uma vez. Este mapa permite
 * que chamadas simultâneas para a mesma simulação reutilizem
 * a mesma Promise, evitando consumo duplicado da API Gemini.
 */
const pendingRequests = new Map<
  string,
  Promise<FinancialInsightsApiResponse>
>();

/**
 * Verifica se um valor desconhecido é um objeto comum.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Lê o corpo da resposta sem presumir que o servidor sempre
 * retornará um documento JSON válido.
 */
async function readJsonResponse(response: Response): Promise<unknown> {
  const responseText = await response.text();

  if (!responseText.trim()) {
    return null;
  }

  try {
    return JSON.parse(responseText);
  } catch {
    throw new AIInsightsApiError(
      "O servidor retornou uma resposta inválida.",
      response.status,
    );
  }
}

/**
 * Converte uma simulação salva para o formato esperado pelo
 * endpoint POST /api/ai/insights.
 */
function buildRequestPayload(
  simulation: SavedSimulation,
): FinancialInsightsRequest {
  return {
    simulationId: simulation.id,

    promptVersion: simulation.promptVersion,

    input: simulation.input,

    result: simulation.result,

    onboarding: simulation.onboarding,
  };
}

/**
 * Executa efetivamente a chamada HTTP para o backend.
 *
 * Esta função permanece interna porque o controle de requisições
 * simultâneas é realizado pela função pública
 * requestFinancialInsights.
 */
async function executeFinancialInsightsRequest(
  simulation: SavedSimulation,
  signal?: AbortSignal,
): Promise<FinancialInsightsApiResponse> {
  const response = await fetch("/api/ai/insights", {
    method: "POST",

    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },

    body: JSON.stringify(buildRequestPayload(simulation)),

    signal,
  });

  const responseData = await readJsonResponse(response);

  if (!response.ok) {
    const errorMessage =
      isRecord(responseData) && typeof responseData.error === "string"
        ? responseData.error
        : "Não foi possível gerar a análise financeira.";

    const errorDetails = isRecord(responseData)
      ? responseData.details
      : undefined;

    throw new AIInsightsApiError(errorMessage, response.status, errorDetails);
  }

  const validationResult =
    financialInsightsApiResponseSchema.safeParse(responseData);

  if (!validationResult.success) {
    throw new AIInsightsApiError(
      "A API retornou uma análise em formato inesperado.",
      response.status,
      validationResult.error.flatten(),
    );
  }

  return validationResult.data;
}

/**
 * Solicita uma análise financeira personalizada ao backend.
 *
 * A chave do Gemini nunca participa desta chamada no navegador.
 * O frontend acessa somente a rota interna /api/ai/insights.
 *
 * Chamadas simultâneas para a mesma simulação e versão do prompt
 * reutilizam a mesma Promise. Quando a requisição termina, seja
 * com sucesso ou erro, ela é removida do mapa.
 */
export function requestFinancialInsights(
  simulation: SavedSimulation,
  signal?: AbortSignal,
): Promise<FinancialInsightsApiResponse> {
  const requestKey = `${simulation.id}:${simulation.promptVersion}`;

  const existingRequest = pendingRequests.get(requestKey);

  if (existingRequest) {
    return existingRequest;
  }

  const request = executeFinancialInsightsRequest(simulation, signal).finally(
    () => {
      pendingRequests.delete(requestKey);
    },
  );

  pendingRequests.set(requestKey, request);

  return request;
}
