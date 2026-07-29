import type { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  isLoading?: boolean;
};

/**
 * Botão reutilizável do Grana Clara.
 *
 * Responsabilidades:
 * - Centralizar o padrão visual dos botões.
 * - Disponibilizar variações sem duplicação de classes.
 * - Impedir interações durante o carregamento.
 * - Preservar acessibilidade por teclado.
 *
 * O tipo padrão é "button" para evitar que o componente envie
 * formulários acidentalmente. Quando necessário, o consumidor
 * poderá informar explicitamente type="submit".
 */
export function Button({
  children,
  variant = "primary",
  isLoading = false,
  className,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      {...props}
      type={type}
      className={clsx(
        "inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-2.5",
        "text-sm font-semibold transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-[var(--color-primary)]",
        "focus-visible:ring-offset-2",
        "focus-visible:ring-offset-[var(--color-background)]",
        "disabled:cursor-not-allowed disabled:opacity-60",
        {
          "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]":
            variant === "primary",

          "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]":
            variant === "secondary",

          "text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]":
            variant === "ghost",

          "bg-[var(--color-danger)] text-white hover:bg-[var(--color-danger-hover)]":
            variant === "danger",
        },
        className,
      )}
      disabled={isDisabled}
      aria-busy={isLoading}
    >
      {isLoading ? "Carregando..." : children}
    </button>
  );
}
