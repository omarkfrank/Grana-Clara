import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearSimulations,
  deleteSimulation,
  getAllSimulations,
} from "../services/simulationStorage";
import type { OnboardingAnswers } from "../types/onboarding";
import type { SavedSimulation } from "../types/simulation";
import { HistoryPage } from "./HistoryPage";

/**
 * Substitui somente as operações de armazenamento utilizadas
 * diretamente pela página.
 */
vi.mock("../services/simulationStorage", () => ({
  getAllSimulations: vi.fn(),
  deleteSimulation: vi.fn(),
  clearSimulations: vi.fn(),
}));

const mockedGetAllSimulations = vi.mocked(getAllSimulations);

const mockedDeleteSimulation = vi.mocked(deleteSimulation);

const mockedClearSimulations = vi.mocked(clearSimulations);

/**
 * Respostas válidas do onboarding compartilhadas pelas
 * simulações utilizadas nos testes.
 */
const onboardingAnswers: OnboardingAnswers = {
  situacaoFinanceiraAtual: "balanced_no_surplus",
  fonteDeRenda: "employee",
  controleDosGastos: "rough_idea",
  objetivoPrincipal: "purchase_or_trip",
  prazoObjetivo: "six_to_twelve_months",
  nivelConhecimento: "beginner",
  tempoDisponivel: "less_than_five_minutes_daily",
};

/**
 * Cria uma simulação válida para a suíte.
 */
function createSimulation({
  id,
  meta,
  createdAt,
  custoDaMeta,
  prazoDesejadoEmMeses,
  status,
}: {
  id: string;
  meta: string;
  createdAt: string;
  custoDaMeta: number;
  prazoDesejadoEmMeses: number;
  status: SavedSimulation["result"]["status"];
}): SavedSimulation {
  return {
    id,
    createdAt,
    promptVersion: "financial-educator-v2",

    input: {
      rendaMensalBruta: 5000,
      custosFixosEssenciais: 2500,
      dividasParceladasMensais: 500,
      meta,
      custoDaMeta,
      prazoDesejadoEmMeses,
    },

    result: {
      valorDisponivelPorMes: 2000,
      economiaMensalNecessaria: custoDaMeta / prazoDesejadoEmMeses,
      saldoAposReservaParaMeta: 1000,
      status,
    },

    onboarding: onboardingAnswers,
  };
}

/**
 * Simulação mais recente.
 */
const newerSimulation = createSimulation({
  id: "simulation-newer",
  meta: "Reserva para viagem",
  createdAt: "2026-08-03T12:00:00.000Z",
  custoDaMeta: 12000,
  prazoDesejadoEmMeses: 12,
  status: "viable",
});

/**
 * Simulação mais antiga.
 */
const olderSimulation = createSimulation({
  id: "simulation-older",
  meta: "Comprar um notebook",
  createdAt: "2026-07-20T12:00:00.000Z",
  custoDaMeta: 9000,
  prazoDesejadoEmMeses: 10,
  status: "needs_adjustments",
});

/**
 * Renderiza a página dentro do contexto mínimo do roteador.
 */
function renderHistoryPage(): void {
  render(
    <MemoryRouter initialEntries={["/historico"]}>
      <HistoryPage />
    </MemoryRouter>,
  );
}

describe("HistoryPage", () => {
  beforeEach(() => {
    mockedGetAllSimulations.mockReset();
    mockedDeleteSimulation.mockReset();
    mockedClearSimulations.mockReset();

    mockedGetAllSimulations.mockReturnValue([newerSimulation, olderSimulation]);

    mockedDeleteSimulation.mockReturnValue(true);

    mockedClearSimulations.mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("apresenta o estado vazio quando não existem simulações", () => {
    mockedGetAllSimulations.mockReturnValue([]);

    renderHistoryPage();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Histórico de simulações",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("status", {
        name: "Nenhuma simulação salva",
      }),
    ).toHaveAccessibleDescription(
      "Quando você concluir sua primeira simulação, ela aparecerá aqui para consulta.",
    );

    expect(
      screen.getByRole("link", {
        name: "Criar primeira simulação",
      }),
    ).toHaveAttribute("href", "/simulacao");

    expect(
      screen.queryByRole("button", {
        name: "Excluir todo o histórico",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("status", {
        name: "Quantidade de simulações",
      }),
    ).toHaveTextContent("0 simulações salvas.");
  });

  it("apresenta as simulações na ordem recebida do serviço", () => {
    renderHistoryPage();

    const simulationsList = screen.getByRole("list", {
      name: "Simulações salvas",
    });

    const simulationItems = within(simulationsList).getAllByRole("listitem");

    expect(simulationItems).toHaveLength(2);

    expect(
      within(simulationItems[0]).getByRole("heading", {
        level: 2,
        name: newerSimulation.input.meta,
      }),
    ).toBeInTheDocument();

    expect(
      within(simulationItems[1]).getByRole("heading", {
        level: 2,
        name: olderSimulation.input.meta,
      }),
    ).toBeInTheDocument();

    expect(
      within(simulationItems[0]).getByRole("link", {
        name: "Ver detalhes",
      }),
    ).toHaveAttribute("href", `/resultado/${newerSimulation.id}`);

    expect(
      within(simulationItems[1]).getByRole("link", {
        name: "Ver detalhes",
      }),
    ).toHaveAttribute("href", `/resultado/${olderSimulation.id}`);

    expect(
      screen.getByRole("status", {
        name: "Quantidade de simulações",
      }),
    ).toHaveTextContent("2 simulações salvas.");

    expect(mockedGetAllSimulations).toHaveBeenCalledTimes(1);
  });

  it("cancela a exclusão individual sem alterar o histórico", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

    renderHistoryPage();

    fireEvent.click(
      screen.getByRole("button", {
        name: `Excluir simulação ${newerSimulation.input.meta}`,
      }),
    );

    expect(confirmSpy).toHaveBeenCalledWith(
      `Deseja excluir a simulação "${newerSimulation.input.meta}"?`,
    );

    expect(mockedDeleteSimulation).not.toHaveBeenCalled();

    expect(
      screen.getByRole("heading", {
        name: newerSimulation.input.meta,
      }),
    ).toBeInTheDocument();
  });

  it("exclui uma simulação e atualiza a quantidade exibida", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderHistoryPage();

    fireEvent.click(
      screen.getByRole("button", {
        name: `Excluir simulação ${newerSimulation.input.meta}`,
      }),
    );

    expect(mockedDeleteSimulation).toHaveBeenCalledWith(newerSimulation.id);

    expect(
      screen.queryByRole("heading", {
        name: newerSimulation.input.meta,
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: olderSimulation.input.meta,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("status", {
        name: "Quantidade de simulações",
      }),
    ).toHaveTextContent("1 simulação salva.");
  });

  it("mantém a simulação e focaliza o erro quando o serviço retorna false", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);

    mockedDeleteSimulation.mockReturnValue(false);

    renderHistoryPage();

    fireEvent.click(
      screen.getByRole("button", {
        name: `Excluir simulação ${newerSimulation.input.meta}`,
      }),
    );

    const alert = await screen.findByRole("alert", {
      name: "Erro no histórico",
    });

    expect(alert).toHaveAccessibleDescription(
      "A simulação não foi encontrada no histórico e não pôde ser excluída.",
    );

    expect(
      screen.getByRole("heading", {
        name: newerSimulation.input.meta,
      }),
    ).toBeInTheDocument();

    const errorContainer = alert.parentElement;

    expect(errorContainer).not.toBeNull();

    await waitFor(() => {
      expect(errorContainer).toHaveFocus();
    });
  });

  it("trata falhas inesperadas durante a exclusão individual", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    vi.spyOn(window, "confirm").mockReturnValue(true);

    mockedDeleteSimulation.mockImplementation(() => {
      throw new Error("Falha no armazenamento.");
    });

    renderHistoryPage();

    fireEvent.click(
      screen.getByRole("button", {
        name: `Excluir simulação ${newerSimulation.input.meta}`,
      }),
    );

    const alert = await screen.findByRole("alert", {
      name: "Erro no histórico",
    });

    expect(alert).toHaveAccessibleDescription(
      "Não foi possível excluir a simulação.",
    );

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

    expect(
      screen.getByRole("heading", {
        name: newerSimulation.input.meta,
      }),
    ).toBeInTheDocument();
  });

  it("cancela a limpeza completa sem excluir os registros", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

    renderHistoryPage();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Excluir todo o histórico",
      }),
    );

    expect(confirmSpy).toHaveBeenCalledWith(
      "Deseja realmente excluir todas as simulações salvas?",
    );

    expect(mockedClearSimulations).not.toHaveBeenCalled();

    expect(
      screen.getByRole("list", {
        name: "Simulações salvas",
      }),
    ).toBeInTheDocument();
  });

  it("limpa todo o histórico e focaliza o estado vazio", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderHistoryPage();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Excluir todo o histórico",
      }),
    );

    expect(mockedClearSimulations).toHaveBeenCalledTimes(1);

    const emptyState = await screen.findByLabelText("Histórico vazio");

    await waitFor(() => {
      expect(emptyState).toHaveFocus();
    });

    expect(
      screen.queryByRole("list", {
        name: "Simulações salvas",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("status", {
        name: "Quantidade de simulações",
      }),
    ).toHaveTextContent("0 simulações salvas.");
  });

  it("trata falhas durante a limpeza completa do histórico", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    vi.spyOn(window, "confirm").mockReturnValue(true);

    mockedClearSimulations.mockImplementation(() => {
      throw new Error("Falha ao limpar o armazenamento.");
    });

    renderHistoryPage();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Excluir todo o histórico",
      }),
    );

    const alert = await screen.findByRole("alert", {
      name: "Erro no histórico",
    });

    expect(alert).toHaveAccessibleDescription(
      "Não foi possível limpar o histórico.",
    );

    const errorContainer = alert.parentElement;

    expect(errorContainer).not.toBeNull();

    await waitFor(() => {
      expect(errorContainer).toHaveFocus();
    });

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

    expect(
      screen.getByRole("list", {
        name: "Simulações salvas",
      }),
    ).toBeInTheDocument();
  });
});
