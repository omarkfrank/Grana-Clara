import { useState } from "react";
import { useNavigate, useParams } from "react-router";

import { Alert } from "../components/common/Alert";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { ButtonLink } from "../components/common/ButtonLink";
import { Card } from "../components/common/Card";
import { AIInsightsPanel } from "../components/finance/AIInsightsPanel";
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
 *
 * Além dos cálculos financeiros, a página apresenta:
 * - O diagnóstico gerado pela inteligência artificial.
 * - Ações relacionadas à simulação.
 * - Um acesso direto ao chat contextualizado.
 */
export function ResultPage() {
  const navigate = useNavigate();

  const { simulationId } = useParams();

  const [deleteError, setDeleteError] = useState<string | null>(null);

  /**
   * Recupera a simulação utilizando o identificador da rota.
   *
   * Caso o ID não exista ou a simulação tenha sido excluída,
   * a página apresenta um estado de conteúdo não encontrado.
   */
  const simulation = simulationId ? getSimulationById(simulationId) : null;

  /**
   * Exclui a simulação atual após confirmação explícita.
   */
  function handleDeleteSimulation(): void {
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

  /**
   * Estado apresentado quando a simulação não pode ser recuperada.
   */
  if (!simulation) {
    return (
      <section className="py-4">
        <Card padding="lg" className="mx-auto max-w-2xl">
          <Badge variant="danger">Simulação não encontrada</Badge>

          <h1 className="mt-4 text-2xl font-bold tracking-tight">
            Não encontramos esse resultado.
          </h1>

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

  /**
   * Recupera a configuração visual e textual do status calculado.
   */
  const status = viabilityStatusConfiguration[simulation.result.status];

  return (
    <section className="py-4">
      <div className="mx-auto max-w-2xl space-y-6">
        <Card padding="lg">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Badge variant={status.badgeVariant}>{status.label}</Badge>

              <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
                {simulation.input.meta}
              </h1>
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
            Este resultado possui finalidade educativa e utiliza exclusivamente
            os dados fornecidos na simulação.
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

        {/*
         * Painel responsável pela geração, apresentação e
         * persistência dos insights financeiros personalizados.
         */}
        <AIInsightsPanel key={simulation.id} simulation={simulation} />

        {/*
         * Chamada para ação do chat.
         *
         * A conversa utiliza o mesmo identificador da simulação,
         * permitindo que o backend receba todo o contexto
         * financeiro já calculado e persistido.
         */}
        <Card variant="outline" padding="lg">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge variant="success">Chat contextualizado</Badge>

              <h2 className="mt-3 text-xl font-bold tracking-tight">
                Ainda ficou com alguma dúvida?
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--color-text-muted)]">
                Converse com o Educador Financeiro sobre seu orçamento, sua
                meta, o prazo planejado ou os próximos passos sugeridos.
              </p>
            </div>

            <ButtonLink to={`/chat/${simulation.id}`} className="shrink-0">
              Conversar com o Educador
            </ButtonLink>
          </div>
        </Card>

        <p className="text-center text-xs leading-5 text-[var(--color-text-muted)]">
          As orientações apresentadas possuem finalidade educativa e não
          substituem avaliação financeira, contábil, jurídica ou profissional
          personalizada.
        </p>
      </div>
    </section>
  );
}
