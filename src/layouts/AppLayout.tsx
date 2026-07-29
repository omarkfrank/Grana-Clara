import { Outlet } from "react-router";

import { ThemeToggle } from "../components/common/ThemeToggle";

/**
 * Layout principal da aplicação.
 *
 * Responsabilidades:
 * - Definir a estrutura visual comum entre as páginas.
 * - Exibir cabeçalho, conteúdo principal e rodapé.
 * - Manter o projeto com aparência consistente.
 *
 * O componente <Outlet /> representa o local onde cada página da rota
 * será renderizada pelo React Router.
 */
export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)] text-[var(--color-text)] transition-colors duration-300">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-sm font-medium text-[var(--color-text-muted)]">
              Educador financeiro com IA
            </p>

            <h1 className="text-xl font-bold tracking-tight">Grana Clara</h1>
          </div>

          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-[var(--color-border)] px-4 py-6 text-center text-sm text-[var(--color-text-muted)]">
        Grana Clara — educação financeira simples, prática e inteligente.
      </footer>
    </div>
  );
}
