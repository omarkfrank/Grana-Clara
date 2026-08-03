/**
 * Propriedades disponíveis para a marca visual.
 */
type BrandMarkProps = {
  /**
   * Classes adicionais utilizadas para controlar tamanho,
   * animações e comportamento dentro do layout.
   */
  className?: string;
};

/**
 * Símbolo oficial do Grana Clara.
 *
 * A identidade combina:
 * - A letra G, representando a marca.
 * - Um movimento circular, associado a organização e equilíbrio.
 * - Uma seta crescente, associada a progresso financeiro.
 *
 * O SVG utiliza aria-hidden porque o nome acessível da marca
 * é fornecido pelo link ou elemento que o contém.
 */
export function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <rect width="64" height="64" rx="18" fill="#2563eb" />

      <path
        d="M43 23.5a15 15 0 1 0 1 17V32H34"
        fill="none"
        stroke="#ffffff"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="5"
      />

      <path
        d="m32 44 7-7 7-7m0 0h-7m7 0v7"
        fill="none"
        stroke="#86efac"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="4"
      />
    </svg>
  );
}
