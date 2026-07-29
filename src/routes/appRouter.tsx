import { createBrowserRouter } from "react-router";

import { AppLayout } from "../layouts/AppLayout";
import { HistoryPage } from "../pages/HistoryPage";
import { HomePage } from "../pages/HomePage";
import { ResultPage } from "../pages/ResultPage";
import { SimulationPage } from "../pages/SimulationPage";

/**
 * Roteador principal do Grana Clara.
 *
 * Neste arquivo centralizamos as páginas disponíveis na aplicação.
 * Isso facilita a manutenção quando novas rotas forem adicionadas,
 * como chat com IA, login ou área de perfil do usuário.
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
      {
        path: "historico",
        element: <HistoryPage />,
      },
    ],
  },
]);
