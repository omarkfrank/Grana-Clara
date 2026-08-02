import clsx from "clsx";

/**
 * Variações visuais disponíveis para botões e links de ação.
 */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonStylesOptions = {
  variant?: ButtonVariant;
  className?: string;
};

/**
 * Centraliza as classes visuais utilizadas pelos botões e links
 * com aparência de botão.
 *
 * A separação permite que Button e ButtonLink compartilhem:
 * - Dimensões.
 * - Tipografia.
 * - Estados de foco.
 * - Estados desabilitados.
 * - Transições e feedback de interação.
 *
 * Dessa forma, evitamos duplicação visual e mantemos a interface
 * consistente em toda a aplicação.
 */
export function getButtonClassName({
  variant = "primary",
  className,
}: ButtonStylesOptions): string {
  return clsx(
    /**
     * Estrutura e área mínima de interação.
     *
     * min-h-11 corresponde a aproximadamente 44 pixels,
     * dimensão adequada para interação por toque.
     */
    "inline-flex min-h-11 touch-manipulation select-none items-center justify-center gap-2",
    "rounded-xl px-5 py-2.5 text-center text-sm font-semibold leading-5",

    /**
     * Transições limitadas às propriedades realmente utilizadas.
     *
     * Isso evita animar propriedades desnecessárias e mantém
     * a interação mais previsível.
     */
    "transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-200",

    /**
     * Feedback ao pressionar o controle.
     */
    "active:translate-y-px",

    /**
     * Foco visível para navegação por teclado.
     *
     * A cor acompanha o token global definido nos temas
     * claro e escuro.
     */
    "focus-visible:outline-none focus-visible:ring-2",
    "focus-visible:ring-[var(--color-focus-ring)]",
    "focus-visible:ring-offset-2",
    "focus-visible:ring-offset-[var(--color-background)]",

    /**
     * Estado desabilitado de botões nativos.
     */
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60",
    "disabled:active:translate-y-0",

    /**
     * Estado desabilitado de links com aparência de botão.
     */
    "aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:opacity-60",
    "aria-disabled:active:translate-y-0",

    /**
     * Respeita a preferência por menos animações.
     */
    "motion-reduce:transform-none motion-reduce:transition-none",

    {
      /**
       * Ação principal da página.
       */
      "border border-transparent bg-[var(--color-primary)] text-white shadow-sm hover:bg-[var(--color-primary-hover)]":
        variant === "primary",

      /**
       * Ação alternativa ou complementar.
       */
      "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]":
        variant === "secondary",

      /**
       * Ação discreta, normalmente utilizada em interfaces
       * com menor prioridade visual.
       */
      "border border-transparent text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]":
        variant === "ghost",

      /**
       * Ação destrutiva, como exclusão de dados.
       */
      "border border-transparent bg-[var(--color-danger)] text-white shadow-sm hover:bg-[var(--color-danger-hover)]":
        variant === "danger",
    },

    className,
  );
}
