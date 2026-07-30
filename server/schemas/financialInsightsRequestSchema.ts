import { z } from "zod";

const simulationInputSchema = z
  .object({
    rendaMensalBruta: z.number().finite().positive(),

    custosFixosEssenciais: z.number().finite().nonnegative(),

    dividasParceladasMensais: z.number().finite().nonnegative(),

    meta: z.string().trim().min(1).max(120),

    custoDaMeta: z.number().finite().positive(),

    prazoDesejadoEmMeses: z.number().int().positive().max(600),
  })
  .strict();

const simulationResultSchema = z
  .object({
    valorDisponivelPorMes: z.number().finite(),

    economiaMensalNecessaria: z.number().finite().nonnegative(),

    saldoAposReservaParaMeta: z.number().finite(),

    status: z.enum(["viable", "needs_adjustments", "unfeasible"]),
  })
  .strict();

const onboardingAnswersSchema = z
  .object({
    situacaoFinanceiraAtual: z.enum([
      "in_debt",
      "balanced_no_surplus",
      "saving",
      "unknown",
    ]),

    fonteDeRenda: z.enum([
      "employee",
      "self_employed",
      "business_owner",
      "no_fixed_income",
    ]),

    controleDosGastos: z.enum([
      "tracks_everything",
      "rough_idea",
      "no_idea",
      "starting_now",
    ]),

    objetivoPrincipal: z.enum([
      "pay_debts",
      "start_saving",
      "emergency_fund",
      "purchase_or_trip",
    ]),

    prazoObjetivo: z.enum([
      "less_than_six_months",
      "six_to_twelve_months",
      "more_than_one_year",
      "undefined",
    ]),

    nivelConhecimento: z.enum([
      "beginner",
      "intermediate",
      "advanced",
      "learning_from_zero",
    ]),

    tempoDisponivel: z.enum([
      "less_than_five_minutes_daily",
      "fifteen_minutes_weekly",
      "on_payday",
      "undefined",
    ]),
  })
  .strict();

/**
 * Contrato aceito pelo endpoint de geração de insights.
 */
export const financialInsightsRequestSchema = z
  .object({
    simulationId: z.string().trim().min(1).max(200),

    promptVersion: z.string().trim().min(1).max(100),

    input: simulationInputSchema,

    result: simulationResultSchema,

    onboarding: onboardingAnswersSchema,
  })
  .strict();

export type FinancialInsightsRequest = z.infer<
  typeof financialInsightsRequestSchema
>;
