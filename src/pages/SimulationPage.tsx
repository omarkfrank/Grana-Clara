import { Alert } from "../components/common/Alert";
import { Card } from "../components/common/Card";

/**
 * Página de simulação financeira.
 *
 * Em breve esta página receberá:
 * - Formulário em etapas.
 * - Barra de progresso.
 * - Validação dos campos obrigatórios.
 * - Cálculos financeiros iniciais.
 */
export function SimulationPage() {
  return (
    <section className="space-y-6">
      <Card padding="lg">
        <h2 className="text-2xl font-bold">Simulação financeira</h2>

        <p className="mt-2 text-[var(--color-text-muted)]">
          Nesta etapa vamos construir o formulário mobile-first do Grana Clara.
        </p>

        <Alert title="Próxima implementação" variant="info" className="mt-6">
          O formulário será dividido em etapas curtas, com validação dos dados e
          revisão antes da geração da simulação.
        </Alert>
      </Card>
    </section>
  );
}
