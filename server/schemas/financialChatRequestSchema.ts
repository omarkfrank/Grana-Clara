import { z } from "zod";

import { financialInsightsRequestSchema } from "./financialInsightsRequestSchema.js";

/**
 * Representa uma mensagem anterior da conversa.
 *
 * No frontend utilizamos os papéis "user" e "assistant".
 * Posteriormente, o serviço converte "assistant" para "model",
 * que é o papel reconhecido pela API Gemini.
 */
export const financialChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),

  content: z
    .string()
    .trim()
    .min(1, "A mensagem não pode estar vazia.")
    .max(1_200, "A mensagem excedeu o limite permitido."),
});

/**
 * Requisição completa enviada ao endpoint do chat.
 *
 * O schema reutiliza todos os dados já exigidos pela análise
 * financeira inicial e adiciona:
 * - A pergunta atual.
 * - O histórico recente da conversa.
 *
 * O histórico é limitado para controlar o tamanho das requisições
 * e evitar consumo desnecessário de tokens.
 */
export const financialChatRequestSchema = financialInsightsRequestSchema.extend(
  {
    question: z
      .string()
      .trim()
      .min(2, "A pergunta deve possuir pelo menos dois caracteres.")
      .max(600, "A pergunta excedeu o limite permitido."),

    history: z
      .array(financialChatMessageSchema)
      .max(12, "O histórico excedeu o limite de mensagens permitido.")
      .default([]),
  },
);

export type FinancialChatMessage = z.infer<typeof financialChatMessageSchema>;

export type FinancialChatRequest = z.infer<typeof financialChatRequestSchema>;
