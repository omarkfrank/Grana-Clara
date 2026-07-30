/**
 * Chave utilizada para persistir as simulações no localStorage.
 *
 * O prefixo identifica claramente que o dado pertence ao Grana Clara.
 */
export const SIMULATION_STORAGE_KEY = "grana-clara:simulations";

/**
 * Versão da estrutura gravada no navegador.
 *
 * Caso o formato dos dados seja alterado futuramente, esta versão
 * poderá ser utilizada para implementar uma migração segura.
 */
export const SIMULATION_STORAGE_VERSION = 1;

/**
 * Versão atual do prompt financeiro.
 *
 * Mesmo antes da integração com IA, registramos a versão planejada
 * para que cada simulação mantenha rastreabilidade.
 */
export const CURRENT_PROMPT_VERSION = "financial-educator-v1";
