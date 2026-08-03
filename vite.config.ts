import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

/**
 * Endereço padrão da API interna durante o desenvolvimento.
 *
 * O valor poderá ser sobrescrito pela variável:
 *
 * API_PROXY_TARGET=http://127.0.0.1:8787
 *
 * Como essa variável não utiliza o prefixo VITE_, ela permanece
 * disponível somente no ambiente de configuração e não é
 * incorporada ao código entregue ao navegador.
 */
const defaultApiTarget = "http://127.0.0.1:8787";

/**
 * Cria a configuração compartilhada do proxy da API.
 *
 * Tanto o servidor de desenvolvimento quanto o preview do build
 * encaminham requisições iniciadas em /api para o backend local.
 */
function createApiProxy(apiTarget: string) {
  return {
    "/api": {
      target: apiTarget,
      changeOrigin: true,
    },
  };
}

/**
 * Configuração compartilhada entre:
 *
 * - Vite, responsável pelo desenvolvimento e pelo build.
 * - Vitest, responsável pelos testes automatizados.
 */
export default defineConfig(({ mode }) => {
  /**
   * O prefixo vazio permite que a configuração do Vite leia
   * API_PROXY_TARGET sem expor essa variável ao frontend.
   */
  const environment = loadEnv(mode, process.cwd(), "");

  const configuredApiTarget = environment.API_PROXY_TARGET?.trim();

  const apiTarget = configuredApiTarget || defaultApiTarget;

  const apiProxy = createApiProxy(apiTarget);

  return {
    plugins: [react(), tailwindcss()],

    /**
     * Proxy utilizado por npm run dev.
     */
    server: {
      proxy: apiProxy,
    },

    /**
     * Proxy utilizado por npm run preview e preview:full.
     *
     * Isso permite validar o bundle de produção localmente sem
     * alterar os caminhos /api usados pelo frontend.
     */
    preview: {
      proxy: apiProxy,
    },

    test: {
      /**
       * Simula as APIs fundamentais de um navegador.
       *
       * O ambiente é necessário para renderizar componentes
       * React, consultar o DOM e validar acessibilidade.
       */
      environment: "jsdom",

      /**
       * Arquivo executado antes de cada suíte.
       *
       * Registra os matchers do jest-dom e garante a limpeza
       * da interface entre os testes.
       */
      setupFiles: ["./src/test/setup.ts"],

      /**
       * Evita que mocks de uma suíte interfiram nas seguintes.
       */
      clearMocks: true,
      restoreMocks: true,
    },
  };
});
