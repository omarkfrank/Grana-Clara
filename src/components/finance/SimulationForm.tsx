import { useState } from "react";

import type { SimulationInput } from "../../types/finance";
import { formatCurrency } from "../../utils/formatCurrency";
import { Card } from "../common/Card";
import { FormStep } from "../form/FormStep";
import { CurrencyInput } from "../form/CurrencyInput";
import { NumberInput } from "../form/NumberInput";
import { StepNavigation } from "../form/StepNavigation";
import { TextInput } from "../form/TextInput";

type SimulationFormProps = {
  onComplete: (input: SimulationInput) => void;
};

type SimulationFormValues = {
  rendaMensalBruta: number | null;
  custosFixosEssenciais: number | null;
  dividasParceladasMensais: number | null;
  meta: string;
  custoDaMeta: number | null;
  prazoDesejadoEmMeses: number | null;
};

type SimulationFormErrors = Partial<Record<keyof SimulationFormValues, string>>;

const initialValues: SimulationFormValues = {
  rendaMensalBruta: null,
  custosFixosEssenciais: null,
  dividasParceladasMensais: null,
  meta: "",
  custoDaMeta: null,
  prazoDesejadoEmMeses: null,
};

const totalSteps = 3;

/**
 * Valida os campos da etapa financeira mensal.
 */
function validateMonthlyFinances(
  values: SimulationFormValues,
): SimulationFormErrors {
  const errors: SimulationFormErrors = {};

  if (values.rendaMensalBruta === null || values.rendaMensalBruta <= 0) {
    errors.rendaMensalBruta = "Informe uma renda mensal maior que zero.";
  }

  if (
    values.custosFixosEssenciais === null ||
    values.custosFixosEssenciais < 0
  ) {
    errors.custosFixosEssenciais =
      "Informe seus custos fixos. Use R$ 0,00 caso não existam.";
  }

  if (
    values.dividasParceladasMensais === null ||
    values.dividasParceladasMensais < 0
  ) {
    errors.dividasParceladasMensais =
      "Informe suas dívidas mensais. Use R$ 0,00 caso não existam.";
  }

  return errors;
}

/**
 * Valida os campos relacionados à meta financeira.
 */
function validateGoal(values: SimulationFormValues): SimulationFormErrors {
  const errors: SimulationFormErrors = {};

  if (!values.meta.trim()) {
    errors.meta = "Descreva qual objetivo financeiro você deseja alcançar.";
  }

  if (values.custoDaMeta === null || values.custoDaMeta <= 0) {
    errors.custoDaMeta = "Informe um custo da meta maior que zero.";
  }

  if (
    values.prazoDesejadoEmMeses === null ||
    !Number.isInteger(values.prazoDesejadoEmMeses) ||
    values.prazoDesejadoEmMeses <= 0
  ) {
    errors.prazoDesejadoEmMeses = "Informe um prazo inteiro maior que zero.";
  }

  return errors;
}

/**
 * Converte o estado parcial em uma entrada financeira completa.
 *
 * Esta função só deve ser executada depois que todas as etapas
 * forem validadas.
 */
function createSimulationInput(values: SimulationFormValues): SimulationInput {
  if (
    values.rendaMensalBruta === null ||
    values.custosFixosEssenciais === null ||
    values.dividasParceladasMensais === null ||
    values.custoDaMeta === null ||
    values.prazoDesejadoEmMeses === null
  ) {
    throw new Error(
      "Não foi possível criar a simulação: existem campos incompletos.",
    );
  }

  return {
    rendaMensalBruta: values.rendaMensalBruta,
    custosFixosEssenciais: values.custosFixosEssenciais,
    dividasParceladasMensais: values.dividasParceladasMensais,
    meta: values.meta.trim(),
    custoDaMeta: values.custoDaMeta,
    prazoDesejadoEmMeses: values.prazoDesejadoEmMeses,
  };
}

/**
 * Formulário financeiro dividido em três etapas:
 * - Situação mensal.
 * - Meta financeira.
 * - Revisão.
 */
export function SimulationForm({ onComplete }: SimulationFormProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const [values, setValues] = useState<SimulationFormValues>(initialValues);

  const [errors, setErrors] = useState<SimulationFormErrors>({});

  function updateField<Field extends keyof SimulationFormValues>(
    field: Field,
    value: SimulationFormValues[Field],
  ) {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }));
  }

  function handleBack() {
    setErrors({});

    setCurrentStepIndex((currentIndex) => Math.max(0, currentIndex - 1));
  }

  function handleContinue() {
    if (currentStepIndex === 0) {
      const stepErrors = validateMonthlyFinances(values);

      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        return;
      }
    }

    if (currentStepIndex === 1) {
      const stepErrors = validateGoal(values);

      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        return;
      }
    }

    setErrors({});

    if (currentStepIndex === totalSteps - 1) {
      onComplete(createSimulationInput(values));
      return;
    }

    setCurrentStepIndex((currentIndex) =>
      Math.min(totalSteps - 1, currentIndex + 1),
    );
  }

  return (
    <FormStep
      currentStep={currentStepIndex + 1}
      totalSteps={totalSteps}
      eyebrow="Simulação financeira"
      title={
        currentStepIndex === 0
          ? "Como está seu mês financeiro?"
          : currentStepIndex === 1
            ? "Qual é a sua meta?"
            : "Revise sua simulação"
      }
      description={
        currentStepIndex === 0
          ? "Informe sua renda e os principais compromissos mensais."
          : currentStepIndex === 1
            ? "Defina o objetivo, o valor necessário e o prazo desejado."
            : "Confira os dados antes de calcular a viabilidade da meta."
      }
    >
      {currentStepIndex === 0 && (
        <div className="space-y-5">
          <CurrencyInput
            id="rendaMensalBruta"
            label="Renda mensal bruta"
            value={values.rendaMensalBruta}
            onValueChange={(value) => updateField("rendaMensalBruta", value)}
            placeholder="0,00"
            helperText="Informe sua renda antes dos descontos."
            error={errors.rendaMensalBruta}
            required
          />

          <CurrencyInput
            id="custosFixosEssenciais"
            label="Custos fixos essenciais"
            value={values.custosFixosEssenciais}
            onValueChange={(value) =>
              updateField("custosFixosEssenciais", value)
            }
            placeholder="0,00"
            helperText="Moradia, alimentação, transporte, saúde e contas essenciais."
            error={errors.custosFixosEssenciais}
            required
          />

          <CurrencyInput
            id="dividasParceladasMensais"
            label="Dívidas parceladas mensais"
            value={values.dividasParceladasMensais}
            onValueChange={(value) =>
              updateField("dividasParceladasMensais", value)
            }
            placeholder="0,00"
            helperText="Informe o total mensal de empréstimos, financiamentos e parcelamentos."
            error={errors.dividasParceladasMensais}
            required
          />
        </div>
      )}

      {currentStepIndex === 1 && (
        <div className="space-y-5">
          <TextInput
            id="meta"
            label="Meta financeira"
            value={values.meta}
            onValueChange={(value) => updateField("meta", value)}
            placeholder="Ex.: criar uma reserva de emergência"
            maxLength={120}
            helperText="Descreva sua meta de forma curta e objetiva."
            error={errors.meta}
            required
          />

          <CurrencyInput
            id="custoDaMeta"
            label="Custo total da meta"
            value={values.custoDaMeta}
            onValueChange={(value) => updateField("custoDaMeta", value)}
            placeholder="0,00"
            error={errors.custoDaMeta}
            required
          />

          <NumberInput
            id="prazoDesejadoEmMeses"
            label="Prazo desejado em meses"
            value={values.prazoDesejadoEmMeses}
            onValueChange={(value) =>
              updateField("prazoDesejadoEmMeses", value)
            }
            min={1}
            max={600}
            step={1}
            placeholder="Ex.: 12"
            helperText="Informe um prazo entre 1 e 600 meses."
            error={errors.prazoDesejadoEmMeses}
            required
          />
        </div>
      )}

      {currentStepIndex === 2 && (
        <div className="space-y-4">
          <Card variant="muted" padding="sm">
            <p className="text-sm text-[var(--color-text-muted)]">
              Renda mensal bruta
            </p>

            <strong className="mt-1 block text-xl">
              {formatCurrency(values.rendaMensalBruta ?? 0)}
            </strong>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card variant="outline" padding="sm">
              <p className="text-sm text-[var(--color-text-muted)]">
                Custos essenciais
              </p>

              <strong className="mt-1 block text-lg">
                {formatCurrency(values.custosFixosEssenciais ?? 0)}
              </strong>
            </Card>

            <Card variant="outline" padding="sm">
              <p className="text-sm text-[var(--color-text-muted)]">
                Dívidas mensais
              </p>

              <strong className="mt-1 block text-lg">
                {formatCurrency(values.dividasParceladasMensais ?? 0)}
              </strong>
            </Card>
          </div>

          <Card variant="outline" padding="sm">
            <p className="text-sm text-[var(--color-text-muted)]">Meta</p>

            <strong className="mt-1 block text-lg">{values.meta}</strong>

            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              {formatCurrency(values.custoDaMeta ?? 0)}
              {" em "}
              {values.prazoDesejadoEmMeses ?? 0}
              {" meses"}
            </p>
          </Card>
        </div>
      )}

      <StepNavigation
        canGoBack={currentStepIndex > 0}
        canContinue
        continueLabel={
          currentStepIndex === totalSteps - 1
            ? "Calcular viabilidade"
            : "Continuar"
        }
        onBack={handleBack}
        onContinue={handleContinue}
      />
    </FormStep>
  );
}
