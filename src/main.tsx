import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router/dom";

import { appRouter } from "./routes/appRouter";
import "./styles/globals.css";

/**
 * Ponto de entrada da aplicação.
 *
 * Responsabilidades:
 * - Carregar os estilos globais.
 * - Inicializar o React.
 * - Conectar o roteador principal da aplicação.
 *
 * Mantemos este arquivo pequeno para facilitar manutenção
 * e separar responsabilidades desde o início do projeto.
 */
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={appRouter} />
  </StrictMode>,
);
