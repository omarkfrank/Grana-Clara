import { useEffect, useRef, useState } from "react";

import { Alert } from "../components/common/Alert";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { ButtonLink } from "../components/common/ButtonLink";
import { Card } from "../components/common/Card";
import { viabilityStatusConfiguration } from "../constants/viabilityStatus";
import {
  clearSimulations,
  deleteSimulation,
  getAllSimulations,
} from "../services/simulationStorage";
import type { SavedSimulation } from "../types/simulation";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDateTime } from "../utils/formatDateTime";

/**
 * Página responsável por apresentar e administrar o histórico
 * de simulações armazenadas no navegador.
 *
 * A pessoa usuária pode:
 * - Consultar simulações anteriores.
 * - Abrir os detalhes de cada resultado.
 * - Excluir uma simulação específica.
 * - Excluir todo o histórico.
 * - Iniciar uma nova simulação.
 */
export function HistoryPage() {
  /**
   * O serviço já devolve as simulações ordenadas da mais recente
   * para a mais antiga.
   */
  const [simulations, setSimulations] = useState<SavedSimulation[]>(() =>
    getAllSimulations(),
  );

  /**
   * Mensagem apresentada quando alguma operação no armazenamento
   * local não pode ser concluída.
   */
  const [storageError, setStorageError] = useState<string | null>(null);

  /**
   * Permite que uma mesma mensagem de erro seja anunciada
   * novamente caso a falha se repita.
   */
  const [storageErrorKey, setStorageErrorKey] = useState(0);

  /**
   * Contêiner que recebe foco quando uma operação apresenta erro.
   */
  const storageErrorContainerRef = useRef<HTMLDivElement>(null);

  /**
   * Contêiner que recebe foco quando uma exclusão deixa
   * o histórico vazio.
   */
  const emptyStateContainerRef = useRef<HTMLDivElement>(null);

  /**
   * Impede que o estado vazio receba foco automaticamente
   * durante o primeiro carregamento da página.
   *
   * O foco ocorrerá somente depois de uma exclusão realizada
   * diretamente pela pessoa usuária.
   */
  const shouldFocusEmptyStateRef = useRef(false);

  /**
   * Move o foco para o alerta depois que um erro de armazenamento
   * é apresentado.
   */
  useEffect(() => {
    if (!storageError) {
      return;
    }

    storageErrorContainerRef.current?.focus({
      preventScroll: false,
    });
  }, [storageError, storageErrorKey]);

  /**
   * Move o foco para o estado vazio depois que a última simulação
   * ou todo o histórico é excluído.
   */
  useEffect(() => {
    if (simulations.length !== 0 || !shouldFocusEmptyStateRef.current) {
      return;
    }

    shouldFocusEmptyStateRef.current = false;

    emptyStateContainerRef.current?.focus({
      preventScroll: false,
    });
  }, [simulations.length]);

  /**
   * Apresenta uma mensagem de erro e prepara um novo anúncio
   * para tecnologias assistivas.
   */
  function showStorageError(message: string): void {
    setStorageError(message);

    setStorageErrorKey((currentKey) => currentKey + 1);
  }

  /**
   * Exclui uma única simulação após confirmação.
   */
  function handleDeleteSimulation(simulation: SavedSimulation): void {
    const shouldDelete = window.confirm(
      `Deseja excluir a simulação "${simulation.input.meta}"?`,
    );

    if (!shouldDelete) {
      return;
    }

    setStorageError(null);

    try {
      const wasDeleted = deleteSimulation(simulation.id);

      /**
       * O serviço retorna false quando o registro não é mais
       * encontrado no armazenamento.
       */
      if (!wasDeleted) {
        showStorageError(
          "A simulação não foi encontrada no histórico e não pôde ser excluída.",
        );

        return;
      }

      /**
       * Prepara o foco do estado vazio quando a simulação atual
       * é o último registro exibido.
       */
      if (simulations.length === 1) {
        shouldFocusEmptyStateRef.current = true;
      }

      setSimulations((currentSimulations) =>
        currentSimulations.filter(
          (currentSimulation) => currentSimulation.id !== simulation.id,
        ),
      );
    } catch (error) {
      console.error(error);

      showStorageError("Não foi possível excluir a simulação.");
    }
  }

  /**
   * Exclui todo o histórico após confirmação.
   */
  function handleClearHistory(): void {
    const shouldClear = window.confirm(
      "Deseja realmente excluir todas as simulações salvas?",
    );

    if (!shouldClear) {
      return;
    }

    setStorageError(null);

    try {
      clearSimulations();

      shouldFocusEmptyStateRef.current = true;

      setSimulations([]);
    } catch (error) {
      console.error(error);

      showStorageError("Não foi possível limpar o histórico.");
    }
  }

  return (
    <section className="space-y-6 py-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Histórico de simulações
          </h1>

          <p className="mt-2 text-[var(--color-text-muted)]">
            Consulte e compare suas metas financeiras analisadas anteriormente.
          </p>
        </div>

        <ButtonLink to="/simulacao" className="w-full sm:w-auto">
          Nova simulação
        </ButtonLink>
      </header>

      {/*
       * Informa de maneira discreta a quantidade atual de
       * simulações, inclusive depois das operações de exclusão.
       */}
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-label="Quantidade de simulações"
        className="sr-only"
      >
        {simulations.length === 1
          ? "1 simulação salva."
          : `${simulations.length} simulações salvas.`}
      </p>

      {storageError && (
        <div
          ref={storageErrorContainerRef}
          tabIndex={-1}
          className="scroll-mt-24 rounded-2xl outline-none"
        >
          <Alert
            key={storageErrorKey}
            title="Erro no histórico"
            variant="danger"
          >
            {storageError}
          </Alert>
        </div>
      )}

      {simulations.length === 0 ? (
        <Card padding="lg" className="text-center">
          <div
            ref={emptyStateContainerRef}
            tabIndex={-1}
            aria-label="Histórico vazio"
            className="scroll-mt-24 rounded-2xl outline-none"
          >
            <Alert title="Nenhuma simulação salva" variant="info">
              Quando você concluir sua primeira simulação, ela aparecerá aqui
              para consulta.
            </Alert>

            <div className="mt-6">
              <ButtonLink to="/simulacao">Criar primeira simulação</ButtonLink>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/*
           * A estrutura ul/li comunica semanticamente que o
           * histórico representa uma coleção de resultados.
           */}
          <ul aria-label="Simulações salvas" className="grid gap-4">
            {simulations.map((simulation) => {
              const status =
                viabilityStatusConfiguration[simulation.result.status];

              return (
                <li key={simulation.id}>
                  <Card padding="md">
                    <article className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <Badge variant={status.badgeVariant}>
                          {status.label}
                        </Badge>

                        <h2 className="mt-3 truncate text-xl font-bold">
                          {simulation.input.meta}
                        </h2>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--color-text-muted)]">
                          <span>
                            {formatCurrency(simulation.input.custoDaMeta)}
                          </span>

                          <span>
                            {simulation.input.prazoDesejadoEmMeses} meses
                          </span>

                          <span>{formatDateTime(simulation.createdAt)}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row">
                        <ButtonLink
                          to={`/resultado/${simulation.id}`}
                          variant="secondary"
                        >
                          Ver detalhes
                        </ButtonLink>

                        <Button
                          variant="danger"
                          aria-label={`Excluir simulação ${simulation.input.meta}`}
                          onClick={() => {
                            handleDeleteSimulation(simulation);
                          }}
                        >
                          Excluir
                        </Button>
                      </div>
                    </article>
                  </Card>
                </li>
              );
            })}
          </ul>

          <div className="flex justify-end">
            <Button variant="danger" onClick={handleClearHistory}>
              Excluir todo o histórico
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
