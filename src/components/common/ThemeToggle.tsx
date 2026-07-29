import { useEffect, useState } from "react";

const THEME_STORAGE_KEY = "grana-clara-theme";

type Theme = "light" | "dark";

/**
 * Recupera o tema salvo no navegador.
 *
 * A função é utilizada como inicializador do useState para evitar
 * uma renderização adicional após a montagem do componente.
 */
function getInitialTheme(): Theme {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

  return savedTheme === "dark" ? "dark" : "light";
}

/**
 * Alternador de tema claro/escuro.
 *
 * Responsabilidades:
 * - Inicializar o estado com a preferência salva.
 * - Aplicar a classe "dark" no elemento <html>.
 * - Persistir a escolha do usuário no navegador.
 *
 * O useEffect é utilizado apenas para sincronizar o estado do React
 * com sistemas externos: o DOM e o localStorage.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const isDarkTheme = theme === "dark";

    document.documentElement.classList.toggle("dark", isDarkTheme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  function handleToggleTheme() {
    setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
  }

  return (
    <button
      type="button"
      onClick={handleToggleTheme}
      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-text)] transition-colors duration-300 hover:bg-[var(--color-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
      aria-label="Alternar tema claro e escuro"
      aria-pressed={theme === "dark"}
    >
      {theme === "light" ? "🌙 Escuro" : "☀️ Claro"}
    </button>
  );
}
