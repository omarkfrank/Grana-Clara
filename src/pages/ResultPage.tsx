import { useParams } from "react-router";

import { Alert } from "../components/common/Alert";
import { Badge } from "../components/common/Badge";
import { ButtonLink } from "../components/common/ButtonLink";
import { Card } from "../components/common/Card";

/**
 * Página de resultado da simulação.
 *
 * O parâmetro "simulationId" permitirá recuperar uma simulação salva
 * e exibir novamente seus cálculos, status e insights da IA.
 */
export function ResultPage() {
  const { simulationId } = useParams();

  return (
    <section className="space-y-6">
      <Card padding="lg">
        <Badge variant="neutral">Resultado financeiro</Badge>

        <h2 className="mt-4 text-2xl font-bold">Resultado da simulação</h2>

        <Alert
          title="Identificador da simulação"
          variant="info"
          className="mt-6"
        >
          {simulationId ?? "Identificador não informado."}
        </Alert>

        <div className="mt-6">
          <ButtonLink to="/simulacao" variant="secondary">
            Voltar à simulação
          </ButtonLink>
        </div>
      </Card>
    </section>
  );
}
