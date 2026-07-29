import type { ReactNode } from "react";
import { Link, type LinkProps } from "react-router";

import { getButtonClassName, type ButtonVariant } from "./buttonStyles";

type ButtonLinkProps = Omit<LinkProps, "className"> & {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
};

/**
 * Link de navegação com aparência visual de botão.
 *
 * Deve ser utilizado quando a ação direcionar o usuário para outra
 * rota da aplicação. Assim, evitamos colocar um elemento <button>
 * dentro do elemento <a> gerado pelo React Router.
 */
export function ButtonLink({
  children,
  variant = "primary",
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      {...props}
      className={getButtonClassName({
        variant,
        className,
      })}
    >
      {children}
    </Link>
  );
}
