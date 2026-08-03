import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { onboardingQuestions } from "../../constants/onboardingQuestions";
import { OnboardingFlow } from "./OnboardingFlow";

/**
 * Recupera a primeira opção disponível de uma pergunta.
 *
 * A verificação explícita evita que o teste continue com uma
 * configuração de onboarding inválida ou sem opções.
 */
function getFirstOption(question: (typeof onboardingQuestions)[number]) {
  const option = question.options[0];

  if (!option) {
    throw new Error(`A pergunta "${question.title}" não possui opções.`);
  }

  return option;
}

/**
 * Recupera uma pergunta pelo índice e interrompe o teste com uma
 * mensagem clara caso a configuração não possua essa etapa.
 */
function getQuestion(index: number) {
  const question = onboardingQuestions[index];

  if (!question) {
    throw new Error(`A pergunta de índice ${index} não foi encontrada.`);
  }

  return question;
}

/**
 * Seleciona a primeira opção da pergunta atualmente exibida.
 */
function selectFirstOption(
  question: (typeof onboardingQuestions)[number],
): void {
  const option = getFirstOption(question);

  fireEvent.click(
    screen.getByRole("radio", {
      name: option.label,
    }),
  );
}

/**
 * Recupera o botão principal da etapa.
 */
function getContinueButton(isLastStep = false) {
  return screen.getByRole("button", {
    name: isLastStep ? "Concluir onboarding" : "Continuar",
  });
}

describe("OnboardingFlow", () => {
  beforeEach(() => {
    /**
     * O FormStep utiliza requestAnimationFrame para mover o foco
     * depois que o React conclui a atualização da etapa.
     *
     * No teste, executamos o callback imediatamente para tornar
     * o comportamento previsível.
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

  it("apresenta a primeira pergunta e bloqueia o avanço sem resposta", () => {
    const onComplete = vi.fn();
    const firstQuestion = getQuestion(0);

    render(<OnboardingFlow onComplete={onComplete} />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: firstQuestion.title,
      }),
    ).toBeInTheDocument();

    const radios = screen.getAllByRole("radio");

    expect(radios).toHaveLength(firstQuestion.options.length);

    radios.forEach((radio) => {
      expect(radio).not.toBeChecked();
      expect(radio).toBeRequired();
      expect(radio).toHaveAttribute("name", firstQuestion.id);
    });

    expect(getContinueButton(onboardingQuestions.length === 1)).toBeDisabled();

    expect(onComplete).not.toHaveBeenCalled();
  });

  it("habilita o avanço e move o foco para o título da próxima pergunta", async () => {
    const onComplete = vi.fn();

    const firstQuestion = getQuestion(0);
    const secondQuestion = getQuestion(1);

    render(<OnboardingFlow onComplete={onComplete} />);

    selectFirstOption(firstQuestion);

    const continueButton = getContinueButton(false);

    expect(continueButton).toBeEnabled();

    fireEvent.click(continueButton);

    const nextHeading = await screen.findByRole("heading", {
      level: 1,
      name: secondQuestion.title,
    });

    await waitFor(() => {
      expect(nextHeading).toHaveFocus();
    });

    expect(onComplete).not.toHaveBeenCalled();
  });

  it("permite voltar e preserva a resposta selecionada anteriormente", async () => {
    const firstQuestion = getQuestion(0);
    const secondQuestion = getQuestion(1);

    const firstOption = getFirstOption(firstQuestion);

    render(<OnboardingFlow onComplete={vi.fn()} />);

    selectFirstOption(firstQuestion);

    fireEvent.click(getContinueButton(false));

    await screen.findByRole("heading", {
      level: 1,
      name: secondQuestion.title,
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Voltar",
      }),
    );

    const firstHeading = await screen.findByRole("heading", {
      level: 1,
      name: firstQuestion.title,
    });

    await waitFor(() => {
      expect(firstHeading).toHaveFocus();
    });

    expect(
      screen.getByRole("radio", {
        name: firstOption.label,
      }),
    ).toBeChecked();

    /**
     * Na primeira etapa, o botão Voltar deve permanecer
     * desabilitado.
     */
    expect(
      screen.getByRole("button", {
        name: "Voltar",
      }),
    ).toBeDisabled();
  });

  it("entrega todas as respostas quando a última etapa é concluída", async () => {
    const onComplete = vi.fn();

    const expectedAnswers = Object.fromEntries(
      onboardingQuestions.map((question) => [
        question.id,
        getFirstOption(question).value,
      ]),
    );

    render(<OnboardingFlow onComplete={onComplete} />);

    for (let index = 0; index < onboardingQuestions.length; index += 1) {
      const question = getQuestion(index);
      const isLastStep = index === onboardingQuestions.length - 1;

      expect(
        screen.getByRole("heading", {
          level: 1,
          name: question.title,
        }),
      ).toBeInTheDocument();

      selectFirstOption(question);

      fireEvent.click(getContinueButton(isLastStep));

      if (!isLastStep) {
        const nextQuestion = getQuestion(index + 1);

        await screen.findByRole("heading", {
          level: 1,
          name: nextQuestion.title,
        });
      }
    }

    expect(onComplete).toHaveBeenCalledTimes(1);

    expect(onComplete).toHaveBeenCalledWith(expectedAnswers);
  });
});
