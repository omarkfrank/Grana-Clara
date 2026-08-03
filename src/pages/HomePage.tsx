import { Badge } from "../components/common/Badge";
import { ButtonLink } from "../components/common/ButtonLink";
import { Card } from "../components/common/Card";
import { formatCurrency } from "../utils/formatCurrency";

/**
 * Métricas fictícias utilizadas exclusivamente para demonstrar
 * como um diagnóstico financeiro será apresentado.
 *
 * Esses valores não representam dados reais da pessoa usuária.
 */
const exampleMetrics = [
  {
    label: "Valor disponível por mês",
    value: 1250,
  },
  {
    label: "Economia necessária",
    value: 900,
  },
] as const;

/**
 * Página inicial do Grana Clara.
 *
 * Apresenta:
 * - A proposta principal da aplicação.
 * - Os caminhos para iniciar ou consultar simulações.
 * - Um exemplo visual de diagnóstico financeiro.
 */
export function HomePage() {
  return (
    <section
      aria-labelledby="home-page-title"
      className="grid gap-8 py-8 md:grid-cols-[1.1fr_0.9fr] md:items-center"
    >
      <div className="space-y-6">
        <Badge variant="primary">Planejamento financeiro mobile-first</Badge>

        <header className="space-y-4">
          <h1
            id="home-page-title"
            className="text-4xl font-bold tracking-tight md:text-5xl"
          >
            Entenda sua grana com mais clareza.
          </h1>

          <p className="max-w-2xl text-lg leading-8 text-[var(--color-text-muted)]">
            Simule uma meta financeira, descubra se ela é viável e receba
            recomendações personalizadas com apoio de inteligência artificial.
          </p>
        </header>

        {/*
         * O elemento nav comunica que os links representam
         * os principais caminhos disponíveis nesta página.
         */}
        <nav
          aria-label="Ações principais"
          className="flex flex-col gap-3 sm:flex-row"
        >
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
        </nav>
      </div>

      {/*
       * O diagnóstico é um conteúdo complementar à apresentação
       * principal, por isso utiliza o elemento aside.
       */}
      <aside aria-labelledby="example-diagnosis-title">
        <Card padding="lg">
          <h2
            id="example-diagnosis-title"
            className="mb-4 text-sm font-semibold text-[var(--color-text-muted)]"
          >
            Exemplo de diagnóstico
          </h2>

          {/*
           * dl, dt e dd associam semanticamente cada indicador
           * financeiro ao seu respectivo valor.
           */}
          <dl className="space-y-4">
            {exampleMetrics.map((metric) => (
              <Card key={metric.label} variant="muted" padding="sm">
                <div>
                  <dt className="text-sm text-[var(--color-text-muted)]">
                    {metric.label}
                  </dt>

                  <dd className="mt-1 text-2xl font-bold">
                    {formatCurrency(metric.value)}
                  </dd>
                </div>
              </Card>
            ))}
          </dl>

          <Card variant="outline" padding="sm" className="mt-4">
            <Badge variant="success">Meta viável</Badge>

            <p className="mt-3 text-sm text-[var(--color-text-muted)]">
              Você ainda teria {formatCurrency(350)} de margem após reservar
              para sua meta.
            </p>
          </Card>
        </Card>
      </aside>
    </section>
  );
}
