import { useCallback, useEffect, useRef, useState } from "react";

import {
  AIInsightsApiError,
  requestFinancialInsights,
} from "../../services/aiInsightsApi";
import type { FinancialInsightsApiResponse } from "../../services/aiInsightsApi";
import { updateSimulationAIInsights } from "../../services/simulationStorage";
import type { AIInsights } from "../../types/ai";
import type { SavedSimulation } from "../../types/simulation";
import { Button } from "../common/Button";
import { Card } from "../common/Card";
import { Skeleton } from "../common/Skeleton";

/**
 * Propriedades recebidas pelo painel de insights.
 */
type AIInsightsPanelProps = {
  simulation: SavedSimulation;
};

/**
 * Estados possíveis da solicitação feita ao backend.
 *
 * O estado "loading" também representa o carregamento automático
 * inicial quando a simulação ainda não possui insights persistidos.
 */
type RequestStatus = "loading" | "success" | "error";

/**
 * Converte erros técnicos em mensagens mais claras para o usuário.
 *
 * A simulação financeira continua válida mesmo quando o serviço
 * de inteligência artificial está temporariamente indisponível.
 */
function getFriendlyErrorMessage(error: unknown): string {
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
   * O fetch normalmente lança TypeError quando ocorre falha
   * de conexão, indisponibilidade de rede ou bloqueio do servidor.
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
          className="flex gap-3 text-sm leading-6 text-slate-700 dark:text-slate-300"
        >
          <span
            aria-hidden="true"
            className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-500"
          />

          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Estado visual apresentado enquanto o backend e o Gemini
 * processam a análise financeira.
 */
function AIInsightsLoading() {
  return (
    <Card>
      <div aria-busy="true" aria-live="polite" className="space-y-5">
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

        <p className="text-sm text-slate-600 dark:text-slate-400">
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
 * apenas os apresenta e não realiza uma nova chamada ao Gemini.
 *
 * Quando ainda não possui insights, a análise é solicitada
 * automaticamente e salva no histórico após a conclusão.
 */
export function AIInsightsPanel({ simulation }: AIInsightsPanelProps) {
  /**
   * Insights inicialmente carregados da simulação persistida.
   *
   * Quando ainda não existem, o estado começa como undefined
   * e será atualizado após a resposta da API.
   */
  const [insights, setInsights] = useState<AIInsights | undefined>(
    () => simulation.aiInsights,
  );

  /**
   * Modelo inicialmente carregado do histórico.
   *
   * Em uma nova geração, simulation.aiModel ainda estará vazio.
   * Por isso mantemos um estado próprio e o atualizamos assim
   * que a API informa qual modelo foi utilizado.
   */
  const [aiModel, setAIModel] = useState<string | undefined>(
    () => simulation.aiModel,
  );

  /**
   * Quando ainda não existem insights, o componente já começa
   * no estado de carregamento.
   *
   * Assim, o efeito automático não precisa executar setState
   * imediatamente após a montagem.
   */
  const [status, setStatus] = useState<RequestStatus>(() =>
    simulation.aiInsights ? "success" : "loading",
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Informa se o componente permanece montado.
   *
   * Essa referência é acessada somente dentro de efeitos,
   * eventos e operações assíncronas, nunca durante a renderização.
   */
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * Solicita a análise e persiste a resposta na simulação original.
   *
   * Esta função não altera estados React. Ela apenas realiza a
   * comunicação com sistemas externos e retorna o resultado.
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

      setStatus("success");
    },
    [],
  );

  /**
   * Executa automaticamente a análise quando a simulação ainda
   * não possui insights persistidos.
   *
   * O efeito não altera estado de forma síncrona. As atualizações
   * ocorrem somente nos callbacks assíncronos da Promise.
   *
   * A variável isActive também impede que uma execução antiga
   * atualize a interface após a limpeza do efeito. Isso é útil
   * durante as verificações adicionais do React StrictMode.
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

        setErrorMessage(getFriendlyErrorMessage(error));

        setStatus("error");
      });

    return () => {
      isActive = false;
    };
  }, [
    simulation.aiInsights,
    generateAndPersistInsights,
    applySuccessfulResponse,
  ]);

  /**
   * Realiza uma nova tentativa após uma falha.
   *
   * Diferentemente da geração automática, esta função é chamada
   * por uma ação direta do usuário. Por isso pode alterar o estado
   * para loading antes de iniciar a nova requisição.
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

      setErrorMessage(getFriendlyErrorMessage(error));

      setStatus("error");
    }
  }, [generateAndPersistInsights, applySuccessfulResponse]);

  if (status === "loading") {
    return <AIInsightsLoading />;
  }

  if (status === "error" || !insights) {
    return (
      <Card>
        <div role="alert" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
              Análise personalizada indisponível
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              {errorMessage}
            </p>
          </div>

          <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
            Seus cálculos e sua simulação foram preservados normalmente.
          </p>

          <Button
            onClick={() => {
              void handleRetry();
            }}
          >
            Tentar novamente
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <article className="space-y-8">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
            Análise personalizada
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
            {insights.titulo}
          </h2>

          <p className="mt-3 leading-7 text-slate-700 dark:text-slate-300">
            {insights.resumo}
          </p>
        </header>

        <section>
          <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
            Diagnóstico
          </h3>

          <p className="mt-3 leading-7 text-slate-700 dark:text-slate-300">
            {insights.diagnostico}
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
            O que significa seu resultado
          </h3>

          <p className="mt-3 leading-7 text-slate-700 dark:text-slate-300">
            {insights.statusInterpretado}
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
            Pontos de atenção
          </h3>

          <div className="mt-4">
            <InsightsList items={insights.pontosDeAtencao} />
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
            Recomendações
          </h3>

          <div className="mt-4">
            <InsightsList items={insights.recomendacoes} />
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
            Próximos passos
          </h3>

          <div className="mt-4">
            <InsightsList items={insights.proximosPassos} />
          </div>
        </section>

        <footer className="rounded-2xl bg-emerald-50 p-5 dark:bg-emerald-950/30">
          <p className="font-medium leading-7 text-emerald-950 dark:text-emerald-100">
            {insights.mensagemFinal}
          </p>

          {aiModel && (
            <p className="mt-3 text-xs text-emerald-800/70 dark:text-emerald-300/70">
              Análise gerada com {aiModel}.
            </p>
          )}
        </footer>
      </article>
    </Card>
  );
}
