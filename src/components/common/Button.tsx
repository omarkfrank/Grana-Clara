import type { ButtonHTMLAttributes, ReactNode } from "react";

import { getButtonClassName, type ButtonVariant } from "./buttonStyles";

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
 * O tipo padrão é "button" para evitar submissões acidentais
 * dentro dos formulários em etapas.
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
      className={getButtonClassName({
        variant,
        className,
      })}
      disabled={isDisabled}
      aria-busy={isLoading}
    >
      {isLoading ? "Carregando..." : children}
    </button>
  );
}
