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
  const descriptionId = error
    ? `${id}-error`
    : helperText
      ? `${id}-helper`
      : undefined;

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
          onChange={(event) =>
            onValueChange(parseCurrencyValue(event.target.value))
          }
          aria-invalid={Boolean(error)}
          aria-describedby={descriptionId}
          className={clsx(
            "min-h-12 w-full rounded-xl border bg-[var(--color-surface)] py-3 pl-12 pr-4",
            "text-[var(--color-text)] outline-none transition-colors duration-200",
            "placeholder:text-[var(--color-text-muted)]",
            "focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-soft)]",
            {
              "border-[var(--color-border)]": !error,
              "border-[var(--color-danger)]": error,
            },
            className,
          )}
        />
      </div>

      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-sm text-[var(--color-danger)]"
        >
          {error}
        </p>
      ) : (
        helperText && (
          <p
            id={`${id}-helper`}
            className="text-sm text-[var(--color-text-muted)]"
          >
            {helperText}
          </p>
        )
      )}
    </div>
  );
}
