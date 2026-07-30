import { useState } from "react";

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
 * Página de histórico das simulações persistidas.
 *
 * Permite:
 * - Consultar resultados anteriores.
 * - Abrir os detalhes pelo ID.
 * - Excluir um registro.
 * - Limpar todo o histórico.
 */
export function HistoryPage() {
  const [simulations, setSimulations] =
    useState<SavedSimulation[]>(getAllSimulations);

  const [storageError, setStorageError] = useState<string | null>(null);

  function handleDeleteSimulation(simulation: SavedSimulation) {
    const shouldDelete = window.confirm(
      `Deseja excluir a simulação "${simulation.input.meta}"?`,
    );

    if (!shouldDelete) {
      return;
    }

    try {
      deleteSimulation(simulation.id);

      setSimulations((currentSimulations) =>
        currentSimulations.filter(
          (currentSimulation) => currentSimulation.id !== simulation.id,
        ),
      );

      setStorageError(null);
    } catch (error) {
      console.error(error);

      setStorageError("Não foi possível excluir a simulação.");
    }
  }

  function handleClearHistory() {
    const shouldClear = window.confirm(
      "Deseja realmente excluir todas as simulações salvas?",
    );

    if (!shouldClear) {
      return;
    }

    try {
      clearSimulations();
      setSimulations([]);
      setStorageError(null);
    } catch (error) {
      console.error(error);

      setStorageError("Não foi possível limpar o histórico.");
    }
  }

  return (
    <section className="space-y-6 py-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Histórico de simulações
          </h2>

          <p className="mt-2 text-[var(--color-text-muted)]">
            Consulte e compare suas metas financeiras analisadas anteriormente.
          </p>
        </div>

        <ButtonLink to="/simulacao" className="w-full sm:w-auto">
          Nova simulação
        </ButtonLink>
      </div>

      {storageError && (
        <Alert title="Erro no histórico" variant="danger">
          {storageError}
        </Alert>
      )}

      {simulations.length === 0 ? (
        <Card padding="lg" className="text-center">
          <Alert title="Nenhuma simulação salva" variant="info">
            Quando você concluir sua primeira simulação, ela aparecerá aqui para
            consulta.
          </Alert>

          <div className="mt-6">
            <ButtonLink to="/simulacao">Criar primeira simulação</ButtonLink>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {simulations.map((simulation) => {
              const status =
                viabilityStatusConfiguration[simulation.result.status];

              return (
                <Card key={simulation.id} padding="md">
                  <article className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <Badge variant={status.badgeVariant}>
                        {status.label}
                      </Badge>

                      <h3 className="mt-3 truncate text-xl font-bold">
                        {simulation.input.meta}
                      </h3>

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
                        onClick={() => handleDeleteSimulation(simulation)}
                        aria-label={`Excluir simulação ${simulation.input.meta}`}
                      >
                        Excluir
                      </Button>
                    </div>
                  </article>
                </Card>
              );
            })}
          </div>

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
