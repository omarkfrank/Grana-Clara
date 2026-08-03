import { useEffect, useRef, useState } from "react";

import {
  Link,
  Outlet,
  useLocation,
  useMatches,
  useNavigation,
} from "react-router";

import { BrandMark } from "../components/brand/BrandMark";
import { ThemeToggle } from "../components/common/ThemeToggle";

/**
 * Estrutura esperada nos metadados de cada rota.
 *
 * pageTitle:
 * Nome curto utilizado no anúncio da navegação.
 *
 * documentTitle:
 * Título completo apresentado na aba do navegador.
 */
type RouteHandle = {
  pageTitle: string;
  documentTitle?: string;
};

/**
 * Verifica se o handle recebido possui os metadados
 * esperados pelo layout.
 */
function isRouteHandle(handle: unknown): handle is RouteHandle {
  if (typeof handle !== "object" || handle === null) {
    return false;
  }

  return "pageTitle" in handle && typeof handle.pageTitle === "string";
}

/**
 * Localiza os metadados da rota mais específica atualmente ativa.
 *
 * O React Router retorna todos os segmentos correspondentes,
 * começando pelo layout e terminando na página atual. Por isso,
 * realizamos a busca em ordem inversa.
 */
function getCurrentRouteHandle(
  matches: ReturnType<typeof useMatches>,
): RouteHandle | null {
  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const handle = matches[index].handle;

    if (isRouteHandle(handle)) {
      return handle;
    }
  }

  return null;
}

/**
 * Layout principal da aplicação.
 *
 * Responsabilidades:
 * - Definir a estrutura visual compartilhada pelas páginas.
 * - Exibir cabeçalho, conteúdo principal e rodapé.
 * - Apresentar a identidade oficial do Grana Clara.
 * - Informar quando uma nova rota está sendo carregada.
 * - Atualizar o título da aba conforme a rota.
 * - Direcionar o foco para o conteúdo após navegações internas.
 * - Anunciar a página carregada para tecnologias assistivas.
 * - Oferecer navegação rápida para pessoas que utilizam teclado.
 *
 * O componente <Outlet /> representa o local onde a página
 * correspondente à rota atual será renderizada.
 */
export function AppLayout() {
  const navigation = useNavigation();

  const location = useLocation();

  const matches = useMatches();

  /**
   * Referência utilizada para direcionar o foco ao conteúdo
   * principal depois de uma navegação interna.
   */
  const mainContentRef = useRef<HTMLElement>(null);

  /**
   * Impede que o layout capture o foco durante a primeira
   * renderização da aplicação.
   *
   * O foco automático é necessário somente depois que a pessoa
   * inicia uma navegação dentro da SPA.
   */
  const isInitialRender = useRef(true);

  /**
   * Texto inserido na região viva depois que uma nova página
   * é carregada.
   */
  const [routeAnnouncement, setRouteAnnouncement] = useState("");

  const isNavigating = navigation.state === "loading";

  const currentRouteHandle = getCurrentRouteHandle(matches);

  const pageTitle = currentRouteHandle?.pageTitle ?? "Grana Clara";

  const documentTitle = currentRouteHandle?.documentTitle ?? "Grana Clara";

  /**
   * Mantém a aba do navegador sincronizada com a rota ativa.
   */
  useEffect(() => {
    document.title = documentTitle;
  }, [documentTitle]);

  /**
   * Gerencia foco e anúncio depois de uma navegação interna.
   *
   * location.key é alterado pelo React Router a cada nova entrada
   * no histórico de navegação.
   */
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;

      return;
    }

    /**
     * O preventScroll evita um salto visual inesperado.
     *
     * A pessoa permanece na posição gerenciada pelo navegador,
     * enquanto tecnologias assistivas reconhecem que o conteúdo
     * principal foi atualizado.
     */
    mainContentRef.current?.focus({
      preventScroll: true,
    });

    setRouteAnnouncement(`Página ${pageTitle} carregada.`);
  }, [location.key, pageTitle]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)] text-[var(--color-text)] transition-colors duration-300 motion-reduce:transition-none">
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
           * O nome acessível completo permanece no Link, enquanto
           * o SVG é ignorado por tecnologias assistivas.
           */}
          <Link
            to="/"
            aria-label="Grana Clara — ir para a página inicial"
            className="group inline-flex items-center gap-3 rounded-xl p-1"
          >
            <BrandMark className="h-11 w-11 shrink-0 transition-transform duration-200 group-hover:scale-105 motion-reduce:transition-none" />

            <span className="min-w-0">
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
       * Região viva dedicada ao anúncio de navegações concluídas.
       *
       * Ela permanece visualmente oculta, mas seu conteúdo é
       * comunicado de forma não intrusiva por leitores de tela.
       */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {routeAnnouncement}
      </div>

      {/*
       * Destino do link "Pular para o conteúdo".
       *
       * tabIndex={-1} permite que o elemento receba foco pelo link
       * de salto e programaticamente, sem entrar na sequência
       * normal de navegação pelo Tab.
       */}
      <main
        ref={mainContentRef}
        id="main-content"
        tabIndex={-1}
        aria-busy={isNavigating || undefined}
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
