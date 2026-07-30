import { useState } from "react";
import { useNavigate, useParams } from "react-router";

import { Alert } from "../components/common/Alert";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { ButtonLink } from "../components/common/ButtonLink";
import { Card } from "../components/common/Card";
import { viabilityStatusConfiguration } from "../constants/viabilityStatus";
import {
  deleteSimulation,
  getSimulationById,
} from "../services/simulationStorage";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDateTime } from "../utils/formatDateTime";

/**
 * Página de resultado de uma simulação persistida.
 *
 * O identificador presente na URL é utilizado para recuperar
 * a simulação correspondente no armazenamento local.
 */
export function ResultPage() {
  const navigate = useNavigate();
  const { simulationId } = useParams();

  const [deleteError, setDeleteError] = useState<string | null>(null);

  const simulation = simulationId ? getSimulationById(simulationId) : null;

  function handleDeleteSimulation() {
    if (!simulation) {
      return;
    }

    const shouldDelete = window.confirm(
      `Deseja realmente excluir a simulação "${simulation.input.meta}"?`,
    );

    if (!shouldDelete) {
      return;
    }

    try {
      deleteSimulation(simulation.id);
      navigate("/historico");
    } catch (error) {
      console.error(error);

      setDeleteError("Não foi possível excluir a simulação neste momento.");
    }
  }

  if (!simulation) {
    return (
      <section className="py-4">
        <Card padding="lg" className="mx-auto max-w-2xl">
          <Badge variant="danger">Simulação não encontrada</Badge>

          <h2 className="mt-4 text-2xl font-bold tracking-tight">
            Não encontramos esse resultado.
          </h2>

          <p className="mt-3 leading-7 text-[var(--color-text-muted)]">
            A simulação pode ter sido excluída, o identificador pode estar
            incorreto ou os dados podem pertencer a outro navegador.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <ButtonLink to="/simulacao">Criar simulação</ButtonLink>

            <ButtonLink to="/historico" variant="secondary">
              Ver histórico
            </ButtonLink>
          </div>
        </Card>
      </section>
    );
  }

  const status = viabilityStatusConfiguration[simulation.result.status];

  return (
    <section className="py-4">
      <Card padding="lg" className="mx-auto max-w-2xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge variant={status.badgeVariant}>{status.label}</Badge>

            <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
              {simulation.input.meta}
            </h2>
          </div>

          <p className="text-sm text-[var(--color-text-muted)]">
            {formatDateTime(simulation.createdAt)}
          </p>
        </div>

        <p className="mt-4 leading-7 text-[var(--color-text-muted)]">
          {status.message}
        </p>

        {deleteError && (
          <Alert title="Erro ao excluir" variant="danger" className="mt-6">
            {deleteError}
          </Alert>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card variant="muted" padding="sm">
            <p className="text-sm text-[var(--color-text-muted)]">
              Renda mensal bruta
            </p>

            <strong className="mt-1 block text-xl">
              {formatCurrency(simulation.input.rendaMensalBruta)}
            </strong>
          </Card>

          <Card variant="muted" padding="sm">
            <p className="text-sm text-[var(--color-text-muted)]">
              Valor disponível por mês
            </p>

            <strong className="mt-1 block text-xl">
              {formatCurrency(simulation.result.valorDisponivelPorMes)}
            </strong>
          </Card>

          <Card variant="outline" padding="sm">
            <p className="text-sm text-[var(--color-text-muted)]">
              Economia mensal necessária
            </p>

            <strong className="mt-1 block text-xl">
              {formatCurrency(simulation.result.economiaMensalNecessaria)}
            </strong>
          </Card>

          <Card variant="outline" padding="sm">
            <p className="text-sm text-[var(--color-text-muted)]">
              Prazo desejado
            </p>

            <strong className="mt-1 block text-xl">
              {simulation.input.prazoDesejadoEmMeses} meses
            </strong>
          </Card>
        </div>

        <Alert
          title="Saldo após reservar para a meta"
          variant={
            simulation.result.saldoAposReservaParaMeta >= 0
              ? "success"
              : "warning"
          }
          className="mt-4"
        >
          {formatCurrency(simulation.result.saldoAposReservaParaMeta)}
        </Alert>

        <Card variant="outline" padding="sm" className="mt-4">
          <p className="text-sm text-[var(--color-text-muted)]">
            Custo total da meta
          </p>

          <strong className="mt-1 block text-lg">
            {formatCurrency(simulation.input.custoDaMeta)}
          </strong>
        </Card>

        <p className="mt-6 text-sm leading-6 text-[var(--color-text-muted)]">
          Este resultado possui finalidade educativa e utiliza exclusivamente os
          dados fornecidos na simulação.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ButtonLink to="/simulacao">Nova simulação</ButtonLink>

          <ButtonLink to="/historico" variant="secondary">
            Ver histórico
          </ButtonLink>

          <Button variant="danger" onClick={handleDeleteSimulation}>
            Excluir simulação
          </Button>
        </div>
      </Card>
    </section>
  );
}
