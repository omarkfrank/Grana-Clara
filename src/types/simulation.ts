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
 * - Modelo de IA utilizado na geração dos insights.
 */
export type SavedSimulation = {
  id: string;
  createdAt: string;
  input: SimulationInput;
  result: SimulationResult;
  onboarding: OnboardingAnswers;

  /**
   * Análise educacional gerada pela inteligência artificial.
   *
   * É opcional porque a simulação pode ser salva antes de a
   * geração dos insights ser concluída.
   */
  aiInsights?: AIInsights;

  /**
   * Identificador do modelo utilizado para gerar a análise.
   *
   * Exemplo: "gemini-3.6-flash".
   */
  aiModel?: string;

  /**
   * Versão do prompt utilizada na geração da análise.
   *
   * Permite rastrear mudanças futuras na estratégia de prompt.
   */
  promptVersion: string;
};
