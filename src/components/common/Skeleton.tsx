import type { HTMLAttributes } from "react";
import clsx from "clsx";

type SkeletonRadius = "sm" | "md" | "lg" | "full";

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  radius?: SkeletonRadius;
};

/**
 * Placeholder visual para conteúdos em carregamento.
 *
 * O Skeleton é decorativo. O contêiner que utiliza este componente
 * deverá apresentar uma mensagem acessível informando o carregamento.
 */
export function Skeleton({
  radius = "md",
  className,
  ...props
}: SkeletonProps) {
  return (
    <div
      {...props}
      aria-hidden="true"
      className={clsx(
        "animate-pulse bg-[var(--color-surface-muted)]",
        {
          "rounded-md": radius === "sm",
          "rounded-xl": radius === "md",
          "rounded-2xl": radius === "lg",
          "rounded-full": radius === "full",
        },
        className,
      )}
    />
  );
}
