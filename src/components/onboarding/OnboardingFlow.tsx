import { type FormEvent, useState } from "react";

import { onboardingQuestions } from "../../constants/onboardingQuestions";
import type {
  OnboardingAnswers,
  OnboardingAnswerValue,
  OnboardingDraft,
} from "../../types/onboarding";
import { FormStep } from "../form/FormStep";
import { OptionCard } from "../form/OptionCard";
import { StepNavigation } from "../form/StepNavigation";

type OnboardingFlowProps = {
  onComplete: (answers: OnboardingAnswers) => void;
};

/**
 * Verifica se todas as perguntas obrigatórias foram respondidas.
 */
function isOnboardingComplete(
  answers: OnboardingDraft,
): answers is OnboardingAnswers {
  return onboardingQuestions.every(
    (question) => answers[question.id] !== undefined,
  );
}

/**
 * Controla todo o fluxo do onboarding financeiro.
 *
 * Responsabilidades:
 * - Armazenar as respostas.
 * - Controlar a pergunta atual.
 * - Permitir navegação entre as etapas.
 * - Bloquear o avanço sem resposta.
 * - Entregar respostas completas ao componente pai.
 * - Preservar navegação semântica por formulário e teclado.
 */
export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const [answers, setAnswers] = useState<OnboardingDraft>({});

  const currentQuestion = onboardingQuestions[currentStepIndex];

  if (!currentQuestion) {
    return null;
  }

  const currentAnswer = answers[currentQuestion.id];

  const isLastStep = currentStepIndex === onboardingQuestions.length - 1;

  function handleSelect(value: OnboardingAnswerValue) {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [currentQuestion.id]: value,
    }));
  }

  function handleBack() {
    setCurrentStepIndex((currentIndex) => Math.max(0, currentIndex - 1));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (currentAnswer === undefined) {
      return;
    }

    if (isLastStep) {
      if (isOnboardingComplete(answers)) {
        onComplete(answers);
      }

      return;
    }

    setCurrentStepIndex((currentIndex) =>
      Math.min(onboardingQuestions.length - 1, currentIndex + 1),
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormStep
        currentStep={currentStepIndex + 1}
        totalSteps={onboardingQuestions.length}
        eyebrow={currentQuestion.block}
        title={currentQuestion.title}
        description={currentQuestion.description}
        headingLevel="h1"
      >
        <fieldset className="space-y-3">
          <legend className="sr-only">{currentQuestion.title}</legend>

          {currentQuestion.options.map((option, optionIndex) => {
            const optionId = `${currentQuestion.id}-${optionIndex}`;

            return (
              <OptionCard
                key={option.value}
                id={optionId}
                name={currentQuestion.id}
                value={option.value}
                label={option.label}
                description={option.description}
                checked={currentAnswer === option.value}
                required
                onSelect={handleSelect}
              />
            );
          })}
        </fieldset>

        <StepNavigation
          canGoBack={currentStepIndex > 0}
          canContinue={currentAnswer !== undefined}
          continueLabel={isLastStep ? "Concluir onboarding" : "Continuar"}
          continueType="submit"
          onBack={handleBack}
        />
      </FormStep>
    </form>
  );
}
