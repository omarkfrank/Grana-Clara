import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SimulationInput } from "../../types/finance";
import { SimulationForm } from "./SimulationForm";

/**
 * Valores utilizados para preencher uma simulação válida.
 *
 * Os campos monetários recebem somente dígitos porque o componente
 * CurrencyInput converte automaticamente os dois últimos dígitos
 * em centavos.
 */
const validSimulationInput: SimulationInput = {
  rendaMensalBruta: 5000,
  custosFixosEssenciais: 2500,
  dividasParceladasMensais: 500,
  meta: "Criar uma reserva de emergência",
  custoDaMeta: 12000,
  prazoDesejadoEmMeses: 12,
};

/**
 * Preenche a primeira etapa do formulário.
 */
function fillMonthlyFinances(): void {
  fireEvent.change(screen.getByLabelText("Renda mensal bruta"), {
    target: {
      value: "500000",
    },
  });

  fireEvent.change(screen.getByLabelText("Custos fixos essenciais"), {
    target: {
      value: "250000",
    },
  });

  fireEvent.change(screen.getByLabelText("Dívidas parceladas mensais"), {
    target: {
      value: "50000",
    },
  });
}

/**
 * Preenche a segunda etapa do formulário.
 */
function fillFinancialGoal(deadline = "12"): void {
  fireEvent.change(screen.getByLabelText("Meta financeira"), {
    target: {
      value: validSimulationInput.meta,
    },
  });

  fireEvent.change(screen.getByLabelText("Custo total da meta"), {
    target: {
      value: "1200000",
    },
  });

  fireEvent.change(screen.getByLabelText("Prazo desejado em meses"), {
    target: {
      value: deadline,
    },
  });
}

/**
 * Avança pelo botão principal da etapa.
 */
function continueForm(): void {
  fireEvent.click(
    screen.getByRole("button", {
      name: "Continuar",
    }),
  );
}

describe("SimulationForm", () => {
  beforeEach(() => {
    /**
     * Executa imediatamente o gerenciamento de foco realizado
     * pelo FormStep.
     */
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);

      return 1;
    });

    vi.stubGlobal("cancelAnimationFrame", () => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("apresenta a primeira etapa com campos associados aos seus rótulos", () => {
    render(<SimulationForm onComplete={vi.fn()} />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Como está seu mês financeiro?",
      }),
    ).toBeInTheDocument();

    const incomeInput = screen.getByLabelText("Renda mensal bruta");

    const costsInput = screen.getByLabelText("Custos fixos essenciais");

    const debtsInput = screen.getByLabelText("Dívidas parceladas mensais");

    expect(incomeInput).toBeRequired();
    expect(costsInput).toBeRequired();
    expect(debtsInput).toBeRequired();

    expect(incomeInput).toHaveAttribute("inputmode", "numeric");

    expect(costsInput).toHaveAttribute("inputmode", "numeric");

    expect(debtsInput).toHaveAttribute("inputmode", "numeric");

    expect(
      screen.getByRole("button", {
        name: "Voltar",
      }),
    ).toBeDisabled();

    expect(
      screen.getByRole("button", {
        name: "Continuar",
      }),
    ).toBeEnabled();
  });

  it("apresenta os erros e move o foco para o primeiro campo inválido", async () => {
    render(<SimulationForm onComplete={vi.fn()} />);

    continueForm();

    const incomeInput = screen.getByLabelText("Renda mensal bruta");

    await waitFor(() => {
      expect(incomeInput).toHaveFocus();
    });

    expect(incomeInput).toHaveAttribute("aria-invalid", "true");

    expect(incomeInput).toHaveAttribute(
      "aria-errormessage",
      "rendaMensalBruta-error",
    );

    expect(incomeInput).toHaveAttribute(
      "aria-describedby",
      "rendaMensalBruta-helper rendaMensalBruta-error",
    );

    expect(
      screen.getByText("Informe uma renda mensal maior que zero."),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Informe seus custos fixos. Use R$ 0,00 caso não existam.",
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Informe suas dívidas mensais. Use R$ 0,00 caso não existam.",
      ),
    ).toBeInTheDocument();

    /**
     * Ao corrigir o campo, os atributos de erro devem ser
     * removidos e a descrição auxiliar deve ser preservada.
     */
    fireEvent.change(incomeInput, {
      target: {
        value: "500000",
      },
    });

    expect(incomeInput).not.toHaveAttribute("aria-invalid");

    expect(incomeInput).not.toHaveAttribute("aria-errormessage");

    expect(incomeInput).toHaveAttribute(
      "aria-describedby",
      "rendaMensalBruta-helper",
    );
  });

  it("valida a meta, o custo e o limite máximo do prazo", async () => {
    render(<SimulationForm onComplete={vi.fn()} />);

    fillMonthlyFinances();
    continueForm();

    const goalHeading = await screen.findByRole("heading", {
      level: 1,
      name: "Qual é a sua meta?",
    });

    await waitFor(() => {
      expect(goalHeading).toHaveFocus();
    });

    continueForm();

    const goalInput = screen.getByLabelText("Meta financeira");

    await waitFor(() => {
      expect(goalInput).toHaveFocus();
    });

    expect(
      screen.getByText(
        "Descreva qual objetivo financeiro você deseja alcançar.",
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Informe um custo da meta maior que zero."),
    ).toBeInTheDocument();

    fillFinancialGoal("601");

    continueForm();

    const deadlineInput = screen.getByLabelText("Prazo desejado em meses");

    await waitFor(() => {
      expect(deadlineInput).toHaveFocus();
    });

    expect(deadlineInput).toHaveAttribute("aria-invalid", "true");

    expect(
      screen.getByText("Informe um prazo inteiro entre 1 e 600 meses."),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("heading", {
        level: 1,
        name: "Revise sua simulação",
      }),
    ).not.toBeInTheDocument();
  });

  it("preserva os dados ao voltar para uma etapa anterior", async () => {
    render(<SimulationForm onComplete={vi.fn()} />);

    fillMonthlyFinances();
    continueForm();

    await screen.findByRole("heading", {
      level: 1,
      name: "Qual é a sua meta?",
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Voltar",
      }),
    );

    const monthlyHeading = await screen.findByRole("heading", {
      level: 1,
      name: "Como está seu mês financeiro?",
    });

    await waitFor(() => {
      expect(monthlyHeading).toHaveFocus();
    });

    expect(screen.getByLabelText("Renda mensal bruta")).toHaveValue("5.000,00");

    expect(screen.getByLabelText("Custos fixos essenciais")).toHaveValue(
      "2.500,00",
    );

    expect(screen.getByLabelText("Dívidas parceladas mensais")).toHaveValue(
      "500,00",
    );
  });

  it("apresenta a revisão e entrega uma simulação completa", async () => {
    const onComplete = vi.fn();

    render(<SimulationForm onComplete={onComplete} />);

    fillMonthlyFinances();
    continueForm();

    await screen.findByRole("heading", {
      level: 1,
      name: "Qual é a sua meta?",
    });

    fillFinancialGoal();
    continueForm();

    const reviewHeading = await screen.findByRole("heading", {
      level: 1,
      name: "Revise sua simulação",
    });

    await waitFor(() => {
      expect(reviewHeading).toHaveFocus();
    });

    /**
     * Limitamos as consultas à região de resumo.
     *
     * Dessa maneira, os valores são verificados dentro do contexto
     * correto e consultas monetárias semelhantes não se confundem.
     */
    const reviewRegion = screen.getByRole("region", {
      name: "Resumo dos dados da simulação",
    });

    const review = within(reviewRegion);

    expect(reviewRegion).toBeInTheDocument();

    expect(review.getByText(validSimulationInput.meta)).toBeInTheDocument();

    /**
     * Usamos os textos monetários completos.
     *
     * A consulta anterior por /500,00/ também encontrava
     * "R$ 2.500,00", tornando o resultado ambíguo.
     */
    expect(review.getByText("R$ 5.000,00")).toBeInTheDocument();

    expect(review.getByText("R$ 2.500,00")).toBeInTheDocument();

    expect(review.getByText("R$ 500,00")).toBeInTheDocument();

    expect(reviewRegion).toHaveTextContent("R$ 12.000,00 em 12 meses");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Calcular viabilidade",
      }),
    );

    expect(onComplete).toHaveBeenCalledTimes(1);

    expect(onComplete).toHaveBeenCalledWith(validSimulationInput);
  });
});
