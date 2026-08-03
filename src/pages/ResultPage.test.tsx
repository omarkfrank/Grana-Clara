import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  createMemoryRouter,
  Outlet,
  RouterProvider,
  useLocation,
} from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  deleteSimulation,
  getSimulationById,
} from "../services/simulationStorage";
import type { SavedSimulation } from "../types/simulation";
import { ResultPage } from "./ResultPage";

vi.mock("../services/simulationStorage", () => ({
  getSimulationById: vi.fn(),
  deleteSimulation: vi.fn(),
}));

/**
 * O painel possui sua própria suíte.
 *
 * Nesta página utilizamos uma versão mínima para testar somente
 * a integração entre a ResultPage e o painel de insights.
 */
vi.mock("../components/finance/AIInsightsPanel", () => ({
  AIInsightsPanel: ({ simulation }: { simulation: SavedSimulation }) => (
    <section aria-label="Painel de insights de teste">{simulation.id}</section>
  ),
}));

const mockedGetSimulationById = vi.mocked(getSimulationById);

const mockedDeleteSimulation = vi.mocked(deleteSimulation);

/**
 * Simulação válida utilizada em todos os cenários da página.
 */
const simulation: SavedSimulation = {
  id: "result-test-id",

  createdAt: "2026-08-03T12:00:00.000Z",

  promptVersion: "financial-educator-v2",

  input: {
    rendaMensalBruta: 5000,
    custosFixosEssenciais: 2500,
    dividasParceladasMensais: 500,
    meta: "Reserva de emergência",
    custoDaMeta: 12000,
    prazoDesejadoEmMeses: 12,
  },

  result: {
    valorDisponivelPorMes: 2000,
    economiaMensalNecessaria: 1000,
    saldoAposReservaParaMeta: 1000,
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

/**
 * Exibe a rota atual para que os testes confirmem as navegações
 * sem depender do histórico real do navegador.
 */
function LocationProbe() {
  const location = useLocation();

  return <output aria-label="Rota atual">{location.pathname}</output>;
}

/**
 * Layout mínimo compartilhado pelas rotas utilizadas no teste.
 */
function TestLayout() {
  return (
    <>
      <LocationProbe />

      <Outlet />
    </>
  );
}

/**
 * Renderiza a ResultPage em um roteador isolado.
 */
function renderResultPage(simulationId = simulation.id) {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: <TestLayout />,

        children: [
          {
            path: "resultado/:simulationId",
            element: <ResultPage />,
          },

          {
            path: "historico",
            element: <h1>Histórico carregado</h1>,
          },

          {
            path: "simulacao",
            element: <h1>Nova simulação</h1>,
          },
        ],
      },
    ],
    {
      initialEntries: [`/resultado/${simulationId}`],
    },
  );

  render(<RouterProvider router={router} />);

  return router;
}

describe("ResultPage", () => {
  beforeEach(() => {
    mockedGetSimulationById.mockReset();
    mockedDeleteSimulation.mockReset();

    mockedGetSimulationById.mockReturnValue(simulation);

    mockedDeleteSimulation.mockReturnValue(true);
  });

  it("apresenta o estado de simulação não encontrada", () => {
    mockedGetSimulationById.mockReturnValue(null);

    renderResultPage("inexistente");

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Não encontramos esse resultado.",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: "Criar simulação",
      }),
    ).toHaveAttribute("href", "/simulacao");

    expect(
      screen.getByRole("link", {
        name: "Ver histórico",
      }),
    ).toHaveAttribute("href", "/historico");
  });

  it("apresenta os dados financeiros e o acesso ao chat contextualizado", () => {
    renderResultPage();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: simulation.input.meta,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("region", {
        name: "Resumo financeiro da simulação",
      }),
    ).toHaveTextContent("R$ 5.000,00");

    /**
     * O formatador monetário pode utilizar um espaço não
     * separável entre "R$" e o valor.
     *
     * A expressão \s+ aceita tanto o espaço tradicional quanto
     * o espaço Unicode produzido pelo Intl.NumberFormat.
     */
    expect(
      screen.getByRole("status", {
        name: "Saldo após reservar para a meta",
      }),
    ).toHaveAccessibleDescription(/R\$\s+1\.000,00/);

    expect(
      screen.getByRole("link", {
        name: "Conversar com o Educador",
      }),
    ).toHaveAttribute("href", `/chat/${simulation.id}`);

    expect(
      screen.getByRole("region", {
        name: "Painel de insights de teste",
      }),
    ).toHaveTextContent(simulation.id);
  });

  it("cancela a exclusão sem alterar o histórico", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

    renderResultPage();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Excluir simulação",
      }),
    );

    expect(confirmSpy).toHaveBeenCalledWith(
      `Deseja realmente excluir a simulação "${simulation.input.meta}"?`,
    );

    expect(mockedDeleteSimulation).not.toHaveBeenCalled();

    expect(screen.getByLabelText("Rota atual")).toHaveTextContent(
      `/resultado/${simulation.id}`,
    );
  });

  it("exclui e navega para o histórico depois da confirmação", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderResultPage();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Excluir simulação",
      }),
    );

    expect(mockedDeleteSimulation).toHaveBeenCalledWith(simulation.id);

    expect(
      await screen.findByRole("heading", {
        name: "Histórico carregado",
      }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Rota atual")).toHaveTextContent("/historico");
  });

  it("apresenta e focaliza um alerta quando a simulação não é removida", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);

    mockedDeleteSimulation.mockReturnValue(false);

    renderResultPage();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Excluir simulação",
      }),
    );

    const alert = await screen.findByRole("alert", {
      name: "Erro ao excluir",
    });

    expect(alert).toHaveAccessibleDescription(
      "A simulação não foi encontrada no histórico e não pôde ser excluída.",
    );

    const alertContainer = alert.parentElement;

    expect(alertContainer).not.toBeNull();

    await waitFor(() => {
      expect(alertContainer).toHaveFocus();
    });

    expect(screen.getByLabelText("Rota atual")).toHaveTextContent(
      `/resultado/${simulation.id}`,
    );
  });

  it("trata falhas inesperadas durante a exclusão", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    vi.spyOn(window, "confirm").mockReturnValue(true);

    mockedDeleteSimulation.mockImplementation(() => {
      throw new Error("Falha no armazenamento.");
    });

    renderResultPage();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Excluir simulação",
      }),
    );

    const alert = await screen.findByRole("alert", {
      name: "Erro ao excluir",
    });

    expect(alert).toHaveAccessibleDescription(
      "Não foi possível excluir a simulação neste momento.",
    );

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

    expect(screen.getByLabelText("Rota atual")).toHaveTextContent(
      `/resultado/${simulation.id}`,
    );
  });
});
