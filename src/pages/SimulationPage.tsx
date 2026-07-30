import { useState } from "react";

import { Alert } from "../components/common/Alert";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { SimulationForm } from "../components/finance/SimulationForm";
import { OnboardingFlow } from "../components/onboarding/OnboardingFlow";
import type { SimulationInput, SimulationResult } from "../types/finance";
import type { OnboardingAnswers } from "../types/onboarding";
import { calculateSimulation } from "../utils/calculateSimulation";
import { formatCurrency } from "../utils/formatCurrency";

type CompletedSimulation = {
  input: SimulationInput;
  result: SimulationResult;
};

const statusConfiguration = {
  viable: {
    label: "Meta viável",
    variant: "success",
    message:
      "A meta pode ser alcançada no prazo informado considerando os dados atuais.",
  },
  needs_adjustments: {
    label: "Pequenos ajustes necessários",
    variant: "warning",
    message:
      "A meta está próxima de ser viável, mas exige pequenos ajustes no prazo ou nos gastos.",
  },
  unfeasible: {
    label: "Cenário precisa ser reorganizado",
    variant: "danger",
    message:
      "A meta exige ajustes mais relevantes no prazo, no valor ou na organização mensal.",
  },
} as const;

/**
 * Página principal do fluxo de simulação financeira.
 *
 * Fluxo atual:
 * 1. Onboarding financeiro.
 * 2. Preenchimento da simulação.
 * 3. Cálculo local da viabilidade.
 *
 * Persistência, rota de resultado e IA serão conectadas
 * nas próximas fases.
 */
export function SimulationPage() {
  const [onboardingAnswers, setOnboardingAnswers] =
    useState<OnboardingAnswers | null>(null);

  const [completedSimulation, setCompletedSimulation] =
    useState<CompletedSimulation | null>(null);

  function handleCompleteSimulation(input: SimulationInput) {
    const result = calculateSimulation(input);

    setCompletedSimulation({
      input,
      result,
    });
  }

  function handleCreateAnotherSimulation() {
    setCompletedSimulation(null);
  }

  function handleRestartFlow() {
    setCompletedSimulation(null);
    setOnboardingAnswers(null);
  }

  if (!onboardingAnswers) {
    return (
      <section className="py-4">
        <OnboardingFlow onComplete={setOnboardingAnswers} />
      </section>
    );
  }

  if (!completedSimulation) {
    return (
      <section className="py-4">
        <SimulationForm onComplete={handleCompleteSimulation} />
      </section>
    );
  }

  const { input, result } = completedSimulation;
  const status = statusConfiguration[result.status];

  return (
    <section className="py-4">
      <Card padding="lg" className="mx-auto max-w-2xl">
        <Badge variant={status.variant}>{status.label}</Badge>

        <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
          Resultado: {input.meta}
        </h2>

        <p className="mt-3 leading-7 text-[var(--color-text-muted)]">
          {status.message}
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card variant="muted" padding="sm">
            <p className="text-sm text-[var(--color-text-muted)]">
              Valor disponível por mês
            </p>

            <strong className="mt-1 block text-xl">
              {formatCurrency(result.valorDisponivelPorMes)}
            </strong>
          </Card>

          <Card variant="muted" padding="sm">
            <p className="text-sm text-[var(--color-text-muted)]">
              Economia mensal necessária
            </p>

            <strong className="mt-1 block text-xl">
              {formatCurrency(result.economiaMensalNecessaria)}
            </strong>
          </Card>
        </div>

        <Alert
          title="Saldo após reservar para a meta"
          variant={result.saldoAposReservaParaMeta >= 0 ? "success" : "warning"}
          className="mt-4"
        >
          {formatCurrency(result.saldoAposReservaParaMeta)}
        </Alert>

        <p className="mt-6 text-sm leading-6 text-[var(--color-text-muted)]">
          Este resultado possui finalidade educativa e utiliza exclusivamente os
          dados informados nesta simulação.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button onClick={handleCreateAnotherSimulation}>
            Criar nova simulação
          </Button>

          <Button variant="secondary" onClick={handleRestartFlow}>
            Refazer perfil
          </Button>
        </div>
      </Card>
    </section>
  );
}
