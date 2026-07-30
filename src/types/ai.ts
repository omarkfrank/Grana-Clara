/**
 * Estrutura padronizada dos insights financeiros gerados pela IA.
 *
 * A resposta do Gemini deverá ser validada e convertida para este
 * formato antes de ser utilizada pela interface.
 */
export type AIInsights = {
  titulo: string;
  resumo: string;
  diagnostico: string;
  statusInterpretado: string;
  pontosDeAtencao: string[];
  recomendacoes: string[];
  proximosPassos: string[];
  mensagemFinal: string;
};
