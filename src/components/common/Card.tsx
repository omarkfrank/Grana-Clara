import type { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

type CardVariant = "surface" | "muted" | "outline";

type CardPadding = "none" | "sm" | "md" | "lg";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
};

/**
 * Contêiner visual reutilizável.
 *
 * O Card concentra bordas, fundos, sombras e espaçamentos recorrentes
 * para evitar a repetição dessas classes em todas as páginas.
 */
export function Card({
  children,
  variant = "surface",
  padding = "md",
  className,
  ...props
}: CardProps) {
  return (
    <div
      {...props}
      className={clsx(
        "rounded-3xl transition-colors duration-300",
        {
          "border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm":
            variant === "surface",

          "bg-[var(--color-surface-muted)]": variant === "muted",

          "border border-[var(--color-border)] bg-transparent":
            variant === "outline",

          "p-0": padding === "none",
          "p-4": padding === "sm",
          "p-6": padding === "md",
          "p-8": padding === "lg",
        },
        className,
      )}
    >
      {children}
    </div>
  );
}
