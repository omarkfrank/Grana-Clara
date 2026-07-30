import type { ViabilityStatus } from "../types/finance";

type ViabilityStatusConfiguration = {
  label: string;
  badgeVariant: "success" | "warning" | "danger";
  message: string;
};

/**
 * Textos e estilos utilizados para apresentar cada classificação
 * de viabilidade financeira.
 *
 * A configuração é compartilhada pelas páginas de resultado
 * e histórico para evitar duplicação de textos e estilos.
 */
export const viabilityStatusConfiguration = {
  viable: {
    label: "Meta viável",
    badgeVariant: "success",
    message:
      "A meta pode ser alcançada no prazo informado considerando os dados atuais.",
  },

  needs_adjustments: {
    label: "Pequenos ajustes necessários",
    badgeVariant: "warning",
    message:
      "A meta está próxima de ser viável, mas exige pequenos ajustes no prazo ou nos gastos.",
  },

  unfeasible: {
    label: "Cenário precisa ser reorganizado",
    badgeVariant: "danger",
    message:
      "A meta exige ajustes mais relevantes no prazo, no valor ou na organização mensal.",
  },
} as const satisfies Record<ViabilityStatus, ViabilityStatusConfiguration>;
