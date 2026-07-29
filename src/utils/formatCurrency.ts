/**
 * Formata valores numéricos para moeda brasileira.
 *
 * Centralizar essa regra evita inconsistências como:
 * - R$ 1000
 * - R$1000,00
 * - 1.000,00 reais
 *
 * Sempre que exibirmos dinheiro na interface, devemos usar esta função.
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
