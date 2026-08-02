import { type HTMLAttributes, type ReactNode, useId } from "react";
import clsx from "clsx";

type AlertVariant = "info" | "success" | "warning" | "danger";

type AlertProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  children: ReactNode;
  title?: ReactNode;
  variant?: AlertVariant;
};

/**
 * Propriedades internas do ícone apresentado no alerta.
 */
type AlertIconProps = {
  variant: AlertVariant;
};

/**
 * Ícone semântico utilizado para diferenciar visualmente
 * cada tipo de mensagem.
 *
 * O ícone é decorativo para tecnologias assistivas porque
 * o significado da mensagem já é comunicado pelo conteúdo,
 * pelo título e pelo papel semântico do componente.
 */
function AlertIcon({ variant }: AlertIconProps) {
  const commonProps = {
    "aria-hidden": true,
    viewBox: "0 0 24 24",
    width: 20,
    height: 20,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (variant === "success") {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="12" r="9" />

        <path d="m8 12 2.5 2.5L16 9" />
      </svg>
    );
  }

  if (variant === "warning") {
    return (
      <svg {...commonProps}>
        <path d="M10.3 3.7 2.4 17.4A2 2 0 0 0 4.1 20h15.8a2 2 0 0 0 1.7-2.6L13.7 3.7a2 2 0 0 0-3.4 0Z" />

        <path d="M12 9v4" />

        <path d="M12 17h.01" />
      </svg>
    );
  }

  if (variant === "danger") {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="12" r="9" />

        <path d="M12 8v5" />

        <path d="M12 17h.01" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <circle cx="12" cy="12" r="9" />

      <path d="M12 11v5" />

      <path d="M12 8h.01" />
    </svg>
  );
}

/**
 * Retorna o papel semântico padrão do alerta.
 *
 * Erros utilizam "alert" porque normalmente exigem atenção
 * imediata. As demais mensagens utilizam "status" para serem
 * anunciadas de forma menos intrusiva.
 */
function getDefaultRole(variant: AlertVariant): "alert" | "status" {
  return variant === "danger" ? "alert" : "status";
}

/**
 * Mensagem contextual reutilizável do Grana Clara.
 *
 * O componente pode apresentar:
 * - Informações.
 * - Confirmações de sucesso.
 * - Avisos.
 * - Erros.
 *
 * Além da diferenciação visual, o componente configura
 * automaticamente o comportamento apropriado para leitores
 * de tela.
 */
export function Alert({
  children,
  title,
  variant = "info",
  className,
  role,
  "aria-live": ariaLive,
  "aria-atomic": ariaAtomic,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  ...props
}: AlertProps) {
  /**
   * Identificadores utilizados para associar semanticamente
   * o título e o conteúdo ao contêiner do alerta.
   */
  const generatedTitleId = useId();

  const generatedContentId = useId();

  const resolvedRole = role ?? getDefaultRole(variant);

  /**
   * Alertas de erro devem ser anunciados imediatamente.
   *
   * Informações, avisos e confirmações utilizam anúncio
   * educado para não interromper desnecessariamente a pessoa.
   */
  const defaultAriaLive =
    resolvedRole === "alert"
      ? "assertive"
      : resolvedRole === "status"
        ? "polite"
        : undefined;

  const shouldBeAtomic = resolvedRole === "alert" || resolvedRole === "status";

  return (
    <div
      {...props}
      role={resolvedRole}
      aria-live={ariaLive ?? defaultAriaLive}
      aria-atomic={ariaAtomic ?? (shouldBeAtomic ? true : undefined)}
      aria-labelledby={ariaLabelledBy ?? (title ? generatedTitleId : undefined)}
      aria-describedby={ariaDescribedBy ?? generatedContentId}
      data-variant={variant}
      className={clsx(
        "rounded-2xl border p-4 text-[var(--color-text)] shadow-sm",
        {
          "border-[var(--color-primary)] bg-[var(--color-primary-soft)]":
            variant === "info",

          "border-[var(--color-success)] bg-[var(--color-success-soft)]":
            variant === "success",

          "border-[var(--color-warning)] bg-[var(--color-warning-soft)]":
            variant === "warning",

          "border-[var(--color-danger)] bg-[var(--color-danger-soft)]":
            variant === "danger",
        },
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={clsx("mt-0.5 shrink-0", {
            "text-[var(--color-primary)]": variant === "info",

            "text-[var(--color-success)]": variant === "success",

            "text-[var(--color-warning)]": variant === "warning",

            "text-[var(--color-danger)]": variant === "danger",
          })}
        >
          <AlertIcon variant={variant} />
        </span>

        <div className="min-w-0 flex-1">
          {title && (
            <div
              id={generatedTitleId}
              className={clsx("font-semibold leading-6", {
                "text-[var(--color-primary)]": variant === "info",

                "text-[var(--color-success)]": variant === "success",

                "text-[var(--color-warning)]": variant === "warning",

                "text-[var(--color-danger)]": variant === "danger",
              })}
            >
              {title}
            </div>
          )}

          <div
            id={generatedContentId}
            className={clsx(
              "text-sm leading-6 text-[var(--color-text)]",
              title && "mt-1",
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
