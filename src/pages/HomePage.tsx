import { Badge } from "../components/common/Badge";
import { ButtonLink } from "../components/common/ButtonLink";
import { Card } from "../components/common/Card";
import { formatCurrency } from "../utils/formatCurrency";

const exampleMetrics = [
  {
    label: "Valor disponível por mês",
    value: 1250,
  },
  {
    label: "Economia necessária",
    value: 900,
  },
];

/**
 * Página inicial do Grana Clara.
 *
 * Esta página apresenta o valor principal da aplicação:
 * ajudar o usuário a transformar dados financeiros em clareza,
 * diagnóstico e próximos passos com apoio de IA.
 */
export function HomePage() {
  return (
    <section className="grid gap-8 py-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
      <div className="space-y-6">
        <Badge variant="primary">Planejamento financeiro mobile-first</Badge>

        <div className="space-y-4">
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
            Entenda sua grana com mais clareza.
          </h2>

          <p className="max-w-2xl text-lg leading-8 text-[var(--color-text-muted)]">
            Simule uma meta financeira, descubra se ela é viável e receba
            recomendações personalizadas com apoio de inteligência artificial.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink to="/simulacao" className="w-full sm:w-auto">
            Começar simulação
          </ButtonLink>

          <ButtonLink
            to="/historico"
            variant="secondary"
            className="w-full sm:w-auto"
          >
            Ver histórico
          </ButtonLink>
        </div>
      </div>

      <Card padding="lg">
        <p className="mb-4 text-sm font-semibold text-[var(--color-text-muted)]">
          Exemplo de diagnóstico
        </p>

        <div className="space-y-4">
          {exampleMetrics.map((metric) => (
            <Card key={metric.label} variant="muted" padding="sm">
              <p className="text-sm text-[var(--color-text-muted)]">
                {metric.label}
              </p>

              <strong className="mt-1 block text-2xl">
                {formatCurrency(metric.value)}
              </strong>
            </Card>
          ))}

          <Card variant="outline" padding="sm">
            <Badge variant="success">Meta viável</Badge>

            <p className="mt-3 text-sm text-[var(--color-text-muted)]">
              Você ainda teria {formatCurrency(350)} de margem após reservar
              para sua meta.
            </p>
          </Card>
        </div>
      </Card>
    </section>
  );
}
