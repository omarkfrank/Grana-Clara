import { createBrowserRouter } from "react-router";

import { AppLayout } from "../layouts/AppLayout";
import { HistoryPage } from "../pages/HistoryPage";
import { HomePage } from "../pages/HomePage";
import { ResultPage } from "../pages/ResultPage";
import { SimulationPage } from "../pages/SimulationPage";

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

    children: [
      {
        index: true,

        element: <HomePage />,
      },

      {
        path: "simulacao",

        element: <SimulationPage />,
      },

      {
        path: "resultado/:simulationId",

        element: <ResultPage />,
      },

      /**
       * Rota carregada sob demanda.
       *
       * O navegador somente solicita o código da ChatPage
       * quando a pessoa acessa /chat/:simulationId.
       *
       * O caminho da rota continua disponível desde o início,
       * permitindo que o React Router realize a correspondência
       * normalmente sem incluir toda a implementação do chat
       * no bundle JavaScript inicial.
       */
      {
        path: "chat/:simulationId",

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
      },
    ],
  },
]);
