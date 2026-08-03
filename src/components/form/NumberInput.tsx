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
 * Utilizado inicialmente para o prazo da meta em meses.
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
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;

  const describedBy =
    [helperText ? helperId : null, error ? errorId : null]
      .filter(Boolean)
      .join(" ") || undefined;

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
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        aria-errormessage={error ? errorId : undefined}
        className={clsx(
          "min-h-12 w-full rounded-xl border bg-[var(--color-surface)] px-4 py-3",
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
