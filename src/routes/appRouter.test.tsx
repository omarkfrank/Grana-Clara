import { matchRoutes } from "react-router";
import { describe, expect, it } from "vitest";

import { appRoutes, routeHandles } from "./appRouter";

/**
 * Recupera todas as correspondências de uma URL.
 *
 * O teste falha imediatamente quando nenhuma rota é encontrada.
 */
function getRouteMatches(pathname: string) {
  const matches = matchRoutes(appRoutes, pathname);

  if (!matches) {
    throw new Error(`Nenhuma rota encontrada para "${pathname}".`);
  }

  return matches;
}

/**
 * Recupera a rota mais específica correspondente ao endereço.
 */
function getLeafRouteMatch(pathname: string) {
  const matches = getRouteMatches(pathname);

  return matches[matches.length - 1];
}

describe("appRouter", () => {
  it("associa cada página aos metadados corretos", () => {
    const routeScenarios = [
      {
        pathname: "/",
        expectedHandle: routeHandles.home,
      },
      {
        pathname: "/simulacao",
        expectedHandle: routeHandles.simulation,
      },
      {
        pathname: "/resultado/simulation-123",
        expectedHandle: routeHandles.result,
      },
      {
        pathname: "/chat/simulation-123",
        expectedHandle: routeHandles.chat,
      },
      {
        pathname: "/historico",
        expectedHandle: routeHandles.history,
      },
    ];

    routeScenarios.forEach(({ pathname, expectedHandle }) => {
      const leafMatch = getLeafRouteMatch(pathname);

      expect(leafMatch.route.handle).toEqual(expectedHandle);
    });
  });

  it("mantém o AppLayout como estrutura principal", () => {
    const matches = getRouteMatches("/historico");

    expect(matches[0].route.handle).toEqual(routeHandles.application);

    expect(matches).toHaveLength(2);
  });

  it("recupera o identificador das rotas de resultado e chat", () => {
    const resultMatch = getLeafRouteMatch("/resultado/result-id");

    const chatMatch = getLeafRouteMatch("/chat/chat-id");

    expect(resultMatch.params.simulationId).toBe("result-id");

    expect(chatMatch.params.simulationId).toBe("chat-id");
  });

  it("mantém a ChatPage configurada para carregamento assíncrono", () => {
    const rootRoute = appRoutes[0];

    const chatRoute = rootRoute.children?.find(
      (route) => route.path === "chat/:simulationId",
    );

    expect(chatRoute).toBeDefined();

    expect(chatRoute?.lazy).toEqual(expect.any(Function));

    expect(chatRoute?.element).toBeUndefined();
  });

  it("direciona endereços desconhecidos para a página 404", () => {
    const leafMatch = getLeafRouteMatch("/endereco-que-nao-existe");

    expect(leafMatch.route.path).toBe("*");

    expect(leafMatch.route.handle).toEqual(routeHandles.notFound);
  });
});
