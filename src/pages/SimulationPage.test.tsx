import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  createMemoryRouter,
  Outlet,
  RouterProvider,
  useLocation,
  useParams,
} from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { saveSimulation } from "../services/simulationStorage";
import type { SimulationInput, SimulationResult } from "../types/finance";
import type { OnboardingAnswers } from "../types/onboarding";
import type { SavedSimulation } from "../types/simulation";
import { calculateSimulation } from "../utils/calculateSimulation";
import { SimulationPage } from "./SimulationPage";

/**
 * Dados compartilhados entre os componentes simulados e os testes.
 *
 * vi.hoisted garante que os valores estejam disponíveis quando
 * as fábricas de vi.mock forem executadas pelo Vitest.
 */
const testData = vi.hoisted(() => ({
  onboardingAnswers: {
    situacaoFinanceiraAtual: "organizada",
    fonteDeRenda: "salario",
    controleDosGastos: "planilha",
    objetivoPrincipal: "reserva",
    prazoObjetivo: "medio",
    nivelConhecimento: "basico",
    tempoDisponivel: "semanal",
  },

  simulationInput: {
    rendaMensalBruta: 5000,
    custosFixosEssenciais: 2500,
    dividasParceladasMensais: 500,
    meta: "Criar uma reserva de emergência",
    custoDaMeta: 12000,
    prazoDesejadoEmMeses: 12,
  },
}));

/**
 * Substitui o onboarding completo por um controle simples.
 *
 * Os testes detalhados do OnboardingFlow já existem. Nesta suíte,
 * verificamos apenas a integração dele com a SimulationPage.
 */
vi.mock("../components/onboarding/OnboardingFlow", () => ({
  OnboardingFlow: ({
    onComplete,
  }: {
    onComplete: (answers: OnboardingAnswers) => void;
  }) => (
    <button
      type="button"
      onClick={() => {
        onComplete(testData.onboardingAnswers as OnboardingAnswers);
      }}
    >
      Concluir onboarding de teste
    </button>
  ),
}));

/**
 * Substitui o formulário financeiro por um controle simples.
 *
 * A suíte específica de SimulationForm já cobre campos,
 * validações, revisão e gerenciamento de foco.
 */
vi.mock("../components/finance/SimulationForm", () => ({
  SimulationForm: ({
    onComplete,
  }: {
    onComplete: (input: SimulationInput) => void;
  }) => (
    <button
      type="button"
      onClick={() => {
        onComplete(testData.simulationInput as SimulationInput);
      }}
    >
      Concluir simulação de teste
    </button>
  ),
}));

/**
 * Mantém cálculo e armazenamento sob controle da suíte.
 *
 * Dessa forma, conseguimos testar sucesso e falha sem escrever
 * dados reais no localStorage do jsdom.
 */
vi.mock("../utils/calculateSimulation", () => ({
  calculateSimulation: vi.fn(),
}));

vi.mock("../services/simulationStorage", () => ({
  saveSimulation: vi.fn(),
}));

const mockedCalculateSimulation = vi.mocked(calculateSimulation);

const mockedSaveSimulation = vi.mocked(saveSimulation);

/**
 * Resultado financeiro devolvido pelo cálculo simulado.
 */
const simulationResult: SimulationResult = {
  valorDisponivelPorMes: 2000,
  economiaMensalNecessaria: 1000,
  saldoAposReservaParaMeta: 1000,
  status: "viable",
};

/**
 * Registro devolvido pelo armazenamento simulado.
 */
const savedSimulation = {
  id: "simulation-test-id",
  createdAt: "2026-08-03T12:00:00.000Z",
  input: testData.simulationInput as SimulationInput,
  result: simulationResult,
  onboarding: testData.onboardingAnswers as OnboardingAnswers,
  promptVersion: "financial-educator-test",
} as SavedSimulation;

/**
 * Exibe a rota atual para permitir que os testes confirmem
 * a navegação sem depender do histórico real do navegador.
 */
function LocationProbe() {
  const location = useLocation();

  return <output aria-label="Rota atual">{location.pathname}</output>;
}

/**
 * Página mínima utilizada como destino da navegação.
 */
function ResultProbe() {
  const { simulationId } = useParams();

  return <h1>Resultado carregado: {simulationId}</h1>;
}

/**
 * Layout mínimo que mantém o observador de rota disponível
 * antes e depois da navegação.
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
 * Renderiza a SimulationPage em um roteador isolado.
 */
function renderSimulationPage() {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: <TestLayout />,
        children: [
          {
            path: "simulacao",
            element: <SimulationPage />,
          },
          {
            path: "resultado/:simulationId",
            element: <ResultProbe />,
          },
        ],
      },
    ],
    {
      initialEntries: ["/simulacao"],
    },
  );

  render(<RouterProvider router={router} />);

  return router;
}

/**
 * Conclui a versão simulada do onboarding.
 */
function completeOnboarding(): void {
  fireEvent.click(
    screen.getByRole("button", {
      name: "Concluir onboarding de teste",
    }),
  );
}

/**
 * Conclui a versão simulada do formulário financeiro.
 */
function completeSimulation(): void {
  fireEvent.click(
    screen.getByRole("button", {
      name: "Concluir simulação de teste",
    }),
  );
}

describe("SimulationPage", () => {
  beforeEach(() => {
    mockedCalculateSimulation.mockReset();
    mockedSaveSimulation.mockReset();

    mockedCalculateSimulation.mockReturnValue(simulationResult);

    mockedSaveSimulation.mockReturnValue(savedSimulation);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("inicia pelo onboarding sem executar cálculo ou armazenamento", () => {
    renderSimulationPage();

    expect(
      screen.getByRole("button", {
        name: "Concluir onboarding de teste",
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Concluir simulação de teste",
      }),
    ).not.toBeInTheDocument();

    expect(screen.getByLabelText("Rota atual")).toHaveTextContent("/simulacao");

    expect(mockedCalculateSimulation).not.toHaveBeenCalled();

    expect(mockedSaveSimulation).not.toHaveBeenCalled();
  });

  it("substitui o onboarding pelo formulário financeiro após a conclusão", async () => {
    renderSimulationPage();

    completeOnboarding();

    expect(
      await screen.findByRole("button", {
        name: "Concluir simulação de teste",
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Concluir onboarding de teste",
      }),
    ).not.toBeInTheDocument();

    expect(screen.getByLabelText("Rota atual")).toHaveTextContent("/simulacao");
  });

  it("calcula, salva e navega para o resultado da simulação criada", async () => {
    renderSimulationPage();

    completeOnboarding();

    await screen.findByRole("button", {
      name: "Concluir simulação de teste",
    });

    completeSimulation();

    expect(mockedCalculateSimulation).toHaveBeenCalledTimes(1);

    expect(mockedCalculateSimulation).toHaveBeenCalledWith(
      testData.simulationInput,
    );

    expect(mockedSaveSimulation).toHaveBeenCalledTimes(1);

    expect(mockedSaveSimulation).toHaveBeenCalledWith({
      input: testData.simulationInput,
      result: simulationResult,
      onboarding: testData.onboardingAnswers,
    });

    expect(
      await screen.findByRole("heading", {
        name: "Resultado carregado: simulation-test-id",
      }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Rota atual")).toHaveTextContent(
      "/resultado/simulation-test-id",
    );
  });

  it("apresenta e focaliza o alerta quando o armazenamento falha", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    mockedSaveSimulation.mockImplementationOnce(() => {
      throw new Error("Armazenamento indisponível.");
    });

    renderSimulationPage();

    completeOnboarding();

    await screen.findByRole("button", {
      name: "Concluir simulação de teste",
    });

    completeSimulation();

    const alert = await screen.findByRole("alert", {
      name: "Não foi possível concluir",
    });

    expect(alert).toHaveAccessibleDescription(
      "Não foi possível salvar a simulação. Verifique se o armazenamento do navegador está disponível.",
    );

    /**
     * A SimulationPage focaliza o contêiner que envolve
     * o alerta, e não a própria região role="alert".
     */
    const alertContainer = alert.parentElement;

    expect(alertContainer).not.toBeNull();

    await waitFor(() => {
      expect(alertContainer).toHaveFocus();
    });

    expect(alertContainer).toHaveAttribute("tabindex", "-1");

    expect(screen.getByLabelText("Rota atual")).toHaveTextContent("/simulacao");

    expect(
      screen.queryByRole("heading", {
        name: /Resultado carregado/,
      }),
    ).not.toBeInTheDocument();

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });
});
