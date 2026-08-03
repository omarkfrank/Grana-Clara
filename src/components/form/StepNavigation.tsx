import type { ButtonHTMLAttributes } from "react";

import { Button } from "../common/Button";

type StepNavigationProps = {
  canGoBack: boolean;
  canContinue: boolean;
  continueLabel?: string;
  continueType?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
  onBack: () => void;
  onContinue?: () => void;
};

/**
 * Navegação reutilizável dos formulários em etapas.
 *
 * O botão principal pode funcionar como:
 * - Botão comum, controlado por onContinue.
 * - Botão submit de um formulário semântico.
 */
export function StepNavigation({
  canGoBack,
  canContinue,
  continueLabel = "Continuar",
  continueType = "button",
  onBack,
  onContinue,
}: StepNavigationProps) {
  return (
    <nav
      aria-label="Navegação entre etapas"
      className="flex flex-col-reverse gap-3 border-t border-[var(--color-border)] pt-6 sm:flex-row sm:justify-between"
    >
      <Button
        type="button"
        variant="ghost"
        onClick={onBack}
        disabled={!canGoBack}
        className="w-full sm:w-auto"
      >
        Voltar
      </Button>

      <Button
        type={continueType}
        onClick={onContinue}
        disabled={!canContinue}
        className="w-full sm:w-auto"
      >
        {continueLabel}
      </Button>
    </nav>
  );
}
