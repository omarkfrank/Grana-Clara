/**
 * Chave utilizada para persistir as simulações no localStorage.
 *
 * O prefixo identifica claramente que o dado pertence ao
 * aplicativo Grana Clara.
 */
export const SIMULATION_STORAGE_KEY = "grana-clara:simulations";

/**
 * Versão da estrutura gravada no navegador.
 *
 * Essa versão representa o formato estrutural dos dados, não a
 * versão das instruções utilizadas pela inteligência artificial.
 *
 * Como a estrutura da simulação não foi alterada, ela permanece
 * na versão 1.
 */
export const SIMULATION_STORAGE_VERSION = 1;

/**
 * Versão atual do prompt financeiro.
 *
 * A versão 2 adiciona regras explícitas para:
 *
 * - Diferenciar valor disponível de saldo realmente livre.
 * - Evitar que o mesmo dinheiro seja utilizado duas vezes.
 * - Validar distribuições financeiras matematicamente.
 * - Tratar corretamente saldos negativos ou iguais a zero.
 * - Converter prazos fracionados em meses completos quando
 *   os depósitos são realizados mensalmente.
 *
 * Cada nova simulação registrará esta versão para garantir
 * rastreabilidade sobre as regras utilizadas pela IA.
 */
export const CURRENT_PROMPT_VERSION = "financial-educator-v2";
