import { z } from "zod";

import type { SavedSimulation } from "../types/simulation";

/**
 * Quantidade máxima de caracteres permitida em uma pergunta
 * enviada pela pessoa usuária.
 */
const MAX_USER_MESSAGE_LENGTH = 600;

/**
 * Quantidade máxima de caracteres permitida em uma resposta
 * anterior do Educador Financeiro.
 */
const MAX_ASSISTANT_MESSAGE_LENGTH = 6_000;

/**
 * Quantidade máxima de mensagens anteriores enviadas ao backend.
 */
const MAX_HISTORY_MESSAGES = 12;

/**
 * Valida uma mensagem anterior enviada pela pessoa usuária.
 */
const financialChatUserMessageSchema = z.object({
  role: z.literal("user"),

  content: z
    .string()
    .trim()
    .min(1, "A mensagem do usuário não pode estar vazia.")
    .max(
      MAX_USER_MESSAGE_LENGTH,
      `A mensagem do usuário excedeu o limite de ${MAX_USER_MESSAGE_LENGTH} caracteres.`,
    ),
});

/**
 * Valida uma resposta anterior produzida pelo Educador
 * Financeiro.
 *
 * Respostas da inteligência artificial podem ser maiores do
 * que as perguntas, por isso utilizam um limite independente.
 */
const financialChatAssistantMessageSchema = z.object({
  role: z.literal("assistant"),

  content: z
    .string()
    .trim()
    .min(1, "A resposta do Educador Financeiro não pode estar vazia.")
    .max(
      MAX_ASSISTANT_MESSAGE_LENGTH,
      `A resposta do Educador Financeiro excedeu o limite de ${MAX_ASSISTANT_MESSAGE_LENGTH} caracteres.`,
    ),
});

/**
 * Schema de uma mensagem anterior da conversa.
 *
 * A união discriminada permite aplicar uma regra específica
 * conforme o papel da mensagem.
 */
const financialChatHistoryMessageSchema = z.discriminatedUnion("role", [
  financialChatUserMessageSchema,
  financialChatAssistantMessageSchema,
]);

/**
 * Schema utilizado para validar a pergunta atual antes do envio.
 *
 * A mesma restrição também existe no backend, garantindo
 * validação nas duas extremidades da aplicação.
 */
const financialChatQuestionSchema = z
  .string()
  .trim()
  .min(2, "Escreva uma pergunta com pelo menos dois caracteres.")
  .max(
    MAX_USER_MESSAGE_LENGTH,
    `A pergunta excedeu o limite de ${MAX_USER_MESSAGE_LENGTH} caracteres.`,
  );

/**
 * Schema da resposta devolvida pelo endpoint do chat.
 */
const financialChatApiResponseSchema = z.object({
  answer: z
    .string()
    .trim()
    .min(1, "A resposta do Educador Financeiro está vazia.")
    .max(
      MAX_ASSISTANT_MESSAGE_LENGTH,
      "A resposta do Educador Financeiro excedeu o limite permitido.",
    ),

  model: z.string().trim().min(1),

  promptVersion: z.string().trim().min(1),
});

/**
 * Mensagem enviada no histórico da conversa.
 */
export type FinancialChatHistoryMessage = z.infer<
  typeof financialChatHistoryMessageSchema
>;

/**
 * Resposta validada recebida da API interna.
 */
export type FinancialChatApiResponse = z.infer<
  typeof financialChatApiResponseSchema
>;

/**
 * Estrutura completa enviada ao backend.
 */
type FinancialChatRequest = {
  simulationId: string;
  promptVersion: string;
  input: SavedSimulation["input"];
  result: SavedSimulation["result"];
  onboarding: SavedSimulation["onboarding"];
  question: string;
  history: FinancialChatHistoryMessage[];
};

/**
 * Erro especializado para falhas na comunicação com o chat.
 *
 * O status HTTP permite que a interface apresente mensagens
 * específicas para indisponibilidade, validação e limite de uso.
 */
export class FinancialChatApiError extends Error {
  public readonly status: number;

  public readonly details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);

    this.name = "FinancialChatApiError";

    this.status = status;

    this.details = details;
  }
}

/**
 * Verifica se um valor desconhecido é um objeto comum.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Lê a resposta HTTP sem presumir que o servidor sempre
 * retornará um JSON válido.
 */
async function readJsonResponse(response: Response): Promise<unknown> {
  const responseText = await response.text();

  if (!responseText.trim()) {
    return null;
  }

  try {
    return JSON.parse(responseText);
  } catch {
    throw new FinancialChatApiError(
      "O servidor retornou uma resposta inválida.",
      response.status,
    );
  }
}

/**
 * Converte a simulação e a conversa para o formato esperado
 * pelo endpoint POST /api/ai/chat.
 */
function buildRequestPayload(
  simulation: SavedSimulation,
  question: string,
  history: FinancialChatHistoryMessage[],
): FinancialChatRequest {
  return {
    simulationId: simulation.id,

    promptVersion: simulation.promptVersion,

    input: simulation.input,

    result: simulation.result,

    onboarding: simulation.onboarding,

    question,

    /**
     * Somente as doze mensagens mais recentes são enviadas.
     *
     * As mensagens mais antigas permanecem armazenadas e visíveis
     * no navegador, mas deixam de ocupar o contexto enviado à IA.
     */
    history: history.slice(-MAX_HISTORY_MESSAGES),
  };
}

/**
 * Envia uma pergunta contextualizada ao Educador Financeiro.
 *
 * O navegador acessa somente a API interna do Grana Clara.
 * A chave do Gemini permanece protegida no servidor.
 */
export async function requestFinancialChatAnswer(
  simulation: SavedSimulation,
  question: string,
  history: FinancialChatHistoryMessage[],
  signal?: AbortSignal,
): Promise<FinancialChatApiResponse> {
  const questionValidation = financialChatQuestionSchema.safeParse(question);

  if (!questionValidation.success) {
    throw new FinancialChatApiError(
      questionValidation.error.issues[0]?.message ??
        "A pergunta informada é inválida.",
      400,
      questionValidation.error.flatten(),
    );
  }

  const recentHistory = history.slice(-MAX_HISTORY_MESSAGES);

  const historyValidation = z
    .array(financialChatHistoryMessageSchema)
    .max(MAX_HISTORY_MESSAGES)
    .safeParse(recentHistory);

  if (!historyValidation.success) {
    const firstIssue = historyValidation.error.issues[0];

    throw new FinancialChatApiError(
      firstIssue?.message ??
        "O histórico da conversa possui uma estrutura inválida.",
      400,
      historyValidation.error.flatten(),
    );
  }

  const response = await fetch("/api/ai/chat", {
    method: "POST",

    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },

    body: JSON.stringify(
      buildRequestPayload(
        simulation,
        questionValidation.data,
        historyValidation.data,
      ),
    ),

    signal,
  });

  const responseData = await readJsonResponse(response);

  if (!response.ok) {
    const errorMessage =
      isRecord(responseData) && typeof responseData.error === "string"
        ? responseData.error
        : "Não foi possível obter uma resposta do Educador Financeiro.";

    const errorDetails = isRecord(responseData)
      ? responseData.details
      : undefined;

    throw new FinancialChatApiError(
      errorMessage,
      response.status,
      errorDetails,
    );
  }

  const responseValidation =
    financialChatApiResponseSchema.safeParse(responseData);

  if (!responseValidation.success) {
    throw new FinancialChatApiError(
      "A API retornou uma resposta em formato inesperado.",
      response.status,
      responseValidation.error.flatten(),
    );
  }

  return responseValidation.data;
}
