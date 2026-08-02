import type { ReactNode } from "react";
import { Link, type LinkProps } from "react-router";

import { getButtonClassName, type ButtonVariant } from "./buttonStyles";

type ButtonLinkProps = Omit<LinkProps, "className"> & {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;

  /**
   * Permite apresentar temporariamente um link como indisponível.
   *
   * Diferentemente do elemento button, links não possuem o
   * atributo disabled nativo. Por isso, o bloqueio precisa ser
   * implementado por semântica e comportamento.
   */
  isDisabled?: boolean;
};

/**
 * Link de navegação com aparência visual de botão.
 *
 * Deve ser utilizado quando a ação direcionar a pessoa para outra
 * rota da aplicação. Assim, evitamos colocar um elemento button
 * dentro do elemento anchor gerado pelo React Router.
 *
 * Quando isDisabled estiver ativo:
 * - A navegação é impedida.
 * - O link recebe aria-disabled.
 * - O elemento é removido temporariamente da sequência do Tab.
 * - O estilo visual acompanha os botões desabilitados.
 */
export function ButtonLink({
  children,
  variant = "primary",
  className,
  isDisabled = false,
  onClick,
  tabIndex,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      {...props}
      className={getButtonClassName({
        variant,
        className,
      })}
      aria-disabled={isDisabled || undefined}
      tabIndex={isDisabled ? -1 : tabIndex}
      onClick={(event) => {
        /**
         * pointer-events impede cliques comuns, mas mantemos
         * também esta proteção comportamental para evitar
         * navegações acionadas programaticamente.
         */
        if (isDisabled) {
          event.preventDefault();
          return;
        }

        onClick?.(event);
      }}
    >
      {children}
    </Link>
  );
}
