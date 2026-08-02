import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Endereço da API interna utilizada durante o desenvolvimento.
 *
 * As requisições iniciadas pelo frontend em /api são encaminhadas
 * pelo servidor Vite para o backend local.
 */
const apiTarget = "http://127.0.0.1:8787";

/**
 * Configuração compartilhada entre:
 * - Vite, responsável pelo desenvolvimento e build.
 * - Vitest, responsável pelos testes automatizados.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    proxy: {
      "/api": {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },

  test: {
    /**
     * Simula as APIs fundamentais de um navegador.
     *
     * O ambiente é necessário para renderizar componentes React,
     * consultar elementos do DOM e validar atributos acessíveis.
     */
    environment: "jsdom",

    /**
     * Arquivo executado antes de cada suíte de testes.
     *
     * Ele registra os matchers adicionais do jest-dom e garante
     * a limpeza da interface entre os casos.
     */
    setupFiles: ["./src/test/setup.ts"],

    /**
     * Evita que mocks de uma suíte interfiram nas seguintes.
     */
    clearMocks: true,
    restoreMocks: true,
  },
});
