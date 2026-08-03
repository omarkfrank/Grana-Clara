import { createBrowserRouter, type RouteObject } from "react-router";

import { AppLayout } from "../layouts/AppLayout";
import { HistoryPage } from "../pages/HistoryPage";
import { HomePage } from "../pages/HomePage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { ResultPage } from "../pages/ResultPage";
import { SimulationPage } from "../pages/SimulationPage";

/**
 * Metadados utilizados pelo AppLayout para:
 * - Atualizar o título da aba.
 * - Anunciar a página carregada.
 *
 * A exportação permite validar a configuração em testes sem
 * duplicar títulos ou informações das rotas.
 */
export const routeHandles = {
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

  notFound: {
    pageTitle: "Página não encontrada",
    documentTitle: "Página não encontrada | Grana Clara",
  },
} as const;

/**
 * Configuração declarativa das rotas.
 *
 * Manter essa estrutura exportada permite utilizar matchRoutes
 * nos testes sem montar toda a aplicação no navegador.
 */
export const appRoutes = [
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
       * O navegador somente solicita o código da ChatPage quando
       * a pessoa acessa uma conversa vinculada a uma simulação.
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

      /**
       * A rota coringa deve permanecer por último.
       *
       * Ela captura qualquer endereço que não corresponda às
       * páginas cadastradas anteriormente.
       */
      {
        path: "*",

        element: <NotFoundPage />,

        handle: routeHandles.notFound,
      },
    ],
  },
] satisfies RouteObject[];

/**
 * Roteador utilizado pela aplicação no navegador.
 */
export const appRouter = createBrowserRouter(appRoutes);
