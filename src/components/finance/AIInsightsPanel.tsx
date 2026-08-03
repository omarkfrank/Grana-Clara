import { useCallback, useEffect, useId, useRef, useState } from "react";

import {
  AIInsightsApiError,
  requestFinancialInsights,
} from "../../services/aiInsightsApi";
import type { FinancialInsightsApiResponse } from "../../services/aiInsightsApi";
import {
  SimulationStorageError,
  updateSimulationAIInsights,
} from "../../services/simulationStorage";
import type { AIInsights } from "../../types/ai";
import type { SavedSimulation } from "../../types/simulation";
import { Alert } from "../common/Alert";
import { Button } from "../common/Button";
import { Card } from "../common/Card";
import { Skeleton } from "../common/Skeleton";

type AIInsightsPanelProps = {
  simulation: SavedSimulation;
};

/**
 * Estados possíveis da solicitação feita ao backend.
 *
 * O estado loading também representa o carregamento automático
 * inicial quando a simulação ainda não possui insights persistidos.
 */
type RequestStatus = "loading" | "success" | "error";

/**
 * Converte erros técnicos em mensagens compreensíveis.
 *
 * A simulação permanece válida mesmo quando a inteligência
 * artificial ou o armazenamento estão indisponíveis.
 */
function getFriendlyErrorMessage(error: unknown): string {
  if (error instanceof SimulationStorageError) {
    return "A análise foi gerada, mas não foi possível salvá-la no histórico. Tente novamente.";
  }

  if (error instanceof AIInsightsApiError) {
    if (error.status === 400) {
      return "Não foi possível analisar os dados desta simulação.";
    }

    if (error.status === 429 || error.status === 503) {
      return "O educador financeiro está temporariamente ocupado. Tente novamente em alguns instantes.";
    }

    if (error.status >= 500) {
      return "O serviço de análise está temporariamente indisponível.";
    }

    return error.message;
  }

  /**
   * O fetch normalmente lança TypeError em falhas de conexão,
   * indisponibilidade de rede ou bloqueio do servidor.
   */
  if (error instanceof TypeError) {
    return "Não foi possível conectar ao serviço de análise. Verifique sua conexão.";
  }

  return "Ocorreu um erro inesperado ao gerar a análise financeira.";
}

/**
 * Renderiza uma lista de orientações produzidas pela IA.
 */
function InsightsList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li
          key={`${index}-${item}`}
          className="flex gap-3 text-sm leading-6 text-[var(--color-text)]"
        >
          <span
            aria-hidden="true"
            className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--color-primary)]"
          />

          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Estado visual e acessível apresentado enquanto a análise
 * financeira está sendo processada.
 */
function AIInsightsLoading() {
  return (
    <Card>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-busy="true"
        aria-label="Gerando análise financeira personalizada"
        className="space-y-5"
      >
        <div>
          <Skeleton className="h-7 w-2/3" />

          <Skeleton className="mt-3 h-4 w-full" />

          <Skeleton className="mt-2 h-4 w-5/6" />
        </div>

        <div className="space-y-3">
          <Skeleton className="h-5 w-40" />

          <Skeleton className="h-4 w-full" />

          <Skeleton className="h-4 w-11/12" />

          <Skeleton className="h-4 w-4/5" />
        </div>

        <p className="text-sm text-[var(--color-text-muted)]">
          O educador financeiro está analisando sua simulação...
        </p>
      </div>
    </Card>
  );
}

/**
 * Exibe os insights personalizados e controla sua geração.
 *
 * Quando a simulação já possui insights persistidos, o componente
 * apenas os apresenta e não realiza uma nova chamada ao backend.
 *
 * Quando ainda não existem insights, a análise é solicitada
 * automaticamente e persistida depois da conclusão.
 */
export function AIInsightsPanel({ simulation }: AIInsightsPanelProps) {
  const insightsTitleId = useId();

  const errorContainerRef = useRef<HTMLDivElement>(null);

  const mountedRef = useRef(true);

  const [insights, setInsights] = useState<AIInsights | undefined>(
    () => simulation.aiInsights,
  );

  const [aiModel, setAIModel] = useState<string | undefined>(
    () => simulation.aiModel,
  );

  const [status, setStatus] = useState<RequestStatus>(() =>
    simulation.aiInsights ? "success" : "loading",
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Permite refocalizar e anunciar novamente uma falha mesmo
   * quando duas tentativas produzem a mesma mensagem.
   */
  const [errorAnnouncementKey, setErrorAnnouncementKey] = useState(0);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * Direciona o foco ao estado de erro depois que ele é
   * apresentado na interface.
   */
  useEffect(() => {
    if (status !== "error") {
      return;
    }

    errorContainerRef.current?.focus({
      preventScroll: false,
    });
  }, [status, errorAnnouncementKey]);

  /**
   * Solicita a análise e persiste a resposta na simulação
   * original.
   */
  const generateAndPersistInsights =
    useCallback(async (): Promise<FinancialInsightsApiResponse> => {
      const response = await requestFinancialInsights(simulation);

      updateSimulationAIInsights(simulation.id, response);

      return response;
    }, [simulation]);

  /**
   * Aplica uma resposta bem-sucedida aos estados da interface.
   */
  const applySuccessfulResponse = useCallback(
    (response: FinancialInsightsApiResponse) => {
      setInsights(response.insights);

      setAIModel(response.model);

      setErrorMessage(null);

      setStatus("success");
    },
    [],
  );

  /**
   * Aplica um erro à interface e prepara seu anúncio.
   */
  const applyError = useCallback((error: unknown) => {
    setErrorMessage(getFriendlyErrorMessage(error));

    setStatus("error");

    setErrorAnnouncementKey((currentKey) => currentKey + 1);
  }, []);

  /**
   * Executa automaticamente a análise quando a simulação ainda
   * não possui insights persistidos.
   */
  useEffect(() => {
    if (simulation.aiInsights) {
      return;
    }

    let isActive = true;

    void generateAndPersistInsights()
      .then((response) => {
        if (!isActive) {
          return;
        }

        applySuccessfulResponse(response);
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        applyError(error);
      });

    return () => {
      isActive = false;
    };
  }, [
    simulation.aiInsights,
    generateAndPersistInsights,
    applySuccessfulResponse,
    applyError,
  ]);

  /**
   * Realiza uma nova tentativa após uma falha.
   */
  const handleRetry = useCallback(async () => {
    setStatus("loading");

    setErrorMessage(null);

    try {
      const response = await generateAndPersistInsights();

      if (!mountedRef.current) {
        return;
      }

      applySuccessfulResponse(response);
    } catch (error) {
      if (!mountedRef.current) {
        return;
      }

      applyError(error);
    }
  }, [generateAndPersistInsights, applySuccessfulResponse, applyError]);

  if (status === "loading") {
    return <AIInsightsLoading />;
  }

  if (status === "error" || !insights) {
    return (
      <Card>
        <div
          ref={errorContainerRef}
          tabIndex={-1}
          className="scroll-mt-24 rounded-2xl outline-none"
        >
          <Alert
            key={errorAnnouncementKey}
            title="Análise personalizada indisponível"
            variant="danger"
          >
            <p>
              {errorMessage ?? "Não foi possível gerar a análise financeira."}
            </p>

            <p className="mt-2">
              Seus cálculos e sua simulação foram preservados normalmente.
            </p>
          </Alert>

          <div className="mt-4">
            <Button
              onClick={() => {
                void handleRetry();
              }}
            >
              Tentar novamente
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <article aria-labelledby={insightsTitleId} className="space-y-8">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-primary)]">
            Análise personalizada
          </p>

          <h2
            id={insightsTitleId}
            className="mt-2 text-2xl font-bold text-[var(--color-text)]"
          >
            {insights.titulo}
          </h2>

          <p className="mt-3 leading-7 text-[var(--color-text)]">
            {insights.resumo}
          </p>
        </header>

        <section>
          <h3 className="text-lg font-semibold text-[var(--color-text)]">
            Diagnóstico
          </h3>

          <p className="mt-3 leading-7 text-[var(--color-text)]">
            {insights.diagnostico}
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-[var(--color-text)]">
            O que significa seu resultado
          </h3>

          <p className="mt-3 leading-7 text-[var(--color-text)]">
            {insights.statusInterpretado}
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-[var(--color-text)]">
            Pontos de atenção
          </h3>

          <div className="mt-4">
            <InsightsList items={insights.pontosDeAtencao} />
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-[var(--color-text)]">
            Recomendações
          </h3>

          <div className="mt-4">
            <InsightsList items={insights.recomendacoes} />
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-[var(--color-text)]">
            Próximos passos
          </h3>

          <div className="mt-4">
            <InsightsList items={insights.proximosPassos} />
          </div>
        </section>

        <footer className="rounded-2xl bg-[var(--color-primary-soft)] p-5">
          <p className="font-medium leading-7 text-[var(--color-text)]">
            {insights.mensagemFinal}
          </p>

          {aiModel && (
            <p className="mt-3 text-xs text-[var(--color-text-muted)]">
              Análise gerada com {aiModel}.
            </p>
          )}
        </footer>
      </article>
    </Card>
  );
}
