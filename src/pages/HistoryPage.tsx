/**
 * Página de histórico.
 *
 * Em breve esta página exibirá as simulações salvas no navegador,
 * permitindo visualizar detalhes ou excluir registros antigos.
 */
export function HistoryPage() {
  return (
    <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <h2 className="text-2xl font-bold">Histórico de simulações</h2>

      <p className="mt-2 text-[var(--color-text-muted)]">
        Suas simulações salvas aparecerão aqui.
      </p>
    </section>
  );
}
