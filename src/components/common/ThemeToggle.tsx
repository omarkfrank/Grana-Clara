import { useEffect, useState } from "react";

/**
 * Chave utilizada para persistir a preferência visual
 * da pessoa usuária no navegador.
 */
const THEME_STORAGE_KEY = "grana-clara-theme";

/**
 * Consulta utilizada para identificar a preferência de tema
 * configurada no sistema operacional.
 */
const DARK_THEME_MEDIA_QUERY = "(prefers-color-scheme: dark)";

type Theme = "light" | "dark";

/**
 * Verifica se um valor desconhecido representa um tema
 * reconhecido pela aplicação.
 */
function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

/**
 * Recupera a preferência salva no navegador.
 *
 * O acesso ao localStorage é protegido porque alguns navegadores,
 * modos privados ou configurações de segurança podem impedir
 * sua utilização.
 */
function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

    return isTheme(storedTheme) ? storedTheme : null;
  } catch {
    return null;
  }
}

/**
 * Recupera a preferência visual do sistema operacional.
 *
 * Quando o navegador não oferece suporte ao matchMedia,
 * utilizamos o tema claro como alternativa segura.
 */
function getSystemTheme(): Theme {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return "light";
  }

  return window.matchMedia(DARK_THEME_MEDIA_QUERY).matches ? "dark" : "light";
}

/**
 * Define o tema utilizado na primeira renderização.
 *
 * Ordem de prioridade:
 * 1. Preferência escolhida anteriormente.
 * 2. Preferência do sistema operacional.
 * 3. Tema claro como alternativa.
 */
function getInitialTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme();
}

/**
 * Aplica o tema ao elemento raiz do documento.
 */
function applyTheme(theme: Theme): void {
  const isDarkTheme = theme === "dark";

  document.documentElement.classList.toggle("dark", isDarkTheme);

  /**
   * Mantém controles nativos do navegador alinhados
   * ao tema selecionado.
   */
  document.documentElement.style.colorScheme = theme;
}

/**
 * Persiste a preferência da pessoa usuária.
 *
 * Uma falha de armazenamento não impede que a alteração visual
 * continue funcionando durante a sessão atual.
 */
function persistTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    console.warn("Não foi possível salvar a preferência de tema.");
  }
}

/**
 * Alternador acessível entre os temas claro e escuro.
 *
 * Responsabilidades:
 * - Respeitar a preferência salva anteriormente.
 * - Utilizar a preferência do sistema quando não houver escolha.
 * - Aplicar a classe dark no elemento HTML.
 * - Persistir alterações feitas pela pessoa usuária.
 * - Informar corretamente o estado para tecnologias assistivas.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  const isDarkTheme = theme === "dark";

  const nextTheme: Theme = isDarkTheme ? "light" : "dark";

  const accessibleLabel = isDarkTheme
    ? "Ativar tema claro"
    : "Ativar tema escuro";

  /**
   * Sincroniza o estado React com o DOM e o localStorage.
   */
  useEffect(() => {
    applyTheme(theme);
    persistTheme(theme);
  }, [theme]);

  /**
   * Alterna para o tema oposto ao atual.
   */
  function handleToggleTheme(): void {
    setTheme(nextTheme);
  }

  return (
    <button
      type="button"
      onClick={handleToggleTheme}
      aria-label={accessibleLabel}
      aria-pressed={isDarkTheme}
      title={accessibleLabel}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-text)] transition-colors duration-300 hover:bg-[var(--color-surface-muted)]"
    >
      {isDarkTheme ? (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" />

          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.42 1.42" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.42" />
        </svg>
      ) : (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      )}

      <span>{isDarkTheme ? "Claro" : "Escuro"}</span>
    </button>
  );
}
