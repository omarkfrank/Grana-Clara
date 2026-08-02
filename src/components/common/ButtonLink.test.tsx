import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { ButtonLink } from "./ButtonLink";

/**
 * Casos utilizados para validar as variantes visuais
 * compartilhadas com o componente Button.
 */
const buttonLinkVariantCases = [
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

describe("ButtonLink", () => {
  it("renderiza um link acessível com o destino informado", () => {
    render(
      <MemoryRouter>
        <ButtonLink to="/simulacao">Iniciar simulação</ButtonLink>
      </MemoryRouter>,
    );

    const link = screen.getByRole("link", {
      name: "Iniciar simulação",
    });

    expect(link).toBeInTheDocument();

    expect(link).toHaveAttribute("href", "/simulacao");

    expect(link).not.toHaveAttribute("aria-disabled");

    expect(link).toHaveClass("bg-[var(--color-primary)]");
  });

  it("navega para a rota de destino quando é acionado", async () => {
    render(
      <MemoryRouter initialEntries={["/origem"]}>
        <Routes>
          <Route
            path="/origem"
            element={
              <>
                <h1>Página inicial</h1>

                <ButtonLink to="/destino">Abrir destino</ButtonLink>
              </>
            }
          />

          <Route path="/destino" element={<h1>Página de destino</h1>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(
      screen.getByRole("link", {
        name: "Abrir destino",
      }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "Página de destino",
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("heading", {
        name: "Página inicial",
      }),
    ).not.toBeInTheDocument();
  });

  it("impede a navegação e sai da sequência de Tab quando está desabilitado", () => {
    render(
      <MemoryRouter initialEntries={["/origem"]}>
        <Routes>
          <Route
            path="/origem"
            element={
              <>
                <h1>Página inicial</h1>

                <ButtonLink to="/destino" isDisabled>
                  Destino indisponível
                </ButtonLink>
              </>
            }
          />

          <Route path="/destino" element={<h1>Página de destino</h1>} />
        </Routes>
      </MemoryRouter>,
    );

    const link = screen.getByRole("link", {
      name: "Destino indisponível",
    });

    expect(link).toHaveAttribute("aria-disabled", "true");

    expect(link).toHaveAttribute("tabindex", "-1");

    fireEvent.click(link);

    expect(
      screen.getByRole("heading", {
        name: "Página inicial",
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("heading", {
        name: "Página de destino",
      }),
    ).not.toBeInTheDocument();
  });

  it("não executa o manipulador de clique quando está desabilitado", () => {
    const handleClick = vi.fn();

    render(
      <MemoryRouter>
        <ButtonLink to="/destino" isDisabled onClick={handleClick}>
          Continuar
        </ButtonLink>
      </MemoryRouter>,
    );

    fireEvent.click(
      screen.getByRole("link", {
        name: "Continuar",
      }),
    );

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("executa o manipulador recebido e mantém a navegação habilitada", async () => {
    const handleClick = vi.fn();

    render(
      <MemoryRouter initialEntries={["/origem"]}>
        <Routes>
          <Route
            path="/origem"
            element={
              <ButtonLink to="/destino" onClick={handleClick}>
                Prosseguir
              </ButtonLink>
            }
          />

          <Route path="/destino" element={<h1>Destino carregado</h1>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(
      screen.getByRole("link", {
        name: "Prosseguir",
      }),
    );

    expect(handleClick).toHaveBeenCalledTimes(1);

    expect(
      await screen.findByRole("heading", {
        name: "Destino carregado",
      }),
    ).toBeInTheDocument();
  });

  it("preserva atributos, tabIndex e classes personalizados", () => {
    render(
      <MemoryRouter>
        <ButtonLink
          to="/historico"
          tabIndex={2}
          aria-label="Abrir histórico financeiro"
          data-origin="home"
          className="w-full"
        >
          Histórico
        </ButtonLink>
      </MemoryRouter>,
    );

    const link = screen.getByRole("link", {
      name: "Abrir histórico financeiro",
    });

    expect(link).toHaveAttribute("tabindex", "2");

    expect(link).toHaveAttribute("data-origin", "home");

    expect(link).toHaveClass("w-full");
  });

  it.each(buttonLinkVariantCases)(
    "aplica a aparência correspondente à variante $variant",
    ({ variant, expectedClass }) => {
      render(
        <MemoryRouter>
          <ButtonLink to="/destino" variant={variant}>
            Link {variant}
          </ButtonLink>
        </MemoryRouter>,
      );

      const link = screen.getByRole("link", {
        name: `Link ${variant}`,
      });

      expect(link).toHaveClass(expectedClass);

      expect(link).toHaveClass("min-h-11");

      expect(link).toHaveClass("focus-visible:ring-[var(--color-focus-ring)]");
    },
  );
});
