import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeToggle } from "./ThemeToggle";

/**
 * Chave utilizada pelo componente para persistir o tema.
 *
 * Mantemos o mesmo valor aqui para verificar a integração real
 * entre o componente e o armazenamento do navegador.
 */
const THEME_STORAGE_KEY = "grana-clara-theme";

/**
 * Consulta utilizada pelo componente para identificar
 * a preferência visual configurada no sistema operacional.
 */
const DARK_THEME_MEDIA_QUERY = "(prefers-color-scheme: dark)";

/**
 * Simula a API window.matchMedia disponibilizada pelos navegadores.
 *
 * O jsdom não implementa completamente essa API, então precisamos
 * controlá-la durante os testes.
 */
function mockSystemTheme(prefersDarkTheme: boolean): void {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn((query: string): MediaQueryList => {
      const matches = query === DARK_THEME_MEDIA_QUERY && prefersDarkTheme;

      return {
        matches,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(() => true),
      };
    }),
  });
}

/**
 * Recupera o botão pelo nome da ação que ele executará.
 *
 * Quando o tema atual é claro, a ação disponível é ativar
 * o tema escuro. No estado oposto, a ação é ativar o tema claro.
 */
function getThemeButton(
  accessibleName: "Ativar tema claro" | "Ativar tema escuro",
): HTMLButtonElement {
  return screen.getByRole("button", {
    name: accessibleName,
  });
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    /**
     * Cada teste começa sem preferência persistida e sem
     * alterações visuais deixadas pelo cenário anterior.
     */
    window.localStorage.clear();

    document.documentElement.classList.remove("dark");

    document.documentElement.style.removeProperty("color-scheme");

    mockSystemTheme(false);
  });

  afterEach(() => {
    /**
     * Restaura spies e implementações simuladas criadas
     * durante cada cenário.
     */
    vi.restoreAllMocks();
  });

  it("inicializa com o tema claro quando não existe preferência salva ou do sistema", async () => {
    render(<ThemeToggle />);

    const button = getThemeButton("Ativar tema escuro");

    expect(button).toHaveAttribute("type", "button");

    expect(button).toHaveAttribute("aria-pressed", "false");

    expect(button).toHaveAttribute("title", "Ativar tema escuro");

    expect(button).toHaveTextContent("Escuro");

    expect(document.documentElement).not.toHaveClass("dark");

    await waitFor(() => {
      expect(document.documentElement.style.colorScheme).toBe("light");

      expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    });
  });

  it("recupera o tema escuro salvo no navegador", async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");

    mockSystemTheme(false);

    render(<ThemeToggle />);

    const button = getThemeButton("Ativar tema claro");

    expect(button).toHaveAttribute("aria-pressed", "true");

    expect(button).toHaveTextContent("Claro");

    await waitFor(() => {
      expect(document.documentElement).toHaveClass("dark");

      expect(document.documentElement.style.colorScheme).toBe("dark");
    });
  });

  it("prioriza o tema claro salvo mesmo quando o sistema prefere o tema escuro", async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");

    mockSystemTheme(true);

    render(<ThemeToggle />);

    const button = getThemeButton("Ativar tema escuro");

    expect(button).toHaveAttribute("aria-pressed", "false");

    await waitFor(() => {
      expect(document.documentElement).not.toHaveClass("dark");

      expect(document.documentElement.style.colorScheme).toBe("light");

      expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    });
  });

  it("utiliza o tema escuro do sistema quando não existe preferência salva", async () => {
    mockSystemTheme(true);

    render(<ThemeToggle />);

    const button = getThemeButton("Ativar tema claro");

    expect(button).toHaveAttribute("aria-pressed", "true");

    expect(button).toHaveTextContent("Claro");

    await waitFor(() => {
      expect(document.documentElement).toHaveClass("dark");

      expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    });
  });

  it("ignora um tema salvo inválido e utiliza a preferência do sistema", async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "sepia");

    mockSystemTheme(true);

    render(<ThemeToggle />);

    expect(getThemeButton("Ativar tema claro")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await waitFor(() => {
      expect(document.documentElement).toHaveClass("dark");

      /**
       * O valor inválido também deve ser substituído pelo
       * tema válido efetivamente aplicado.
       */
      expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    });
  });

  it("alterna do tema claro para o tema escuro e persiste a escolha", async () => {
    mockSystemTheme(false);

    render(<ThemeToggle />);

    const lightThemeButton = getThemeButton("Ativar tema escuro");

    fireEvent.click(lightThemeButton);

    const darkThemeButton = getThemeButton("Ativar tema claro");

    expect(darkThemeButton).toHaveAttribute("aria-pressed", "true");

    expect(darkThemeButton).toHaveTextContent("Claro");

    await waitFor(() => {
      expect(document.documentElement).toHaveClass("dark");

      expect(document.documentElement.style.colorScheme).toBe("dark");

      expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    });
  });

  it("alterna do tema escuro para o tema claro e persiste a escolha", async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");

    render(<ThemeToggle />);

    const darkThemeButton = getThemeButton("Ativar tema claro");

    fireEvent.click(darkThemeButton);

    const lightThemeButton = getThemeButton("Ativar tema escuro");

    expect(lightThemeButton).toHaveAttribute("aria-pressed", "false");

    expect(lightThemeButton).toHaveTextContent("Escuro");

    await waitFor(() => {
      expect(document.documentElement).not.toHaveClass("dark");

      expect(document.documentElement.style.colorScheme).toBe("light");

      expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    });
  });

  it("mantém o ícone decorativo oculto para tecnologias assistivas", () => {
    render(<ThemeToggle />);

    const button = getThemeButton("Ativar tema escuro");

    const icon = button.querySelector("svg");

    expect(icon).toBeInTheDocument();

    expect(icon).toHaveAttribute("aria-hidden", "true");

    /**
     * A presença do SVG não deve alterar o nome acessível,
     * que precisa continuar representando a ação.
     */
    expect(button).toHaveAccessibleName("Ativar tema escuro");
  });

  it("utiliza a preferência do sistema quando a leitura do localStorage falha", async () => {
    mockSystemTheme(true);

    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Armazenamento indisponível.");
    });

    render(<ThemeToggle />);

    expect(getThemeButton("Ativar tema claro")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await waitFor(() => {
      expect(document.documentElement).toHaveClass("dark");

      expect(document.documentElement.style.colorScheme).toBe("dark");
    });
  });

  it("continua alternando visualmente quando a gravação no localStorage falha", async () => {
    const consoleWarnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);

    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Não foi possível gravar.");
    });

    mockSystemTheme(false);

    render(<ThemeToggle />);

    fireEvent.click(getThemeButton("Ativar tema escuro"));

    expect(getThemeButton("Ativar tema claro")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await waitFor(() => {
      /**
       * Mesmo sem persistência, a interface da sessão atual
       * precisa continuar funcionando normalmente.
       */
      expect(document.documentElement).toHaveClass("dark");

      expect(document.documentElement.style.colorScheme).toBe("dark");

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Não foi possível salvar a preferência de tema.",
      );
    });
  });
});
