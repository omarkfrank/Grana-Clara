import { type ReactNode, useEffect, useId, useRef } from "react";

import { Badge } from "../common/Badge";
import { Card } from "../common/Card";
import { ProgressBar } from "../common/ProgressBar";

type FormStepProps = {
  currentStep: number;
  totalSteps: number;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;

  /**
   * Define o nível semântico do título da etapa.
   *
   * Fluxos que representam o conteúdo principal da página
   * devem utilizar h1.
   */
  headingLevel?: "h1" | "h2";

  /**
   * Move o foco para o título também na montagem inicial.
   *
   * É útil quando um novo fluxo aparece sem alteração de rota,
   * como na transição do onboarding para a simulação.
   */
  focusOnMount?: boolean;
};

/**
 * Estrutura visual e semântica comum para uma etapa de formulário.
 *
 * Responsabilidades:
 * - Apresentar o progresso atual.
 * - Associar título e descrição ao conteúdo.
 * - Mover o foco para o novo título quando a etapa muda.
 * - Manter a navegação compreensível para leitores de tela.
 */
export function FormStep({
  currentStep,
  totalSteps,
  eyebrow,
  title,
  description,
  children,
  headingLevel = "h2",
  focusOnMount = false,
}: FormStepProps) {
  const generatedId = useId();

  const titleId = `${generatedId}-title`;
  const descriptionId = `${generatedId}-description`;

  const titleRef = useRef<HTMLHeadingElement>(null);
  const isInitialRender = useRef(true);

  const Heading = headingLevel;

  /**
   * Direciona o foco ao título sempre que a etapa muda.
   *
   * Na primeira renderização, o foco só é movido quando
   * focusOnMount estiver explicitamente habilitado.
   */
  useEffect(() => {
    const isFirstRender = isInitialRender.current;

    if (isFirstRender) {
      isInitialRender.current = false;

      if (!focusOnMount) {
        return;
      }
    }

    const frameId = window.requestAnimationFrame(() => {
      titleRef.current?.focus({
        preventScroll: false,
      });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [currentStep, focusOnMount]);

  return (
    <Card padding="lg" className="mx-auto max-w-2xl">
      <section
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="space-y-6"
      >
        <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />

        <header className="space-y-3">
          <Badge variant="neutral">{eyebrow}</Badge>

          <Heading
            ref={titleRef}
            id={titleId}
            tabIndex={-1}
            className="scroll-mt-24 text-2xl font-bold tracking-tight sm:text-3xl"
          >
            {title}
          </Heading>

          <p
            id={descriptionId}
            className="leading-7 text-[var(--color-text-muted)]"
          >
            {description}
          </p>
        </header>

        {children}
      </section>
    </Card>
  );
}
