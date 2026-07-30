/**
 * Situação financeira atual identificada no onboarding.
 */
export type FinancialSituation =
  | "in_debt"
  | "balanced_no_surplus"
  | "saving"
  | "unknown";

/**
 * Principal fonte de renda da pessoa usuária.
 */
export type IncomeSource =
  | "employee"
  | "self_employed"
  | "business_owner"
  | "no_fixed_income";

/**
 * Nível atual de controle sobre os gastos mensais.
 */
export type ExpenseControl =
  | "tracks_everything"
  | "rough_idea"
  | "no_idea"
  | "starting_now";

/**
 * Objetivo financeiro principal informado no onboarding.
 */
export type FinancialGoal =
  | "pay_debts"
  | "start_saving"
  | "emergency_fund"
  | "purchase_or_trip";

/**
 * Prazo inicial imaginado para alcançar o objetivo.
 */
export type GoalDeadline =
  | "less_than_six_months"
  | "six_to_twelve_months"
  | "more_than_one_year"
  | "undefined";

/**
 * Nível de familiaridade da pessoa usuária com finanças.
 */
export type FinancialKnowledge =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "learning_from_zero";

/**
 * Frequência pretendida de utilização do Grana Clara.
 */
export type AppUsageTime =
  | "less_than_five_minutes_daily"
  | "fifteen_minutes_weekly"
  | "on_payday"
  | "undefined";

/**
 * Respostas completas do onboarding.
 *
 * Este objeto será utilizado posteriormente para:
 * - Personalizar a linguagem dos insights.
 * - Identificar o perfil financeiro educativo.
 * - Enviar contexto estruturado para a IA.
 * - Salvar a simulação no histórico.
 */
export type OnboardingAnswers = {
  situacaoFinanceiraAtual: FinancialSituation;
  fonteDeRenda: IncomeSource;
  controleDosGastos: ExpenseControl;
  objetivoPrincipal: FinancialGoal;
  prazoObjetivo: GoalDeadline;
  nivelConhecimento: FinancialKnowledge;
  tempoDisponivel: AppUsageTime;
};

/**
 * Identificadores válidos das perguntas do onboarding.
 */
export type OnboardingQuestionId = keyof OnboardingAnswers;

/**
 * União de todos os valores possíveis das respostas.
 */
export type OnboardingAnswerValue = OnboardingAnswers[OnboardingQuestionId];

/**
 * Estado parcial utilizado enquanto o usuário ainda está
 * respondendo às perguntas.
 */
export type OnboardingDraft = Partial<OnboardingAnswers>;

export type OnboardingOption = {
  value: OnboardingAnswerValue;
  label: string;
  description?: string;
};

export type OnboardingQuestion = {
  id: OnboardingQuestionId;
  block: string;
  title: string;
  description: string;
  options: readonly OnboardingOption[];
};
