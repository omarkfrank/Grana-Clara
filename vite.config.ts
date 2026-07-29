import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * Configuração principal do Vite.
 *
 * Aqui conectamos:
 * - React: para suporte ao ecossistema React.
 * - Tailwind CSS: para estilização utilitária moderna.
 *
 * O objetivo é manter o projeto rápido, simples e com boa experiência
 * tanto em desenvolvimento quanto no build de produção.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
