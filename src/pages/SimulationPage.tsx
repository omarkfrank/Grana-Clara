import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { Alert } from "../components/common/Alert";
import { SimulationForm } from "../components/finance/SimulationForm";
import { OnboardingFlow } from "../components/onboarding/OnboardingFlow";
import { saveSimulation } from "../services/simulationStorage";
import type { SimulationInput } from "../types/finance";
import type { OnboardingAnswers } from "../types/onboarding";
import { calculateSimulation } from "../utils/calculateSimulation";

/**
 * Página principal do fluxo de simulação financeira.
 *
 * Fluxo:
 * 1. Onboarding financeiro.
 * 2. Formulário da simulação.
 * 3. Cálculo local da viabilidade.
 * 4. Persistência no navegador.
 * 5. Redirecionamento para a rota de resultado.
 */
export function SimulationPage() {
  const navigate = useNavigate();

  const [onboardingAnswers, setOnboardingAnswers] =
    useState<OnboardingAnswers | null>(null);

  const [saveError, setSaveError] = useState<string | null>(null);

  const saveErrorContainerRef = useRef<HTMLDivElement>(null);

  /**
   * Caso a persistência falhe, o foco é direcionado para a
   * mensagem apresentada no início do formulário.
   */
  useEffect(() => {
    if (!saveError) {
      return;
    }

    saveErrorContainerRef.current?.focus({
      preventScroll: false,
    });
  }, [saveError]);

  function handleCompleteOnboarding(answers: OnboardingAnswers) {
    setSaveError(null);
    setOnboardingAnswers(answers);
  }

  function handleCompleteSimulation(input: SimulationInput) {
    if (!onboardingAnswers) {
      setSaveError("Não foi possível identificar as respostas do onboarding.");

      return;
    }

    try {
      const result = calculateSimulation(input);

      const savedSimulation = saveSimulation({
        input,
        result,
        onboarding: onboardingAnswers,
      });

      navigate(`/resultado/${savedSimulation.id}`);
    } catch (error) {
      console.error(error);

      setSaveError(
        "Não foi possível salvar a simulação. Verifique se o armazenamento do navegador está disponível.",
      );
    }
  }

  if (!onboardingAnswers) {
    return (
      <section className="py-4">
        <OnboardingFlow onComplete={handleCompleteOnboarding} />
      </section>
    );
  }

  return (
    <section className="space-y-4 py-4">
      {saveError && (
        <div
          ref={saveErrorContainerRef}
          tabIndex={-1}
          className="mx-auto max-w-2xl scroll-mt-24 rounded-2xl"
        >
          <Alert title="Não foi possível concluir" variant="danger">
            {saveError}
          </Alert>
        </div>
      )}

      <SimulationForm onComplete={handleCompleteSimulation} />
    </section>
  );
}
