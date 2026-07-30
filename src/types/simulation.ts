import type { AIInsights } from "./ai";
import type { SimulationInput, SimulationResult } from "./finance";
import type { OnboardingAnswers } from "./onboarding";

/**
 * Representa uma simulação completa persistida no navegador.
 *
 * Além dos dados financeiros e do resultado, armazenamos:
 * - Identificador único.
 * - Data de criação.
 * - Respostas do onboarding.
 * - Versão do prompt da IA.
 * - Insights opcionais, quando já tiverem sido gerados.
 */
export type SavedSimulation = {
  id: string;
  createdAt: string;
  input: SimulationInput;
  result: SimulationResult;
  onboarding: OnboardingAnswers;
  aiInsights?: AIInsights;
  promptVersion: string;
};
