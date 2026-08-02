import { z } from "zod";

import { financialInsightsRequestSchema } from "./financialInsightsRequestSchema.js";

/**
 * Quantidade máxima de caracteres permitida em uma pergunta
 * enviada pela pessoa usuária.
 */
const MAX_USER_MESSAGE_LENGTH = 600;

/**
 * Quantidade máxima de caracteres permitida em uma resposta
 * anterior do Educador Financeiro.
 *
 * Respostas da IA normalmente são maiores do que perguntas,
 * portanto precisam de um limite próprio.
 */
const MAX_ASSISTANT_MESSAGE_LENGTH = 6_000;

/**
 * Quantidade máxima de mensagens anteriores enviadas ao Gemini.
 *
 * O limite ajuda a controlar o tamanho da requisição e o consumo
 * de contexto da inteligência artificial.
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
 * O limite é maior porque respostas educativas podem conter
 * explicações, exemplos, listas e próximos passos.
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
 * Representa uma mensagem anterior da conversa.
 *
 * A união discriminada aplica limites diferentes de acordo com
 * o papel da mensagem:
 *
 * - user: até 600 caracteres.
 * - assistant: até 6.000 caracteres.
 */
export const financialChatMessageSchema = z.discriminatedUnion("role", [
  financialChatUserMessageSchema,
  financialChatAssistantMessageSchema,
]);

/**
 * Requisição completa enviada ao endpoint do chat.
 *
 * O schema reutiliza os dados exigidos pela análise financeira
 * inicial e adiciona:
 *
 * - A pergunta atual.
 * - O histórico recente da conversa.
 */
export const financialChatRequestSchema = financialInsightsRequestSchema.extend(
  {
    question: z
      .string()
      .trim()
      .min(2, "A pergunta deve possuir pelo menos dois caracteres.")
      .max(
        MAX_USER_MESSAGE_LENGTH,
        `A pergunta excedeu o limite de ${MAX_USER_MESSAGE_LENGTH} caracteres.`,
      ),

    history: z
      .array(financialChatMessageSchema)
      .max(
        MAX_HISTORY_MESSAGES,
        `O histórico excedeu o limite de ${MAX_HISTORY_MESSAGES} mensagens.`,
      )
      .default([]),
  },
);

export type FinancialChatMessage = z.infer<typeof financialChatMessageSchema>;

export type FinancialChatRequest = z.infer<typeof financialChatRequestSchema>;
