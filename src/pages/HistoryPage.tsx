import { Alert } from "../components/common/Alert";
import { ButtonLink } from "../components/common/ButtonLink";
import { Card } from "../components/common/Card";

/**
 * Página de histórico.
 *
 * Em breve esta página exibirá as simulações salvas no navegador,
 * permitindo visualizar detalhes ou excluir registros antigos.
 */
export function HistoryPage() {
  return (
    <section className="space-y-6">
      <Card padding="lg">
        <h2 className="text-2xl font-bold">Histórico de simulações</h2>

        <p className="mt-2 text-[var(--color-text-muted)]">
          Consulte as metas financeiras analisadas anteriormente.
        </p>

        <Alert title="Nenhuma simulação salva" variant="info" className="mt-6">
          Quando você concluir sua primeira simulação, ela aparecerá aqui para
          consulta.
        </Alert>

        <div className="mt-6">
          <ButtonLink to="/simulacao">Criar primeira simulação</ButtonLink>
        </div>
      </Card>
    </section>
  );
}
