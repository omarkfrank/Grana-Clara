import { GoogleGenAI } from "@google/genai";

import {
  aiInsightsJsonSchema,
  aiInsightsSchema,
  type AIInsights,
} from "../../src/schemas/aiInsightsSchema.js";

import { buildFinancialInsightsPrompt } from "../prompts/buildFinancialInsightsPrompt.js";

import type { FinancialInsightsRequest } from "../schemas/financialInsightsRequestSchema.js";

/**
 * Modelo utilizado quando GEMINI_MODEL não estiver configurada.
 *
 * O mesmo fallback é utilizado pelo serviço de chat, evitando
 * que funcionalidades diferentes utilizem modelos distintos.
 */
const DEFAULT_GEMINI_MODEL = "gemini-3.6-flash";

/**
 * Erro lançado quando a integração com o Gemini não possui
 * as configurações mínimas necessárias.
 */
export class GeminiConfigurationError extends Error {
  constructor(message: string) {
    super(message);

    this.name = "GeminiConfigurationError";
  }
}

/**
 * Erro lançado quando o Gemini responde, mas o conteúdo retornado
 * não pode ser utilizado pela aplicação.
 */
export class GeminiResponseError extends Error {
  constructor(message: string) {
    super(message);

    this.name = "GeminiResponseError";
  }
}

/**
 * Estrutura retornada pelo serviço de geração de insights.
 */
type GeneratedFinancialInsights = {
  insights: AIInsights;
  model: string;
};

/**
 * Gera e valida os insights financeiros.
 *
 * A chave da API existe somente no ambiente do servidor e nunca
 * é incorporada ao bundle ou enviada ao navegador.
 */
export async function generateFinancialInsights(
  request: FinancialInsightsRequest,
): Promise<GeneratedFinancialInsights> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new GeminiConfigurationError(
      "A variável GEMINI_API_KEY não está configurada.",
    );
  }

  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;

  const ai = new GoogleGenAI({
    apiKey,
  });

  const prompt = buildFinancialInsightsPrompt(request);

  const response = await ai.models.generateContent({
    model,

    contents: prompt,

    config: {
      /**
       * Solicita que o Gemini retorne exclusivamente JSON.
       */
      responseMimeType: "application/json",

      /**
       * Define a estrutura esperada diretamente na solicitação
       * enviada ao modelo.
       */
      responseSchema: aiInsightsJsonSchema,
    },
  });

  const responseText = response.text?.trim();

  if (!responseText) {
    throw new GeminiResponseError("O Gemini retornou uma resposta vazia.");
  }

  let parsedResponse: unknown;

  try {
    parsedResponse = JSON.parse(responseText);
  } catch {
    throw new GeminiResponseError("O Gemini retornou um JSON inválido.");
  }

  /**
   * A validação local permanece necessária mesmo quando o schema
   * é informado ao Gemini.
   *
   * Dessa forma, nenhum conteúdo inesperado chega ao frontend.
   */
  const validationResult = aiInsightsSchema.safeParse(parsedResponse);

  if (!validationResult.success) {
    console.error(
      "A resposta de insights não corresponde ao schema esperado:",
      validationResult.error.flatten(),
    );

    throw new GeminiResponseError(
      "A resposta do Gemini não corresponde ao formato esperado.",
    );
  }

  return {
    insights: validationResult.data,

    model,
  };
}
