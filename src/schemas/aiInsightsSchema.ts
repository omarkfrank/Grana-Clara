import { z } from "zod";

/**
 * Valida a estrutura dos insights produzidos pelo Gemini.
 *
 * O mesmo schema será utilizado:
 * - No servidor, para validar a resposta da IA.
 * - No cliente, para validar a resposta recebida da nossa API.
 */
export const aiInsightsSchema = z
  .object({
    titulo: z.string().trim().min(1).max(120),

    resumo: z.string().trim().min(1).max(500),

    diagnostico: z.string().trim().min(1).max(1200),

    statusInterpretado: z.string().trim().min(1).max(400),

    pontosDeAtencao: z.array(z.string().trim().min(1).max(350)).min(1).max(4),

    recomendacoes: z.array(z.string().trim().min(1).max(350)).min(1).max(4),

    proximosPassos: z.array(z.string().trim().min(1).max(350)).min(1).max(4),

    mensagemFinal: z.string().trim().min(1).max(500),
  })
  .strict();

export type AIInsights = z.infer<typeof aiInsightsSchema>;

/**
 * JSON Schema enviado ao Gemini.
 *
 * Ele restringe a resposta ao formato esperado pela aplicação.
 */
export const aiInsightsJsonSchema = {
  type: "object",

  properties: {
    titulo: {
      type: "string",
      description: "Título curto e educativo para o diagnóstico.",
    },

    resumo: {
      type: "string",
      description: "Resumo objetivo da situação financeira analisada.",
    },

    diagnostico: {
      type: "string",
      description:
        "Diagnóstico personalizado baseado nos valores da simulação.",
    },

    statusInterpretado: {
      type: "string",
      description: "Explicação simples do status de viabilidade calculado.",
    },

    pontosDeAtencao: {
      type: "array",
      description: "Principais pontos que merecem atenção.",
      minItems: 1,
      maxItems: 4,
      items: {
        type: "string",
      },
    },

    recomendacoes: {
      type: "array",
      description: "Recomendações práticas, educativas e realistas.",
      minItems: 1,
      maxItems: 4,
      items: {
        type: "string",
      },
    },

    proximosPassos: {
      type: "array",
      description: "Ações concretas que podem ser realizadas em seguida.",
      minItems: 1,
      maxItems: 4,
      items: {
        type: "string",
      },
    },

    mensagemFinal: {
      type: "string",
      description: "Mensagem final empática, responsável e motivadora.",
    },
  },

  required: [
    "titulo",
    "resumo",
    "diagnostico",
    "statusInterpretado",
    "pontosDeAtencao",
    "recomendacoes",
    "proximosPassos",
    "mensagemFinal",
  ],

  additionalProperties: false,
} as const;
