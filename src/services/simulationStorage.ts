import {
  CURRENT_PROMPT_VERSION,
  SIMULATION_STORAGE_KEY,
  SIMULATION_STORAGE_VERSION,
} from "../constants/simulation";
import { aiInsightsSchema } from "../schemas/aiInsightsSchema";
import type {
  SimulationInput,
  SimulationResult,
  ViabilityStatus,
} from "../types/finance";
import type { OnboardingAnswers } from "../types/onboarding";
import type { SavedSimulation } from "../types/simulation";

import type { FinancialInsightsApiResponse } from "./aiInsightsApi";

/**
 * Envelope versionado utilizado para persistir as simulações.
 *
 * A versão permitirá realizar migrações caso a estrutura dos
 * dados armazenados seja alterada futuramente.
 */
type StorageEnvelope = {
  version: number;
  simulations: SavedSimulation[];
};

/**
 * Dados necessários para criar uma nova simulação.
 *
 * Identificador, data e versão do prompt são definidos
 * internamente pelo serviço.
 */
type SaveSimulationData = {
  input: SimulationInput;
  result: SimulationResult;
  onboarding: OnboardingAnswers;
};

/**
 * Status financeiros reconhecidos pela aplicação.
 */
const viabilityStatuses: readonly ViabilityStatus[] = [
  "viable",
  "needs_adjustments",
  "unfeasible",
];

/**
 * Erro específico para falhas relacionadas ao armazenamento local.
 */
export class SimulationStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SimulationStorageError";
  }
}

/**
 * Verifica se um valor desconhecido é um objeto comum.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Verifica se um valor é um número finito.
 */
function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Verifica se o status recuperado do armazenamento é reconhecido.
 */
function isViabilityStatus(value: unknown): value is ViabilityStatus {
  return (
    typeof value === "string" &&
    viabilityStatuses.includes(value as ViabilityStatus)
  );
}

/**
 * Valida estruturalmente os dados financeiros de entrada.
 *
 * O localStorage pode ser alterado manualmente pelo usuário,
 * pelo navegador ou por extensões. Por isso, seu conteúdo
 * precisa ser validado antes de ser utilizado pela aplicação.
 */
function isSimulationInput(value: unknown): value is SimulationInput {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isFiniteNumber(value.rendaMensalBruta) &&
    isFiniteNumber(value.custosFixosEssenciais) &&
    isFiniteNumber(value.dividasParceladasMensais) &&
    typeof value.meta === "string" &&
    isFiniteNumber(value.custoDaMeta) &&
    isFiniteNumber(value.prazoDesejadoEmMeses)
  );
}

/**
 * Valida estruturalmente um resultado financeiro.
 */
function isSimulationResult(value: unknown): value is SimulationResult {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isFiniteNumber(value.valorDisponivelPorMes) &&
    isFiniteNumber(value.economiaMensalNecessaria) &&
    isFiniteNumber(value.saldoAposReservaParaMeta) &&
    isViabilityStatus(value.status)
  );
}

/**
 * Valida a estrutura mínima das respostas do onboarding.
 */
function isOnboardingAnswers(value: unknown): value is OnboardingAnswers {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.situacaoFinanceiraAtual === "string" &&
    typeof value.fonteDeRenda === "string" &&
    typeof value.controleDosGastos === "string" &&
    typeof value.objetivoPrincipal === "string" &&
    typeof value.prazoObjetivo === "string" &&
    typeof value.nivelConhecimento === "string" &&
    typeof value.tempoDisponivel === "string"
  );
}

/**
 * Valida uma simulação recuperada do navegador.
 *
 * Os campos aiInsights e aiModel são opcionais para manter
 * compatibilidade com simulações criadas antes da integração
 * com a inteligência artificial.
 */
function isSavedSimulation(value: unknown): value is SavedSimulation {
  if (!isRecord(value)) {
    return false;
  }

  const hasValidAIInsights =
    value.aiInsights === undefined ||
    aiInsightsSchema.safeParse(value.aiInsights).success;

  const hasValidAIModel =
    value.aiModel === undefined ||
    (typeof value.aiModel === "string" && value.aiModel.trim().length > 0);

  return (
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.createdAt === "string" &&
    value.createdAt.length > 0 &&
    isSimulationInput(value.input) &&
    isSimulationResult(value.result) &&
    isOnboardingAnswers(value.onboarding) &&
    typeof value.promptVersion === "string" &&
    value.promptVersion.length > 0 &&
    hasValidAIInsights &&
    hasValidAIModel
  );
}

/**
 * Valida o envelope completo persistido no localStorage.
 */
function isStorageEnvelope(value: unknown): value is StorageEnvelope {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.version === SIMULATION_STORAGE_VERSION &&
    Array.isArray(value.simulations) &&
    value.simulations.every(isSavedSimulation)
  );
}

/**
 * Obtém o localStorage somente quando o código está sendo
 * executado no navegador.
 */
function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

/**
 * Retorna um envelope vazio e estruturalmente válido.
 */
function createEmptyEnvelope(): StorageEnvelope {
  return {
    version: SIMULATION_STORAGE_VERSION,

    simulations: [],
  };
}

/**
 * Recupera e valida os dados persistidos.
 *
 * Se o armazenamento estiver vazio, corrompido ou em uma versão
 * incompatível, retornamos uma coleção vazia sem interromper
 * o funcionamento da interface.
 */
function readStorageEnvelope(): StorageEnvelope {
  const storage = getBrowserStorage();

  if (!storage) {
    return createEmptyEnvelope();
  }

  const storedValue = storage.getItem(SIMULATION_STORAGE_KEY);

  if (!storedValue) {
    return createEmptyEnvelope();
  }

  try {
    const parsedValue: unknown = JSON.parse(storedValue);

    if (!isStorageEnvelope(parsedValue)) {
      console.warn("O histórico salvo possui uma estrutura incompatível.");

      return createEmptyEnvelope();
    }

    return parsedValue;
  } catch {
    console.warn("Não foi possível interpretar o histórico salvo.");

    return createEmptyEnvelope();
  }
}

/**
 * Persiste o envelope completo no navegador.
 */
function writeStorageEnvelope(envelope: StorageEnvelope): void {
  const storage = getBrowserStorage();

  if (!storage) {
    throw new SimulationStorageError(
      "O armazenamento local não está disponível neste ambiente.",
    );
  }

  try {
    storage.setItem(SIMULATION_STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    throw new SimulationStorageError(
      "Não foi possível salvar os dados no navegador.",
    );
  }
}

/**
 * Gera um identificador único para uma nova simulação.
 */
function createSimulationId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return [
    "simulation",
    Date.now(),
    Math.random().toString(36).slice(2, 10),
  ].join("-");
}

/**
 * Lista todas as simulações começando pela mais recente.
 */
export function getAllSimulations(): SavedSimulation[] {
  const { simulations } = readStorageEnvelope();

  return [...simulations].sort(
    (firstSimulation, secondSimulation) =>
      new Date(secondSimulation.createdAt).getTime() -
      new Date(firstSimulation.createdAt).getTime(),
  );
}

/**
 * Recupera uma simulação específica pelo identificador.
 */
export function getSimulationById(
  simulationId: string,
): SavedSimulation | null {
  return (
    getAllSimulations().find((simulation) => simulation.id === simulationId) ??
    null
  );
}

/**
 * Cria e salva uma nova simulação.
 *
 * Esta função deve ser utilizada somente na criação inicial.
 * Atualizações de registros existentes possuem funções próprias.
 */
export function saveSimulation({
  input,
  result,
  onboarding,
}: SaveSimulationData): SavedSimulation {
  const simulations = getAllSimulations();

  const newSimulation: SavedSimulation = {
    id: createSimulationId(),

    createdAt: new Date().toISOString(),

    input,
    result,
    onboarding,

    promptVersion: CURRENT_PROMPT_VERSION,
  };

  writeStorageEnvelope({
    version: SIMULATION_STORAGE_VERSION,

    simulations: [newSimulation, ...simulations],
  });

  return newSimulation;
}

/**
 * Adiciona os insights gerados pela IA a uma simulação existente.
 *
 * Diferentemente de saveSimulation, esta função:
 * - Não gera um novo identificador.
 * - Não altera a data de criação.
 * - Não cria uma segunda entrada no histórico.
 * - Atualiza exatamente o registro utilizado pela página atual.
 */
export function updateSimulationAIInsights(
  simulationId: string,
  aiResponse: FinancialInsightsApiResponse,
): SavedSimulation {
  const simulations = getAllSimulations();

  let updatedSimulation: SavedSimulation | null = null;

  const updatedSimulations = simulations.map((simulation) => {
    if (simulation.id !== simulationId) {
      return simulation;
    }

    updatedSimulation = {
      ...simulation,

      aiInsights: aiResponse.insights,

      aiModel: aiResponse.model,

      promptVersion: aiResponse.promptVersion,
    };

    return updatedSimulation;
  });

  if (!updatedSimulation) {
    throw new SimulationStorageError(
      "Não foi possível atualizar uma simulação inexistente.",
    );
  }

  writeStorageEnvelope({
    version: SIMULATION_STORAGE_VERSION,

    simulations: updatedSimulations,
  });

  return updatedSimulation;
}

/**
 * Exclui uma simulação pelo identificador.
 *
 * Retorna true quando um registro foi efetivamente removido.
 */
export function deleteSimulation(simulationId: string): boolean {
  const simulations = getAllSimulations();

  const remainingSimulations = simulations.filter(
    (simulation) => simulation.id !== simulationId,
  );

  if (remainingSimulations.length === simulations.length) {
    return false;
  }

  writeStorageEnvelope({
    version: SIMULATION_STORAGE_VERSION,

    simulations: remainingSimulations,
  });

  return true;
}

/**
 * Exclui todas as simulações persistidas.
 */
export function clearSimulations(): void {
  writeStorageEnvelope(createEmptyEnvelope());
}
