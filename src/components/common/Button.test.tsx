import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./Button";

/**
 * Casos utilizados para validar se cada variante recebe
 * sua classe visual característica.
 */
const buttonVariantCases = [
  {
    variant: "primary",
    expectedClass: "bg-[var(--color-primary)]",
  },
  {
    variant: "secondary",
    expectedClass: "bg-[var(--color-surface)]",
  },
  {
    variant: "ghost",
    expectedClass: "border-transparent",
  },
  {
    variant: "danger",
    expectedClass: "bg-[var(--color-danger)]",
  },
] as const;

describe("Button", () => {
  it("renderiza o conteúdo e utiliza type button por padrão", () => {
    render(<Button>Continuar</Button>);

    const button = screen.getByRole("button", {
      name: "Continuar",
    });

    expect(button).toBeInTheDocument();

    expect(button).toHaveAttribute("type", "button");

    expect(button).toBeEnabled();
  });

  it("encaminha atributos nativos e classes personalizadas", () => {
    render(
      <Button
        id="save-simulation"
        name="save"
        type="submit"
        aria-label="Salvar simulação"
        className="w-full"
      >
        Salvar
      </Button>,
    );

    const button = screen.getByRole("button", {
      name: "Salvar simulação",
    });

    expect(button).toHaveAttribute("id", "save-simulation");

    expect(button).toHaveAttribute("name", "save");

    expect(button).toHaveAttribute("type", "submit");

    expect(button).toHaveClass("w-full");
  });

  it("executa o evento de clique quando está habilitado", () => {
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Calcular</Button>);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Calcular",
      }),
    );

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("impede cliques quando recebe o atributo disabled", () => {
    const handleClick = vi.fn();

    render(
      <Button disabled onClick={handleClick}>
        Excluir
      </Button>,
    );

    const button = screen.getByRole("button", {
      name: "Excluir",
    });

    expect(button).toBeDisabled();

    fireEvent.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("apresenta o estado de carregamento e bloqueia novas interações", () => {
    const handleClick = vi.fn();

    render(
      <Button isLoading onClick={handleClick}>
        Gerar análise
      </Button>,
    );

    const button = screen.getByRole("button", {
      name: "Carregando...",
    });

    expect(button).toBeDisabled();

    expect(button).toHaveAttribute("aria-busy", "true");

    expect(button).toHaveAttribute("data-loading", "true");

    expect(screen.queryByText("Gerar análise")).not.toBeInTheDocument();

    const spinner = button.querySelector("svg");

    expect(spinner).toBeInTheDocument();

    expect(spinner).toHaveAttribute("aria-hidden", "true");

    fireEvent.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("utiliza um texto de carregamento personalizado", () => {
    render(
      <Button isLoading loadingLabel="Enviando pergunta...">
        Enviar
      </Button>,
    );

    expect(
      screen.getByRole("button", {
        name: "Enviando pergunta...",
      }),
    ).toBeDisabled();

    expect(screen.getByText("Enviando pergunta...")).toBeInTheDocument();
  });

  it.each(buttonVariantCases)(
    "aplica a aparência correspondente à variante $variant",
    ({ variant, expectedClass }) => {
      render(<Button variant={variant}>Ação {variant}</Button>);

      const button = screen.getByRole("button", {
        name: `Ação ${variant}`,
      });

      expect(button).toHaveClass(expectedClass);

      expect(button).toHaveClass("min-h-11");

      expect(button).toHaveClass(
        "focus-visible:ring-[var(--color-focus-ring)]",
      );
    },
  );
});
