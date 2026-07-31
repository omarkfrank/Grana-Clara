import { afterEach, describe, expect, it, vi } from "vitest";

import { AIInsightsApiError, requestFinancialInsights } from "./aiInsightsApi";

import type { SavedSimulation } from "../types/simulation";

/**
 * Simulação completa utilizada nos testes.
 *
 * Ela representa a mesma estrutura persistida no histórico
 * do Grana Clara.
 */
const simulation: SavedSimulation = {
  id: "teste-integracao-001",

  createdAt: "2026-07-30T18:30:00.000Z",

  promptVersion: "financial-educator-v1",

  input: {
    rendaMensalBruta: 4000,
    custosFixosEssenciais: 2100,
    dividasParceladasMensais: 500,
    meta: "Comprar um notebook",
    custoDaMeta: 10800,
    prazoDesejadoEmMeses: 12,
  },

  result: {
    valorDisponivelPorMes: 1400,
    economiaMensalNecessaria: 900,
    saldoAposReservaParaMeta: 500,
    status: "viable",
  },

  onboarding: {
    situacaoFinanceiraAtual: "balanced_no_surplus",

    fonteDeRenda: "employee",

    controleDosGastos: "rough_idea",

    objetivoPrincipal: "purchase_or_trip",

    prazoObjetivo: "six_to_twelve_months",

    nivelConhecimento: "beginner",

    tempoDisponivel: "less_than_five_minutes_daily",
  },
};

const validApiResponse = {
  insights: {
    titulo: "Sua meta está ao alcance",

    resumo: "A compra do notebook é viável.",

    diagnostico: "Existe capacidade mensal suficiente para alcançar a meta.",

    statusInterpretado: "A meta cabe no orçamento atual.",

    pontosDeAtencao: ["Acompanhe os gastos variáveis."],

    recomendacoes: ["Separe o valor da meta no início do mês."],

    proximosPassos: ["Crie uma reserva específica para o notebook."],

    mensagemFinal: "Com organização, sua meta pode ser alcançada.",
  },

  model: "gemini-3.6-flash",

  promptVersion: "financial-educator-v1",
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("requestFinancialInsights", () => {
  it("envia a simulação e retorna os insights validados", async () => {
    const fetchMock = vi.fn();

    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(validApiResponse), {
        status: 200,

        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    const response = await requestFinancialInsights(simulation);

    expect(response).toEqual(validApiResponse);

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [requestUrl, requestOptions] = fetchMock.mock.calls[0] as [
      string,
      RequestInit,
    ];

    expect(requestUrl).toBe("/api/ai/insights");

    expect(requestOptions.method).toBe("POST");

    const requestBody = JSON.parse(String(requestOptions.body));

    expect(requestBody).toEqual({
      simulationId: simulation.id,

      promptVersion: simulation.promptVersion,

      input: simulation.input,

      result: simulation.result,

      onboarding: simulation.onboarding,
    });
  });

  it("preserva a mensagem de erro enviada pelo backend", async () => {
    const fetchMock = vi.fn();

    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          error: "O educador financeiro está temporariamente ocupado.",
        }),
        {
          status: 503,

          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(requestFinancialInsights(simulation)).rejects.toMatchObject({
      name: "AIInsightsApiError",

      status: 503,

      message: "O educador financeiro está temporariamente ocupado.",
    });
  });

  it("rejeita uma resposta que não contém JSON válido", async () => {
    const fetchMock = vi.fn();

    fetchMock.mockResolvedValue(
      new Response("resposta inválida", {
        status: 502,
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(requestFinancialInsights(simulation)).rejects.toBeInstanceOf(
      AIInsightsApiError,
    );
  });

  it("rejeita uma resposta que não corresponde ao schema", async () => {
    const fetchMock = vi.fn();

    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          insights: {
            titulo: "Resposta incompleta",
          },

          model: "gemini-3.6-flash",

          promptVersion: "financial-educator-v1",
        }),
        {
          status: 200,

          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(requestFinancialInsights(simulation)).rejects.toMatchObject({
      name: "AIInsightsApiError",

      status: 200,

      message: "A API retornou uma análise em formato inesperado.",
    });
  });
});
