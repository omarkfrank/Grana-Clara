import type { HTMLAttributes } from "react";
import clsx from "clsx";

type ProgressBarProps = HTMLAttributes<HTMLDivElement> & {
  currentStep: number;
  totalSteps: number;
  showLabel?: boolean;
};

/**
 * Barra de progresso utilizada em fluxos divididos em etapas.
 *
 * O componente limita automaticamente os valores recebidos para
 * impedir percentuais menores que 0% ou maiores que 100%.
 */
export function ProgressBar({
  currentStep,
  totalSteps,
  showLabel = true,
  className,
  ...props
}: ProgressBarProps) {
  const safeTotalSteps = Math.max(1, totalSteps);

  const safeCurrentStep = Math.min(Math.max(0, currentStep), safeTotalSteps);

  const progressPercentage = (safeCurrentStep / safeTotalSteps) * 100;

  return (
    <div {...props} className={clsx("space-y-2", className)}>
      {showLabel && (
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="font-semibold">Seu progresso</span>

          <span className="text-[var(--color-text-muted)]">
            Etapa {safeCurrentStep} de {safeTotalSteps}
          </span>
        </div>
      )}

      <div
        role="progressbar"
        aria-label="Progresso das etapas"
        aria-valuemin={0}
        aria-valuemax={safeTotalSteps}
        aria-valuenow={safeCurrentStep}
        className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-muted)]"
      >
        <div
          className="h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-300 ease-in-out"
          style={{
            width: `${progressPercentage}%`,
          }}
        />
      </div>
    </div>
  );
}
