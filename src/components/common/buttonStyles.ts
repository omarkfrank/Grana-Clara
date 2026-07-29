import clsx from "clsx";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonStylesOptions = {
  variant?: ButtonVariant;
  className?: string;
};

/**
 * Centraliza as classes visuais utilizadas pelos botões e links
 * com aparência de botão.
 *
 * A separação permite que Button e ButtonLink compartilhem o mesmo
 * design sem criar elementos interativos aninhados.
 */
export function getButtonClassName({
  variant = "primary",
  className,
}: ButtonStylesOptions): string {
  return clsx(
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
  );
}
