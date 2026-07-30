import type {
  SimulationInput,
  SimulationResult,
  ViabilityStatus,
} from "../types/finance";

/**
 * Arredonda valores monetários para duas casas decimais.
 *
 * A utilização do valor absoluto mantém o comportamento do
 * arredondamento consistente tanto para valores positivos quanto
 * para saldos negativos.
 */
function roundCurrency(value: number): number {
  const roundedAbsoluteValue =
    Math.round((Math.abs(value) + Number.EPSILON) * 100) / 100;

  return Math.sign(value) * roundedAbsoluteValue;
}

/**
 * Garante que um valor recebido pela regra financeira seja
 * um número finito.
 *
 * Valores como NaN e Infinity não representam quantias financeiras
 * válidas e poderiam comprometer todos os cálculos posteriores.
 */
function assertFiniteNumber(value: number, fieldName: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${fieldName} deve ser um número válido.`);
  }
}

/**
 * Valida os dados antes de executar qualquer cálculo.
 *
 * Mesmo que a interface já faça validações, a regra de negócio deve
 * proteger-se de chamadas realizadas por outros componentes, testes
 * ou futuras integrações.
 */
function validateSimulationInput(input: SimulationInput): void {
  assertFiniteNumber(input.rendaMensalBruta, "A renda mensal bruta");

  assertFiniteNumber(input.custosFixosEssenciais, "Os custos fixos essenciais");

  assertFiniteNumber(
    input.dividasParceladasMensais,
    "As dívidas parceladas mensais",
  );

  assertFiniteNumber(input.custoDaMeta, "O custo da meta");

  assertFiniteNumber(input.prazoDesejadoEmMeses, "O prazo desejado");

  if (input.rendaMensalBruta <= 0) {
    throw new RangeError("A renda mensal bruta deve ser maior que zero.");
  }

  if (input.custosFixosEssenciais < 0) {
    throw new RangeError("Os custos fixos essenciais não podem ser negativos.");
  }

  if (input.dividasParceladasMensais < 0) {
    throw new RangeError(
      "As dívidas parceladas mensais não podem ser negativas.",
    );
  }

  if (!input.meta.trim()) {
    throw new RangeError("A meta financeira deve ser informada.");
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
}

/**
 * Determina o status de viabilidade da meta financeira.
 *
 * Regras:
 * - viable: saldo maior ou igual a zero.
 * - needs_adjustments: déficit de até 20% da economia necessária.
 * - unfeasible: déficit superior a 20% da economia necessária.
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
 * Executa os cálculos financeiros principais do Grana Clara.
 *
 * A função é pura:
 * - Não altera os dados recebidos.
 * - Não acessa navegador ou API.
 * - Sempre produz o mesmo resultado para a mesma entrada.
 *
 * O Gemini deverá interpretar o resultado já calculado, sem assumir
 * responsabilidade pelos cálculos financeiros principais.
 */
export function calculateSimulation(input: SimulationInput): SimulationResult {
  validateSimulationInput(input);

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
