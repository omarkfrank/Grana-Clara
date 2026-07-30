import { Button } from "../common/Button";

type StepNavigationProps = {
  canGoBack: boolean;
  canContinue: boolean;
  continueLabel?: string;
  onBack: () => void;
  onContinue: () => void;
};

/**
 * Navegação reutilizável dos formulários em etapas.
 */
export function StepNavigation({
  canGoBack,
  canContinue,
  continueLabel = "Continuar",
  onBack,
  onContinue,
}: StepNavigationProps) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-[var(--color-border)] pt-6 sm:flex-row sm:justify-between">
      <Button
        variant="ghost"
        onClick={onBack}
        disabled={!canGoBack}
        className="w-full sm:w-auto"
      >
        Voltar
      </Button>

      <Button
        onClick={onContinue}
        disabled={!canContinue}
        className="w-full sm:w-auto"
      >
        {continueLabel}
      </Button>
    </div>
  );
}
