import { useState } from "react";

import { Alert } from "../components/common/Alert";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { OnboardingFlow } from "../components/onboarding/OnboardingFlow";
import type { OnboardingAnswers } from "../types/onboarding";

/**
 * Página principal do fluxo de simulação financeira.
 *
 * Nesta primeira parte da Fase 3, a página controla a conclusão
 * do onboarding. Posteriormente, as respostas serão encaminhadas
 * ao formulário financeiro e salvas junto à simulação.
 */
export function SimulationPage() {
  const [onboardingAnswers, setOnboardingAnswers] =
    useState<OnboardingAnswers | null>(null);

  function handleCompleteOnboarding(answers: OnboardingAnswers) {
    setOnboardingAnswers(answers);
  }

  function handleRestartOnboarding() {
    setOnboardingAnswers(null);
  }

  if (!onboardingAnswers) {
    return (
      <section className="py-4">
        <OnboardingFlow onComplete={handleCompleteOnboarding} />
      </section>
    );
  }

  return (
    <section className="py-4">
      <Card padding="lg" className="mx-auto max-w-2xl">
        <Badge variant="success">Onboarding concluído</Badge>

        <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
          Seu perfil inicial foi registrado.
        </h2>

        <p className="mt-3 leading-7 text-[var(--color-text-muted)]">
          Agora podemos utilizar suas respostas para adaptar a simulação
          financeira e as futuras recomendações.
        </p>

        <Alert title="Próxima etapa" variant="info" className="mt-6">
          Na próxima implementação, você informará sua renda, despesas, dívidas,
          meta financeira e prazo desejado.
        </Alert>

        <div className="mt-6">
          <Button variant="secondary" onClick={handleRestartOnboarding}>
            Refazer onboarding
          </Button>
        </div>
      </Card>
    </section>
  );
}
