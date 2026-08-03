import { useEffect, useRef, useState } from "react";
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
 * Página responsável por apresentar o resultado de uma
 * simulação financeira persistida no navegador.
 *
 * O identificador recebido pela URL é utilizado para recuperar:
 * - Os dados financeiros informados.
 * - O resultado calculado.
 * - As respostas do onboarding.
 * - Os insights gerados pela inteligência artificial.
 *
 * A página também permite:
 * - Criar uma nova simulação.
 * - Acessar o histórico.
 * - Excluir a simulação atual.
 * - Abrir o chat contextualizado.
 */
export function ResultPage() {
  const navigate = useNavigate();

  const { simulationId } = useParams();

  /**
   * Mensagem apresentada quando ocorre uma falha durante
   * a exclusão da simulação.
   */
  const [deleteError, setDeleteError] = useState<string | null>(null);

  /**
   * Chave incremental utilizada para recriar o alerta e permitir
   * que erros repetidos sejam anunciados novamente pelas
   * tecnologias assistivas.
   */
  const [deleteErrorKey, setDeleteErrorKey] = useState(0);

  /**
   * Referência do contêiner de erro.
   *
   * Depois que o alerta aparece, esse elemento recebe foco para
   * que a falha seja percebida também por usuários que navegam
   * apenas pelo teclado ou por leitor de tela.
   */
  const deleteErrorContainerRef = useRef<HTMLDivElement>(null);

  /**
   * Recupera a simulação correspondente ao identificador da rota.
   *
   * Quando o identificador não existe ou os dados já foram
   * excluídos, o serviço retorna null.
   */
  const simulation = simulationId ? getSimulationById(simulationId) : null;

  /**
   * Move o foco para o alerta quando uma falha de exclusão
   * é apresentada.
   */
  useEffect(() => {
    if (!deleteError) {
      return;
    }

    deleteErrorContainerRef.current?.focus({
      preventScroll: false,
    });
  }, [deleteError, deleteErrorKey]);

  /**
   * Apresenta uma mensagem de erro e atualiza a chave responsável
   * pelo novo anúncio acessível.
   */
  function showDeleteError(message: string): void {
    setDeleteError(message);

    setDeleteErrorKey((currentKey) => currentKey + 1);
  }

  /**
   * Solicita confirmação e exclui a simulação atual.
   *
   * A navegação para o histórico ocorre somente quando o serviço
   * confirma que o registro foi realmente removido.
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

    /**
     * Remove uma mensagem anterior antes de iniciar uma nova
     * tentativa de exclusão.
     */
    setDeleteError(null);

    try {
      const wasDeleted = deleteSimulation(simulation.id);

      /**
       * O serviço retorna false quando o registro não foi
       * encontrado no histórico.
       */
      if (!wasDeleted) {
        showDeleteError(
          "A simulação não foi encontrada no histórico e não pôde ser excluída.",
        );

        return;
      }

      navigate("/historico");
    } catch (error) {
      /**
       * O erro técnico permanece disponível para diagnóstico no
       * console, enquanto a interface apresenta uma mensagem clara.
       */
      console.error(error);

      showDeleteError("Não foi possível excluir a simulação neste momento.");
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
   * Recupera os textos e a apresentação visual correspondentes
   * ao status calculado para a simulação.
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
            <div
              ref={deleteErrorContainerRef}
              tabIndex={-1}
              className="mt-6 scroll-mt-24 rounded-2xl outline-none"
            >
              <Alert
                key={deleteErrorKey}
                title="Erro ao excluir"
                variant="danger"
              >
                {deleteError}
              </Alert>
            </div>
          )}

          {/*
           * Os principais indicadores financeiros são apresentados
           * em uma região nomeada para facilitar a navegação por
           * tecnologias assistivas.
           */}
          <section
            aria-label="Resumo financeiro da simulação"
            className="mt-6 grid gap-4 sm:grid-cols-2"
          >
            <Card variant="muted" padding="sm">
              <dl>
                <dt className="text-sm text-[var(--color-text-muted)]">
                  Renda mensal bruta
                </dt>

                <dd className="mt-1 text-xl font-bold">
                  {formatCurrency(simulation.input.rendaMensalBruta)}
                </dd>
              </dl>
            </Card>

            <Card variant="muted" padding="sm">
              <dl>
                <dt className="text-sm text-[var(--color-text-muted)]">
                  Valor disponível por mês
                </dt>

                <dd className="mt-1 text-xl font-bold">
                  {formatCurrency(simulation.result.valorDisponivelPorMes)}
                </dd>
              </dl>
            </Card>

            <Card variant="outline" padding="sm">
              <dl>
                <dt className="text-sm text-[var(--color-text-muted)]">
                  Economia mensal necessária
                </dt>

                <dd className="mt-1 text-xl font-bold">
                  {formatCurrency(simulation.result.economiaMensalNecessaria)}
                </dd>
              </dl>
            </Card>

            <Card variant="outline" padding="sm">
              <dl>
                <dt className="text-sm text-[var(--color-text-muted)]">
                  Prazo desejado
                </dt>

                <dd className="mt-1 text-xl font-bold">
                  {simulation.input.prazoDesejadoEmMeses} meses
                </dd>
              </dl>
            </Card>
          </section>

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
            <dl>
              <dt className="text-sm text-[var(--color-text-muted)]">
                Custo total da meta
              </dt>

              <dd className="mt-1 text-lg font-bold">
                {formatCurrency(simulation.input.custoDaMeta)}
              </dd>
            </dl>
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
         * Painel responsável por gerar, apresentar e persistir
         * os insights financeiros personalizados.
         */}
        <AIInsightsPanel key={simulation.id} simulation={simulation} />

        {/*
         * Chamada para o chat contextualizado.
         *
         * O identificador da simulação permite que o chat utilize
         * os mesmos dados financeiros e o mesmo diagnóstico.
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
