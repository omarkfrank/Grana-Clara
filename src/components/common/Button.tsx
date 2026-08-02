import type { ButtonHTMLAttributes, ReactNode } from "react";

import { getButtonClassName, type ButtonVariant } from "./buttonStyles";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  isLoading?: boolean;

  /**
   * Texto apresentado enquanto a ação está sendo processada.
   */
  loadingLabel?: string;
};

/**
 * Indicador visual utilizado durante ações assíncronas.
 *
 * O SVG é decorativo porque o estado também é comunicado por:
 * - Texto visível.
 * - aria-busy no botão.
 */
function LoadingSpinner() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4 animate-spin motion-reduce:animate-none"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-25"
      />

      <path
        fill="currentColor"
        className="opacity-80"
        d="M21 12a9 9 0 0 0-9-9v3a6 6 0 0 1 6 6h3Z"
      />
    </svg>
  );
}

/**
 * Botão reutilizável do Grana Clara.
 *
 * Responsabilidades:
 * - Centralizar o padrão visual dos botões.
 * - Disponibilizar variações sem duplicação de classes.
 * - Impedir interações durante o carregamento.
 * - Comunicar estados assíncronos para tecnologias assistivas.
 * - Preservar acessibilidade por teclado.
 *
 * O tipo padrão é "button" para evitar submissões acidentais
 * dentro dos formulários em etapas.
 */
export function Button({
  children,
  variant = "primary",
  isLoading = false,
  loadingLabel = "Carregando...",
  className,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  /**
   * Uma ação em processamento também deve impedir novos cliques.
   */
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
      aria-busy={isLoading || undefined}
      data-loading={isLoading ? "true" : undefined}
    >
      {isLoading ? (
        <>
          <LoadingSpinner />

          <span>{loadingLabel}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
