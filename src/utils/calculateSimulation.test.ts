import { describe, expect, it } from "vitest";

import type { SimulationInput } from "../types/finance";
import { calculateSimulation } from "./calculateSimulation";

const validSimulationInput: SimulationInput = {
  rendaMensalBruta: 4000,
  custosFixosEssenciais: 2100,
  dividasParceladasMensais: 500,
  meta: "Comprar um notebook",
  custoDaMeta: 10800,
  prazoDesejadoEmMeses: 12,
};

describe("calculateSimulation", () => {
  describe("cálculos financeiros", () => {
    it("calcula corretamente uma meta viável", () => {
      const result = calculateSimulation(validSimulationInput);

      expect(result).toEqual({
        valorDisponivelPorMes: 1400,
        economiaMensalNecessaria: 900,
        saldoAposReservaParaMeta: 500,
        status: "viable",
      });
    });

    it("classifica como needs_adjustments quando o déficit é menor que 20%", () => {
      const input: SimulationInput = {
        rendaMensalBruta: 4000,
        custosFixosEssenciais: 2300,
        dividasParceladasMensais: 800,
        meta: "Comprar um notebook",
        custoDaMeta: 12000,
        prazoDesejadoEmMeses: 12,
      };

      const result = calculateSimulation(input);

      expect(result).toEqual({
        valorDisponivelPorMes: 900,
        economiaMensalNecessaria: 1000,
        saldoAposReservaParaMeta: -100,
        status: "needs_adjustments",
      });
    });

    it("mantém needs_adjustments exatamente no limite de 20%", () => {
      const input: SimulationInput = {
        rendaMensalBruta: 1000,
        custosFixosEssenciais: 0,
        dividasParceladasMensais: 200,
        meta: "Criar uma reserva",
        custoDaMeta: 10000,
        prazoDesejadoEmMeses: 10,
      };

      const result = calculateSimulation(input);

      expect(result.economiaMensalNecessaria).toBe(1000);

      expect(result.saldoAposReservaParaMeta).toBe(-200);

      expect(result.status).toBe("needs_adjustments");
    });

    it("classifica como unfeasible quando o déficit supera 20%", () => {
      const input: SimulationInput = {
        rendaMensalBruta: 3000,
        custosFixosEssenciais: 2100,
        dividasParceladasMensais: 500,
        meta: "Realizar uma viagem",
        custoDaMeta: 12000,
        prazoDesejadoEmMeses: 12,
      };

      const result = calculateSimulation(input);

      expect(result).toEqual({
        valorDisponivelPorMes: 400,
        economiaMensalNecessaria: 1000,
        saldoAposReservaParaMeta: -600,
        status: "unfeasible",
      });
    });

    it("arredonda resultados monetários para duas casas decimais", () => {
      const input: SimulationInput = {
        rendaMensalBruta: 1000,
        custosFixosEssenciais: 100,
        dividasParceladasMensais: 0,
        meta: "Meta com divisão decimal",
        custoDaMeta: 1000,
        prazoDesejadoEmMeses: 3,
      };

      const result = calculateSimulation(input);

      expect(result.valorDisponivelPorMes).toBe(900);

      expect(result.economiaMensalNecessaria).toBe(333.33);

      expect(result.saldoAposReservaParaMeta).toBe(566.67);

      expect(result.status).toBe("viable");
    });

    it("não altera o objeto recebido", () => {
      const originalInput: SimulationInput = {
        ...validSimulationInput,
      };

      const originalSnapshot = {
        ...originalInput,
      };

      calculateSimulation(originalInput);

      expect(originalInput).toEqual(originalSnapshot);
    });

    it("produz o mesmo resultado para a mesma entrada", () => {
      const firstResult = calculateSimulation(validSimulationInput);

      const secondResult = calculateSimulation(validSimulationInput);

      expect(firstResult).toEqual(secondResult);
    });
  });

  describe("validação da entrada", () => {
    it("rejeita renda igual a zero", () => {
      expect(() =>
        calculateSimulation({
          ...validSimulationInput,
          rendaMensalBruta: 0,
        }),
      ).toThrow("A renda mensal bruta deve ser maior que zero.");
    });

    it("rejeita custos fixos negativos", () => {
      expect(() =>
        calculateSimulation({
          ...validSimulationInput,
          custosFixosEssenciais: -1,
        }),
      ).toThrow("Os custos fixos essenciais não podem ser negativos.");
    });

    it("rejeita dívidas mensais negativas", () => {
      expect(() =>
        calculateSimulation({
          ...validSimulationInput,
          dividasParceladasMensais: -1,
        }),
      ).toThrow("As dívidas parceladas mensais não podem ser negativas.");
    });

    it("rejeita meta vazia", () => {
      expect(() =>
        calculateSimulation({
          ...validSimulationInput,
          meta: "   ",
        }),
      ).toThrow("A meta financeira deve ser informada.");
    });

    it("rejeita custo da meta igual a zero", () => {
      expect(() =>
        calculateSimulation({
          ...validSimulationInput,
          custoDaMeta: 0,
        }),
      ).toThrow("O custo da meta deve ser maior que zero.");
    });

    it("rejeita prazo igual a zero", () => {
      expect(() =>
        calculateSimulation({
          ...validSimulationInput,
          prazoDesejadoEmMeses: 0,
        }),
      ).toThrow("O prazo da meta deve ser um número inteiro maior que zero.");
    });

    it("rejeita prazo com valor decimal", () => {
      expect(() =>
        calculateSimulation({
          ...validSimulationInput,
          prazoDesejadoEmMeses: 12.5,
        }),
      ).toThrow("O prazo da meta deve ser um número inteiro maior que zero.");
    });

    it("rejeita valores NaN", () => {
      expect(() =>
        calculateSimulation({
          ...validSimulationInput,
          rendaMensalBruta: Number.NaN,
        }),
      ).toThrow("A renda mensal bruta deve ser um número válido.");
    });

    it("rejeita valores infinitos", () => {
      expect(() =>
        calculateSimulation({
          ...validSimulationInput,
          custoDaMeta: Number.POSITIVE_INFINITY,
        }),
      ).toThrow("O custo da meta deve ser um número válido.");
    });
  });
});
