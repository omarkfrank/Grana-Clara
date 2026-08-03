import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, Link, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppLayout } from "./AppLayout";

/**
 * Simula a API matchMedia utilizada pelo ThemeToggle presente
 * no cabeçalho do layout.
 *
 * O jsdom não implementa essa API completamente, então precisamos
 * disponibilizá-la durante os testes.
 */
function mockMatchMedia(): void {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn(
      (query: string): MediaQueryList => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(() => true),
      }),
    ),
  });
}

/**
 * Cria um roteador em memória com duas páginas.
 *
 * Essa estrutura permite testar:
 * - O título inicial do documento.
 * - A navegação entre páginas.
 * - O gerenciamento de foco.
 * - O anúncio da nova rota.
 */
function createTestRouter(initialEntry = "/") {
  return createMemoryRouter(
    [
      {
        path: "/",
        element: <AppLayout />,
        handle: {
          pageTitle: "Grana Clara",
          documentTitle: "Grana Clara",
        },
        children: [
          {
            index: true,
            handle: {
              pageTitle: "Início",
              documentTitle: "Início | Grana Clara",
            },
            element: (
              <>
                <h1>Página inicial</h1>

                <Link to="/historico">Abrir histórico</Link>
              </>
            ),
          },

          {
            path: "historico",
            handle: {
              pageTitle: "Histórico de simulações",
              documentTitle: "Histórico de simulações | Grana Clara",
            },
            element: (
              <>
                <h1>Histórico de simulações</h1>

                <Link to="/">Voltar ao início</Link>
              </>
            ),
          },
        ],
      },
    ],
    {
      initialEntries: [initialEntry],
    },
  );
}

describe("AppLayout", () => {
  beforeEach(() => {
    /**
     * Garante que cada teste comece sem preferências ou alterações
     * visuais deixadas por cenários anteriores.
     */
    window.localStorage.clear();

    document.documentElement.classList.remove("dark");

    document.documentElement.style.removeProperty("color-scheme");

    document.title = "";

    mockMatchMedia();
  });

  afterEach(() => {
    /**
     * Restaura mocks e spies depois de cada teste.
     */
    vi.restoreAllMocks();
  });

  it("define o título inicial sem capturar o foco da página", async () => {
    const router = createTestRouter();

    render(<RouterProvider router={router} />);

    expect(
      screen.getByRole("heading", {
        name: "Página inicial",
      }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(document.title).toBe("Início | Grana Clara");
    });

    /**
     * Na primeira abertura da aplicação, o conteúdo principal
     * não deve capturar automaticamente o foco.
     */
    expect(screen.getByRole("main")).not.toHaveFocus();
  });

  it("atualiza o título, move o foco e anuncia a nova página", async () => {
    const router = createTestRouter();

    render(<RouterProvider router={router} />);

    const historyLink = screen.getByRole("link", {
      name: "Abrir histórico",
    });

    historyLink.focus();

    expect(historyLink).toHaveFocus();

    fireEvent.click(historyLink);

    expect(
      await screen.findByRole("heading", {
        name: "Histórico de simulações",
      }),
    ).toBeInTheDocument();

    const mainContent = screen.getByRole("main");

    await waitFor(() => {
      expect(document.title).toBe("Histórico de simulações | Grana Clara");

      expect(mainContent).toHaveFocus();

      expect(
        screen.getByText("Página Histórico de simulações carregada."),
      ).toBeInTheDocument();
    });
  });

  it("mantém o link de salto associado ao conteúdo principal", () => {
    const router = createTestRouter();

    render(<RouterProvider router={router} />);

    const skipLink = screen.getByRole("link", {
      name: "Pular para o conteúdo principal",
    });

    const mainContent = screen.getByRole("main");

    expect(skipLink).toHaveAttribute("href", "#main-content");

    expect(mainContent).toHaveAttribute("id", "main-content");

    expect(mainContent).toHaveAttribute("tabindex", "-1");
  });

  it("utiliza o título padrão quando nenhuma rota fornece metadados", async () => {
    const router = createMemoryRouter([
      {
        path: "/",
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <h1>Página sem metadados</h1>,
          },
        ],
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(
      screen.getByRole("heading", {
        name: "Página sem metadados",
      }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(document.title).toBe("Grana Clara");
    });
  });
});
