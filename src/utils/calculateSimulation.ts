import type {
  SimulationInput,
  SimulationResult,
  ViabilityStatus,
} from "../types/finance";

/**
 * Arredonda valores monetários para duas casas decimais.
 *
 * Isso reduz pequenas inconsistências causadas pela representação
 * interna de números decimais no JavaScript.
 */
function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Determina o status de viabilidade da meta financeira.
 *
 * Regras:
 * - viable: o saldo final é maior ou igual a zero.
 * - needs_adjustments: o déficit é de até 20% da economia necessária.
 * - unfeasible: o déficit supera 20% da economia necessária.
 */
function calculateViabilityStatus(
  saldoAposReservaParaMeta: number,
  economiaMensalNecessaria: number,
): ViabilityStatus {
  if (saldoAposReservaParaMeta >= 0) {
    return "viable";
  }

  const deficit = Math.abs(saldoAposReservaParaMeta);
  const adjustmentLimit = economiaMensalNecessaria * 0.2;

  if (deficit <= adjustmentLimit) {
    return "needs_adjustments";
  }

  return "unfeasible";
}

/**
 * Executa os cálculos financeiros principais da aplicação.
 *
 * A função é pura:
 * - Não altera os dados recebidos.
 * - Não acessa navegador ou API.
 * - Sempre retorna o mesmo resultado para a mesma entrada.
 *
 * O Gemini deverá apenas interpretar estes resultados. A IA não será
 * responsável pelos cálculos financeiros principais.
 */
export function calculateSimulation(input: SimulationInput): SimulationResult {
  if (input.rendaMensalBruta <= 0) {
    throw new RangeError("A renda mensal bruta deve ser maior que zero.");
  }

  if (input.custosFixosEssenciais < 0 || input.dividasParceladasMensais < 0) {
    throw new RangeError(
      "Custos e dívidas não podem possuir valores negativos.",
    );
  }

  if (input.custoDaMeta <= 0) {
    throw new RangeError("O custo da meta deve ser maior que zero.");
  }

  if (
    !Number.isInteger(input.prazoDesejadoEmMeses) ||
    input.prazoDesejadoEmMeses <= 0
  ) {
    throw new RangeError(
      "O prazo da meta deve ser um número inteiro maior que zero.",
    );
  }

  const valorDisponivelPorMes = roundCurrency(
    input.rendaMensalBruta -
      input.custosFixosEssenciais -
      input.dividasParceladasMensais,
  );

  const economiaMensalNecessaria = roundCurrency(
    input.custoDaMeta / input.prazoDesejadoEmMeses,
  );

  const saldoAposReservaParaMeta = roundCurrency(
    valorDisponivelPorMes - economiaMensalNecessaria,
  );

  const status = calculateViabilityStatus(
    saldoAposReservaParaMeta,
    economiaMensalNecessaria,
  );

  return {
    valorDisponivelPorMes,
    economiaMensalNecessaria,
    saldoAposReservaParaMeta,
    status,
  };
}
