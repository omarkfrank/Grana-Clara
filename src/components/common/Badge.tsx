import type { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "danger";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  variant?: BadgeVariant;
};

/**
 * Indicador textual compacto.
 *
 * Pode representar categorias, estados financeiros, informações
 * auxiliares e classificações de viabilidade.
 */
export function Badge({
  children,
  variant = "neutral",
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      {...props}
      className={clsx(
        "inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold",
        {
          "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]":
            variant === "neutral",

          "bg-[var(--color-primary-soft)] text-[var(--color-primary)]":
            variant === "primary",

          "bg-[var(--color-success-soft)] text-[var(--color-success)]":
            variant === "success",

          "bg-[var(--color-warning-soft)] text-[var(--color-warning)]":
            variant === "warning",

          "bg-[var(--color-danger-soft)] text-[var(--color-danger)]":
            variant === "danger",
        },
        className,
      )}
    >
      {children}
    </span>
  );
}
