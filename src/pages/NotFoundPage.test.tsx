import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { NotFoundPage } from "./NotFoundPage";

/**
 * Renderiza a página dentro do roteador necessário para
 * os componentes ButtonLink.
 */
function renderNotFoundPage(): void {
  render(
    <MemoryRouter>
      <NotFoundPage />
    </MemoryRouter>,
  );
}

describe("NotFoundPage", () => {
  it("informa que o endereço não foi encontrado", () => {
    renderNotFoundPage();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Este endereço não existe.",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("Página não encontrada")).toBeInTheDocument();

    expect(
      screen.getByText(
        /O endereço pode estar incorreto ou a página pode ter sido removida/i,
      ),
    ).toBeInTheDocument();
  });

  it("oferece um caminho de retorno para a página inicial", () => {
    renderNotFoundPage();

    const navigation = screen.getByRole("navigation", {
      name: "Opções para continuar",
    });

    expect(
      within(navigation).getByRole("link", {
        name: "Voltar ao início",
      }),
    ).toHaveAttribute("href", "/");
  });

  it("oferece acesso direto para uma nova simulação", () => {
    renderNotFoundPage();

    const navigation = screen.getByRole("navigation", {
      name: "Opções para continuar",
    });

    expect(
      within(navigation).getByRole("link", {
        name: "Criar simulação",
      }),
    ).toHaveAttribute("href", "/simulacao");
  });
});
