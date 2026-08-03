import { Badge } from "../components/common/Badge";
import { ButtonLink } from "../components/common/ButtonLink";
import { Card } from "../components/common/Card";

/**
 * Página apresentada quando nenhuma rota cadastrada corresponde
 * ao endereço acessado.
 */
export function NotFoundPage() {
  return (
    <section aria-labelledby="not-found-page-title" className="py-8">
      <Card padding="lg" className="mx-auto max-w-2xl">
        <Badge variant="danger">Página não encontrada</Badge>

        <h1
          id="not-found-page-title"
          className="mt-4 text-3xl font-bold tracking-tight"
        >
          Este endereço não existe.
        </h1>

        <p className="mt-3 leading-7 text-[var(--color-text-muted)]">
          O endereço pode estar incorreto ou a página pode ter sido removida.
          Utilize um dos caminhos abaixo para continuar no Grana Clara.
        </p>

        <nav
          aria-label="Opções para continuar"
          className="mt-6 flex flex-col gap-3 sm:flex-row"
        >
          <ButtonLink to="/">Voltar ao início</ButtonLink>

          <ButtonLink to="/simulacao" variant="secondary">
            Criar simulação
          </ButtonLink>
        </nav>
      </Card>
    </section>
  );
}
