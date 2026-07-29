import type { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

type AlertVariant = "info" | "success" | "warning" | "danger";

type AlertProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  children: ReactNode;
  title?: ReactNode;
  variant?: AlertVariant;
};

/**
 * Mensagem contextual reutilizável.
 *
 * O componente será utilizado para feedbacks de:
 * - Informação.
 * - Sucesso.
 * - Atenção.
 * - Erro.
 */
export function Alert({
  children,
  title,
  variant = "info",
  className,
  role,
  ...props
}: AlertProps) {
  return (
    <div
      {...props}
      role={role ?? (variant === "danger" ? "alert" : "status")}
      className={clsx(
        "rounded-2xl border p-4",
        {
          "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]":
            variant === "info",

          "border-[var(--color-success)] bg-[var(--color-success-soft)] text-[var(--color-success)]":
            variant === "success",

          "border-[var(--color-warning)] bg-[var(--color-warning-soft)] text-[var(--color-warning)]":
            variant === "warning",

          "border-[var(--color-danger)] bg-[var(--color-danger-soft)] text-[var(--color-danger)]":
            variant === "danger",
        },
        className,
      )}
    >
      {title && <p className="font-semibold">{title}</p>}

      <div className={clsx("text-sm leading-6", title && "mt-1")}>
        {children}
      </div>
    </div>
  );
}
