import { createBrowserRouter } from "react-router";

import { AppLayout } from "../layouts/AppLayout";
import { HistoryPage } from "../pages/HistoryPage";
import { HomePage } from "../pages/HomePage";
import { ResultPage } from "../pages/ResultPage";
import { SimulationPage } from "../pages/SimulationPage";

/**
 * Metadados utilizados pelo AppLayout para:
 * - Atualizar o título da aba.
 * - Anunciar a página carregada.
 *
 * Manter essas informações junto das rotas reduz duplicações
 * e facilita futuras alterações na estrutura de navegação.
 */
const routeHandles = {
  application: {
    pageTitle: "Grana Clara",
    documentTitle: "Grana Clara — Educação financeira simples e inteligente",
  },

  home: {
    pageTitle: "Início",
    documentTitle:
      "Grana Clara — Educação financeira com inteligência artificial",
  },

  simulation: {
    pageTitle: "Nova simulação",
    documentTitle: "Nova simulação financeira | Grana Clara",
  },

  result: {
    pageTitle: "Resultado da simulação",
    documentTitle: "Resultado da simulação | Grana Clara",
  },

  chat: {
    pageTitle: "Conversa com o educador financeiro",
    documentTitle: "Conversa com o educador financeiro | Grana Clara",
  },

  history: {
    pageTitle: "Histórico de simulações",
    documentTitle: "Histórico de simulações | Grana Clara",
  },
} as const;

/**
 * Roteador principal do Grana Clara.
 *
 * As páginas essenciais da navegação inicial permanecem
 * disponíveis imediatamente.
 *
 * A página de chat é carregada de maneira assíncrona porque
 * possui dependências mais pesadas, como o renderizador de
 * Markdown utilizado nas respostas do Educador Financeiro.
 */
export const appRouter = createBrowserRouter([
  {
    path: "/",

    element: <AppLayout />,

    handle: routeHandles.application,

    children: [
      {
        index: true,

        element: <HomePage />,

        handle: routeHandles.home,
      },

      {
        path: "simulacao",

        element: <SimulationPage />,

        handle: routeHandles.simulation,
      },

      {
        path: "resultado/:simulationId",

        element: <ResultPage />,

        handle: routeHandles.result,
      },

      /**
       * Rota carregada sob demanda.
       *
       * O navegador somente solicita o código da ChatPage
       * quando a pessoa acessa /chat/:simulationId.
       *
       * O handle permanece disponível no roteador principal,
       * permitindo que o título e o anúncio da página sejam
       * definidos sem carregar antecipadamente o componente.
       */
      {
        path: "chat/:simulationId",

        handle: routeHandles.chat,

        lazy: async () => {
          const { ChatPage } = await import("../pages/ChatPage");

          return {
            Component: ChatPage,
          };
        },
      },

      {
        path: "historico",

        element: <HistoryPage />,

        handle: routeHandles.history,
      },
    ],
  },
]);
