import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { HomePage } from "./HomePage";

/**
 * Renderiza a página inicial dentro do contexto mínimo
 * necessário para que os links do React Router funcionem.
 */
function renderHomePage(): void {
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );
}

describe("HomePage", () => {
  it("apresenta a proposta principal da aplicação", () => {
    renderHomePage();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Entenda sua grana com mais clareza.",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Planejamento financeiro mobile-first"),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Simule uma meta financeira, descubra se ela é viável/i),
    ).toBeInTheDocument();
  });

  it("apresenta os principais caminhos de navegação", () => {
    renderHomePage();

    const mainActions = screen.getByRole("navigation", {
      name: "Ações principais",
    });

    expect(
      within(mainActions).getByRole("link", {
        name: "Começar simulação",
      }),
    ).toHaveAttribute("href", "/simulacao");

    expect(
      within(mainActions).getByRole("link", {
        name: "Ver histórico",
      }),
    ).toHaveAttribute("href", "/historico");
  });

  it("apresenta o diagnóstico de exemplo como conteúdo complementar", () => {
    renderHomePage();

    const exampleDiagnosis = screen.getByRole("complementary", {
      name: "Exemplo de diagnóstico",
    });

    expect(
      within(exampleDiagnosis).getByText("Valor disponível por mês"),
    ).toBeInTheDocument();

    expect(
      within(exampleDiagnosis).getByText("Economia necessária"),
    ).toBeInTheDocument();

    expect(exampleDiagnosis.querySelectorAll("dt")).toHaveLength(2);

    expect(exampleDiagnosis.querySelectorAll("dd")).toHaveLength(2);
  });

  it("formata corretamente os valores do diagnóstico", () => {
    renderHomePage();

    const exampleDiagnosis = screen.getByRole("complementary", {
      name: "Exemplo de diagnóstico",
    });

    expect(
      within(exampleDiagnosis).getByText(/R\$\s*1\.250,00/),
    ).toBeInTheDocument();

    expect(
      within(exampleDiagnosis).getByText(/R\$\s*900,00/),
    ).toBeInTheDocument();

    expect(
      within(exampleDiagnosis).getByText(/R\$\s*350,00/),
    ).toBeInTheDocument();

    expect(
      within(exampleDiagnosis).getByText("Meta viável"),
    ).toBeInTheDocument();
  });
});
