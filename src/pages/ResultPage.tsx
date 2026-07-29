import { useParams } from "react-router";

/**
 * Página de resultado da simulação.
 *
 * O parâmetro "simulationId" permitirá recuperar uma simulação salva
 * e exibir novamente seus cálculos, status e insights da IA.
 */
export function ResultPage() {
  const { simulationId } = useParams();

  return (
    <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <h2 className="text-2xl font-bold">Resultado da simulação</h2>

      <p className="mt-2 text-[var(--color-text-muted)]">
        ID da simulação: {simulationId}
      </p>
    </section>
  );
}
