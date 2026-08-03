import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AIInsightsApiError,
  requestFinancialInsights,
} from "../../services/aiInsightsApi";
import {
  SimulationStorageError,
  updateSimulationAIInsights,
} from "../../services/simulationStorage";
import type { AIInsights } from "../../types/ai";
import type { SavedSimulation } from "../../types/simulation";
import { AIInsightsPanel } from "./AIInsightsPanel";

/**
 * Preserva as classes reais de erro e substitui somente
 * a função responsável pela requisição.
 */
vi.mock("../../services/aiInsightsApi", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../services/aiInsightsApi")>();

  return {
    ...actual,
    requestFinancialInsights: vi.fn(),
  };
});

/**
 * Preserva o serviço real e substitui somente a persistência
 * utilizada pelo painel.
 */
vi.mock("../../services/simulationStorage", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../services/simulationStorage")>();

  return {
    ...actual,
    updateSimulationAIInsights: vi.fn(),
  };
});

const mockedRequestFinancialInsights = vi.mocked(requestFinancialInsights);

const mockedUpdateSimulationAIInsights = vi.mocked(updateSimulationAIInsights);

const insights: AIInsights = {
  titulo: "Sua meta está ao alcance",

  resumo: "A compra do notebook é viável.",

  diagnostico: "Existe capacidade mensal suficiente para alcançar a meta.",

  statusInterpretado: "A meta cabe no orçamento atual.",

  pontosDeAtencao: ["Acompanhe os gastos variáveis."],

  recomendacoes: ["Separe o valor da meta no início do mês."],

  proximosPassos: ["Crie uma reserva específica para o notebook."],

  mensagemFinal: "Com organização, sua meta pode ser alcançada.",
};

const simulation: SavedSimulation = {
  id: "simulation-insights-test",

  createdAt: "2026-08-03T12:00:00.000Z",

  promptVersion: "financial-educator-v2",

  input: {
    rendaMensalBruta: 4000,
    custosFixosEssenciais: 2100,
    dividasParceladasMensais: 500,
    meta: "Comprar um notebook",
    custoDaMeta: 10800,
    prazoDesejadoEmMeses: 12,
  },

  result: {
    valorDisponivelPorMes: 1400,
    economiaMensalNecessaria: 900,
    saldoAposReservaParaMeta: 500,
    status: "viable",
  },

  onboarding: {
    situacaoFinanceiraAtual: "balanced_no_surplus",

    fonteDeRenda: "employee",

    controleDosGastos: "rough_idea",

    objetivoPrincipal: "purchase_or_trip",

    prazoObjetivo: "six_to_twelve_months",

    nivelConhecimento: "beginner",

    tempoDisponivel: "less_than_five_minutes_daily",
  },
};

const apiResponse = {
  insights,

  model: "gemini-3.6-flash",

  promptVersion: "financial-educator-v2",
};

const persistedSimulation: SavedSimulation = {
  ...simulation,

  aiInsights: insights,

  aiModel: apiResponse.model,
};

describe("AIInsightsPanel", () => {
  beforeEach(() => {
    mockedRequestFinancialInsights.mockReset();

    mockedUpdateSimulationAIInsights.mockReset();

    mockedUpdateSimulationAIInsights.mockReturnValue(persistedSimulation);
  });

  it("apresenta insights persistidos sem realizar nova requisição", () => {
    render(<AIInsightsPanel simulation={persistedSimulation} />);

    expect(
      screen.getByRole("article", {
        name: insights.titulo,
      }),
    ).toBeInTheDocument();

    expect(screen.getByText(insights.diagnostico)).toBeInTheDocument();

    expect(
      screen.getByText(`Análise gerada com ${apiResponse.model}.`),
    ).toBeInTheDocument();

    expect(mockedRequestFinancialInsights).not.toHaveBeenCalled();

    expect(mockedUpdateSimulationAIInsights).not.toHaveBeenCalled();
  });

  it("gera, persiste e apresenta novos insights automaticamente", async () => {
    mockedRequestFinancialInsights.mockResolvedValue(apiResponse);

    render(<AIInsightsPanel simulation={simulation} />);

    expect(
      screen.getByRole("status", {
        name: "Gerando análise financeira personalizada",
      }),
    ).toHaveAttribute("aria-busy", "true");

    expect(
      await screen.findByRole("article", {
        name: insights.titulo,
      }),
    ).toBeInTheDocument();

    expect(mockedRequestFinancialInsights).toHaveBeenCalledTimes(1);

    expect(mockedRequestFinancialInsights).toHaveBeenCalledWith(simulation);

    expect(mockedUpdateSimulationAIInsights).toHaveBeenCalledWith(
      simulation.id,
      apiResponse,
    );
  });

  it("apresenta uma mensagem amigável e focaliza o erro de indisponibilidade", async () => {
    mockedRequestFinancialInsights.mockRejectedValue(
      new AIInsightsApiError("Serviço ocupado.", 503),
    );

    render(<AIInsightsPanel simulation={simulation} />);

    const alert = await screen.findByRole("alert", {
      name: "Análise personalizada indisponível",
    });

    expect(alert).toHaveTextContent(
      "O educador financeiro está temporariamente ocupado. Tente novamente em alguns instantes.",
    );

    expect(alert).toHaveTextContent(
      "Seus cálculos e sua simulação foram preservados normalmente.",
    );

    const errorContainer = alert.parentElement;

    expect(errorContainer).not.toBeNull();

    await waitFor(() => {
      expect(errorContainer).toHaveFocus();
    });

    expect(
      screen.getByRole("button", {
        name: "Tentar novamente",
      }),
    ).toBeEnabled();
  });

  it("permite tentar novamente depois de uma falha de conexão", async () => {
    mockedRequestFinancialInsights
      .mockRejectedValueOnce(new TypeError("Falha de conexão."))
      .mockResolvedValueOnce(apiResponse);

    render(<AIInsightsPanel simulation={simulation} />);

    const retryButton = await screen.findByRole("button", {
      name: "Tentar novamente",
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Não foi possível conectar ao serviço de análise. Verifique sua conexão.",
    );

    fireEvent.click(retryButton);

    expect(
      screen.getByRole("status", {
        name: "Gerando análise financeira personalizada",
      }),
    ).toBeInTheDocument();

    expect(
      await screen.findByRole("article", {
        name: insights.titulo,
      }),
    ).toBeInTheDocument();

    expect(mockedRequestFinancialInsights).toHaveBeenCalledTimes(2);

    expect(mockedUpdateSimulationAIInsights).toHaveBeenCalledTimes(1);
  });

  it("explica quando a análise foi gerada mas não pôde ser persistida", async () => {
    mockedRequestFinancialInsights.mockResolvedValue(apiResponse);

    mockedUpdateSimulationAIInsights.mockImplementation(() => {
      throw new SimulationStorageError("Falha ao salvar.");
    });

    render(<AIInsightsPanel simulation={simulation} />);

    const alert = await screen.findByRole("alert", {
      name: "Análise personalizada indisponível",
    });

    expect(alert).toHaveTextContent(
      "A análise foi gerada, mas não foi possível salvá-la no histórico. Tente novamente.",
    );

    expect(mockedRequestFinancialInsights).toHaveBeenCalledTimes(1);

    expect(mockedUpdateSimulationAIInsights).toHaveBeenCalledTimes(1);
  });
});
