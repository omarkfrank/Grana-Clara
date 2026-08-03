import type { InputHTMLAttributes } from "react";
import clsx from "clsx";

type CurrencyInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange"
> & {
  id: string;
  label: string;
  value: number | null;
  onValueChange: (value: number | null) => void;
  helperText?: string;
  error?: string;
};

const currencyInputFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Transforma os dígitos digitados em um valor monetário.
 *
 * Exemplos:
 * - "1" vira 0,01.
 * - "100" vira 1,00.
 * - "125050" vira 1.250,50.
 */
function parseCurrencyValue(rawValue: string): number | null {
  const digitsOnly = rawValue.replace(/\D/g, "");

  if (!digitsOnly) {
    return null;
  }

  return Number(digitsOnly) / 100;
}

/**
 * Campo monetário reutilizável para valores em Real brasileiro.
 *
 * O texto auxiliar permanece associado ao campo mesmo quando
 * existe um erro, oferecendo contexto completo ao leitor de tela.
 */
export function CurrencyInput({
  id,
  label,
  value,
  onValueChange,
  helperText,
  error,
  className,
  ...props
}: CurrencyInputProps) {
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;

  const describedBy =
    [helperText ? helperId : null, error ? errorId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  const displayValue =
    value === null ? "" : currencyInputFormatter.format(value);

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}
      </label>

      <div className="relative">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
        >
          R$
        </span>

        <input
          {...props}
          id={id}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={(event) => {
            onValueChange(parseCurrencyValue(event.target.value));
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-errormessage={error ? errorId : undefined}
          className={clsx(
            "min-h-12 w-full rounded-xl border bg-[var(--color-surface)] py-3 pl-12 pr-4",
            "text-[var(--color-text)] outline-none",
            "transition-[border-color,box-shadow,background-color] duration-200",
            "placeholder:text-[var(--color-text-muted)]",
            "focus:border-[var(--color-primary)]",
            "focus:ring-2 focus:ring-[var(--color-focus-ring)]",
            "motion-reduce:transition-none",
            {
              "border-[var(--color-border)]": !error,
              "border-[var(--color-danger)]": error,
            },
            className,
          )}
        />
      </div>

      {helperText && (
        <p
          id={helperId}
          className="text-sm leading-6 text-[var(--color-text-muted)]"
        >
          {helperText}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          className="text-sm font-medium leading-6 text-[var(--color-danger)]"
        >
          {error}
        </p>
      )}
    </div>
  );
}
