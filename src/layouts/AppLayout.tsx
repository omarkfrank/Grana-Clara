import { Link, Outlet, useNavigation } from "react-router";

import { ThemeToggle } from "../components/common/ThemeToggle";

/**
 * Layout principal da aplicação.
 *
 * Responsabilidades:
 * - Definir a estrutura visual comum entre as páginas.
 * - Exibir cabeçalho, conteúdo principal e rodapé.
 * - Informar quando uma nova rota está sendo carregada.
 * - Oferecer navegação rápida para usuários de teclado.
 * - Manter o projeto com aparência consistente.
 *
 * O componente <Outlet /> representa o local onde a página
 * correspondente à rota atual será renderizada.
 */
export function AppLayout() {
  /**
   * O React Router informa o estado atual da navegação.
   *
   * O estado "loading" ocorre enquanto o conteúdo necessário
   * para a próxima rota está sendo carregado.
   */
  const navigation = useNavigation();

  const isNavigating = navigation.state === "loading";

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)] text-[var(--color-text)] transition-colors duration-300">
      {/*
       * Primeiro elemento interativo da aplicação.
       *
       * Ele fica visualmente oculto até receber foco pelo teclado.
       * Ao ser ativado, direciona a pessoa diretamente para o
       * conteúdo principal, ignorando o cabeçalho.
       */}
      <a href="#main-content" className="skip-link">
        Pular para o conteúdo principal
      </a>

      <header className="relative border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4">
          {/*
           * A marca funciona como acesso à página inicial.
           *
           * Utilizamos Link para preservar a navegação interna
           * sem recarregar todo o documento.
           */}
          <Link
            to="/"
            aria-label="Grana Clara — ir para a página inicial"
            className="inline-block rounded-md"
          >
            <span className="block text-sm font-medium text-[var(--color-text-muted)]">
              Educador financeiro com IA
            </span>

            {/*
             * O nome da marca não utiliza h1 porque cada página
             * possui seu próprio título principal.
             */}
            <span className="block text-xl font-bold tracking-tight">
              Grana Clara
            </span>
          </Link>

          <ThemeToggle />
        </div>

        {/*
         * Indicador global de navegação.
         *
         * Ele ocupa uma área absoluta na parte inferior do
         * cabeçalho, evitando deslocamentos no conteúdo.
         */}
        {isNavigating && (
          <div
            role="status"
            aria-live="polite"
            aria-label="Carregando a próxima página"
            className="absolute inset-x-0 bottom-0 h-1 overflow-hidden bg-emerald-100 dark:bg-emerald-950"
          >
            <div
              aria-hidden="true"
              className="h-full w-full animate-pulse bg-gradient-to-r from-emerald-400 via-emerald-600 to-emerald-400 motion-reduce:animate-none"
            />

            <span className="sr-only">Carregando a próxima página...</span>
          </div>
        )}
      </header>

      {/*
       * Destino do link "Pular para o conteúdo".
       *
       * tabIndex={-1} permite que o elemento receba foco
       * programaticamente sem entrar na sequência normal do Tab.
       */}
      <main
        id="main-content"
        tabIndex={-1}
        aria-busy={isNavigating}
        className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 outline-none"
      >
        <Outlet />
      </main>

      <footer className="border-t border-[var(--color-border)] px-4 py-6 text-center text-sm text-[var(--color-text-muted)]">
        Grana Clara — educação financeira simples, prática e inteligente.
      </footer>
    </div>
  );
}
