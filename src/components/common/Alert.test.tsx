import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Alert } from "./Alert";

/**
 * Casos utilizados para verificar as quatro variantes visuais
 * e semânticas disponíveis no componente.
 */
const alertVariantCases = [
  {
    variant: "info",
    expectedRole: "status",
    expectedAriaLive: "polite",
    expectedBorderClass: "border-[var(--color-primary)]",
    expectedBackgroundClass: "bg-[var(--color-primary-soft)]",
  },
  {
    variant: "success",
    expectedRole: "status",
    expectedAriaLive: "polite",
    expectedBorderClass: "border-[var(--color-success)]",
    expectedBackgroundClass: "bg-[var(--color-success-soft)]",
  },
  {
    variant: "warning",
    expectedRole: "status",
    expectedAriaLive: "polite",
    expectedBorderClass: "border-[var(--color-warning)]",
    expectedBackgroundClass: "bg-[var(--color-warning-soft)]",
  },
  {
    variant: "danger",
    expectedRole: "alert",
    expectedAriaLive: "assertive",
    expectedBorderClass: "border-[var(--color-danger)]",
    expectedBackgroundClass: "bg-[var(--color-danger-soft)]",
  },
] as const;

describe("Alert", () => {
  it("associa semanticamente o título e o conteúdo", () => {
    render(
      <Alert title="Resumo da simulação" variant="info">
        A meta está dentro do prazo planejado.
      </Alert>,
    );

    const alert = screen.getByRole("status", {
      name: "Resumo da simulação",
    });

    expect(alert).toHaveAccessibleName("Resumo da simulação");

    expect(alert).toHaveAccessibleDescription(
      "A meta está dentro do prazo planejado.",
    );

    const labelledBy = alert.getAttribute("aria-labelledby");

    const describedBy = alert.getAttribute("aria-describedby");

    expect(labelledBy).toBeTruthy();

    expect(describedBy).toBeTruthy();

    expect(document.getElementById(labelledBy ?? "")).toHaveTextContent(
      "Resumo da simulação",
    );

    expect(document.getElementById(describedBy ?? "")).toHaveTextContent(
      "A meta está dentro do prazo planejado.",
    );
  });

  it("funciona sem título e mantém o conteúdo como descrição acessível", () => {
    render(<Alert variant="success">A simulação foi salva com sucesso.</Alert>);

    const alert = screen.getByRole("status");

    expect(alert).not.toHaveAttribute("aria-labelledby");

    expect(alert).toHaveAccessibleDescription(
      "A simulação foi salva com sucesso.",
    );

    expect(
      screen.getByText("A simulação foi salva com sucesso."),
    ).toBeInTheDocument();
  });

  it.each(alertVariantCases)(
    "aplica semântica e aparência corretas para a variante $variant",
    ({
      variant,
      expectedRole,
      expectedAriaLive,
      expectedBorderClass,
      expectedBackgroundClass,
    }) => {
      render(
        <Alert title={`Alerta ${variant}`} variant={variant}>
          Conteúdo da mensagem.
        </Alert>,
      );

      const alert = screen.getByRole(expectedRole, {
        name: `Alerta ${variant}`,
      });

      expect(alert).toHaveAttribute("data-variant", variant);

      expect(alert).toHaveAttribute("aria-live", expectedAriaLive);

      expect(alert).toHaveAttribute("aria-atomic", "true");

      expect(alert).toHaveClass(expectedBorderClass);

      expect(alert).toHaveClass(expectedBackgroundClass);

      /**
       * O ícone deve existir visualmente, mas não pode ser
       * anunciado separadamente pelo leitor de tela.
       */
      const icon = alert.querySelector("svg");

      expect(icon).toBeInTheDocument();

      expect(icon).toHaveAttribute("aria-hidden", "true");
    },
  );

  it("preserva atributos ARIA personalizados passados pelo consumidor", () => {
    render(
      <Alert
        data-testid="custom-alert"
        data-origin="chat"
        variant="danger"
        role="status"
        aria-label="Mensagem controlada"
        aria-live="off"
        aria-atomic={false}
        className="mt-8"
      >
        Conteúdo personalizado.
      </Alert>,
    );

    const alert = screen.getByTestId("custom-alert");

    expect(alert).toHaveAttribute("role", "status");

    expect(alert).toHaveAttribute("aria-label", "Mensagem controlada");

    expect(alert).toHaveAttribute("aria-live", "off");

    expect(alert).toHaveAttribute("aria-atomic", "false");

    expect(alert).toHaveAttribute("data-origin", "chat");

    expect(alert).toHaveClass("mt-8");
  });

  it("mantém elementos interativos internos acessíveis", () => {
    render(
      <Alert title="Não foi possível responder" variant="danger">
        <p>O serviço está temporariamente indisponível.</p>

        <button type="button">Tentar novamente</button>
      </Alert>,
    );

    const retryButton = screen.getByRole("button", {
      name: "Tentar novamente",
    });

    expect(retryButton).toBeInTheDocument();

    expect(retryButton).toBeEnabled();
  });
});
