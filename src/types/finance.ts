/**
 * Dados preenchidos pelo usuário no formulário de simulação.
 *
 * Estes valores representam a entrada principal da regra de negócio.
 * A IA só deve receber os dados depois que a aplicação calcular
 * os resultados financeiros localmente.
 */
export type SimulationInput = {
  rendaMensalBruta: number;
  custosFixosEssenciais: number;
  dividasParceladasMensais: number;
  meta: string;
  custoDaMeta: number;
  prazoDesejadoEmMeses: number;
};

/**
 * Status calculado para indicar a viabilidade da meta financeira.
 *
 * viable:
 * A meta é possível no prazo informado.
 *
 * needs_adjustments:
 * A meta exige pequenos ajustes.
 *
 * unfeasible:
 * A meta exige ajustes maiores no cenário atual.
 */
export type ViabilityStatus = "viable" | "needs_adjustments" | "unfeasible";

/**
 * Resultado calculado localmente pela aplicação.
 *
 * Esses dados serão exibidos ao usuário e também enviados para a IA,
 * garantindo que o Gemini apenas interprete os resultados,
 * sem ser responsável pelos cálculos principais.
 */
export type SimulationResult = {
  valorDisponivelPorMes: number;
  economiaMensalNecessaria: number;
  saldoAposReservaParaMeta: number;
  status: ViabilityStatus;
};
