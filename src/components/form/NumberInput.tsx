import type { InputHTMLAttributes } from "react";
import clsx from "clsx";

type NumberInputProps = Omit<
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

/**
 * Campo numérico reutilizável.
 *
 * Será utilizado inicialmente para o prazo da meta em meses.
 */
export function NumberInput({
  id,
  label,
  value,
  onValueChange,
  helperText,
  error,
  className,
  ...props
}: NumberInputProps) {
  const descriptionId = error
    ? `${id}-error`
    : helperText
      ? `${id}-helper`
      : undefined;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}
      </label>

      <input
        {...props}
        id={id}
        type="number"
        inputMode="numeric"
        value={value ?? ""}
        onChange={(event) => {
          const parsedValue = event.target.valueAsNumber;

          onValueChange(Number.isNaN(parsedValue) ? null : parsedValue);
        }}
        aria-invalid={Boolean(error)}
        aria-describedby={descriptionId}
        className={clsx(
          "min-h-12 w-full rounded-xl border bg-[var(--color-surface)] px-4 py-3",
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
