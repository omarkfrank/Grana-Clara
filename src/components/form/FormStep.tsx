import type { ReactNode } from "react";

import { Badge } from "../common/Badge";
import { Card } from "../common/Card";
import { ProgressBar } from "../common/ProgressBar";

type FormStepProps = {
  currentStep: number;
  totalSteps: number;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

/**
 * Estrutura visual comum para uma etapa de formulário.
 *
 * Centraliza a barra de progresso, título, descrição e conteúdo
 * de cada etapa para manter consistência durante todo o fluxo.
 */
export function FormStep({
  currentStep,
  totalSteps,
  eyebrow,
  title,
  description,
  children,
}: FormStepProps) {
  return (
    <Card padding="lg" className="mx-auto max-w-2xl space-y-6">
      <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />

      <header className="space-y-3">
        <Badge variant="neutral">{eyebrow}</Badge>

        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h2>

        <p className="leading-7 text-[var(--color-text-muted)]">
          {description}
        </p>
      </header>

      {children}
    </Card>
  );
}
