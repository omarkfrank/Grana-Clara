const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeStyle: "short",
});

/**
 * Formata uma data ISO para o padrão brasileiro.
 *
 * Caso o valor recebido seja inválido, retornamos uma mensagem
 * segura em vez de exibir "Invalid Date" na interface.
 */
export function formatDateTime(isoDate: string): string {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return "Data indisponível";
  }

  return dateTimeFormatter.format(date);
}
