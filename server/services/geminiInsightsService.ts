import { GoogleGenAI } from "@google/genai";

import {
  aiInsightsJsonSchema,
  aiInsightsSchema,
  type AIInsights,
} from "../../src/schemas/aiInsightsSchema.js";

import { buildFinancialInsightsPrompt } from "../prompts/buildFinancialInsightsPrompt.js";

import type { FinancialInsightsRequest } from "../schemas/financialInsightsRequestSchema.js";

const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash";

export class GeminiConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiConfigurationError";
  }
}

export class GeminiResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiResponseError";
  }
}

type GeneratedFinancialInsights = {
  insights: AIInsights;
  model: string;
};

/**
 * Gera e valida os insights financeiros.
 *
 * A chave da API existe somente no ambiente
 * do servidor e nunca é enviada ao navegador.
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
      responseMimeType: "application/json",
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

  const validationResult = aiInsightsSchema.safeParse(parsedResponse);

  if (!validationResult.success) {
    console.error(validationResult.error.flatten());

    throw new GeminiResponseError(
      "A resposta do Gemini não corresponde ao formato esperado.",
    );
  }

  return {
    insights: validationResult.data,
    model,
  };
}
