import clsx from "clsx";

import type { OnboardingAnswerValue } from "../../types/onboarding";

type OptionCardProps = {
  id: string;
  name: string;
  value: OnboardingAnswerValue;
  label: string;
  description?: string;
  checked: boolean;
  required?: boolean;
  onSelect: (value: OnboardingAnswerValue) => void;
};

/**
 * Opção selecionável exibida em formato de card.
 *
 * Internamente utilizamos um radio nativo para preservar:
 * - Navegação pelas setas do teclado.
 * - Seleção por Espaço.
 * - Leitura adequada por tecnologias assistivas.
 * - Comportamento esperado de um grupo de escolha única.
 */
export function OptionCard({
  id,
  name,
  value,
  label,
  description,
  checked,
  required = false,
  onSelect,
}: OptionCardProps) {
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;

  return (
    <label
      htmlFor={id}
      className={clsx(
        "block cursor-pointer rounded-2xl border p-4",
        "transition-[border-color,background-color,box-shadow] duration-200",
        "focus-within:ring-2",
        "focus-within:ring-[var(--color-focus-ring)]",
        "focus-within:ring-offset-2",
        "focus-within:ring-offset-[var(--color-background)]",
        "motion-reduce:transition-none",
        {
          "border-[var(--color-primary)] bg-[var(--color-primary-soft)]":
            checked,

          "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-muted)]":
            !checked,
        },
      )}
    >
      <input
        id={id}
        name={name}
        type="radio"
        value={value}
        checked={checked}
        required={required}
        aria-labelledby={labelId}
        aria-describedby={description ? descriptionId : undefined}
        onChange={() => {
          onSelect(value);
        }}
        className="sr-only"
      />

      <span className="flex items-start justify-between gap-4">
        <span className="min-w-0">
          <span
            id={labelId}
            className="block font-semibold text-[var(--color-text)]"
          >
            {label}
          </span>

          {description && (
            <span
              id={descriptionId}
              className="mt-1 block text-sm leading-6 text-[var(--color-text-muted)]"
            >
              {description}
            </span>
          )}
        </span>

        <span
          aria-hidden="true"
          className={clsx(
            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2",
            {
              "border-[var(--color-primary)]": checked,
              "border-[var(--color-border)]": !checked,
            },
          )}
        >
          {checked && (
            <span className="size-2.5 rounded-full bg-[var(--color-primary)]" />
          )}
        </span>
      </span>
    </label>
  );
}
