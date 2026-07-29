import { Link } from "react-router";

import { Button } from "../components/common/Button";

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
        <span className="inline-flex rounded-full bg-[var(--color-surface-muted)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)]">
          Planejamento financeiro mobile-first
        </span>

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
          <Link to="/simulacao">
            <Button>Começar simulação</Button>
          </Link>

          <Link to="/historico">
            <Button variant="secondary">Ver histórico</Button>
          </Link>
        </div>
      </div>

      <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <p className="mb-4 text-sm font-semibold text-[var(--color-text-muted)]">
          Exemplo de diagnóstico
        </p>

        <div className="space-y-4">
          <div className="rounded-2xl bg-[var(--color-surface-muted)] p-4">
            <p className="text-sm text-[var(--color-text-muted)]">
              Valor disponível por mês
            </p>
            <strong className="text-2xl">R$ 1.250,00</strong>
          </div>

          <div className="rounded-2xl bg-[var(--color-surface-muted)] p-4">
            <p className="text-sm text-[var(--color-text-muted)]">
              Economia necessária
            </p>
            <strong className="text-2xl">R$ 900,00</strong>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] p-4">
            <p className="font-semibold text-[var(--color-primary)]">
              Meta viável
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Você ainda teria R$ 350,00 de margem após reservar para sua meta.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
