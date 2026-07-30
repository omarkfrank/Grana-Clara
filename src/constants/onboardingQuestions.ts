import type { OnboardingQuestion } from "../types/onboarding";

/**
 * Perguntas oficiais do onboarding do Grana Clara.
 *
 * Manter as perguntas em um arquivo de constantes facilita:
 * - Alterações futuras nos textos.
 * - Reutilização em testes.
 * - Cálculo automático da quantidade de etapas.
 * - Separação entre conteúdo e interface.
 */
export const onboardingQuestions: readonly OnboardingQuestion[] = [
  {
    id: "situacaoFinanceiraAtual",
    block: "Diagnóstico atual",
    title: "Como você define sua situação financeira atual?",
    description:
      "Escolha a alternativa que mais se aproxima do seu momento financeiro.",
    options: [
      {
        value: "in_debt",
        label: "No vermelho: estou com dívidas.",
      },
      {
        value: "balanced_no_surplus",
        label: "No amarelo: pago as contas, mas não sobra.",
      },
      {
        value: "saving",
        label: "No azul: consigo guardar dinheiro.",
      },
      {
        value: "unknown",
        label: "Não sei avaliar ainda.",
      },
    ],
  },
  {
    id: "fonteDeRenda",
    block: "Diagnóstico atual",
    title: "Qual é sua principal fonte de renda hoje?",
    description:
      "Essa informação ajuda a adaptar as recomendações à estabilidade da sua renda.",
    options: [
      {
        value: "employee",
        label: "Assalariado, CLT ou concurso.",
      },
      {
        value: "self_employed",
        label: "Autônomo ou freelancer.",
      },
      {
        value: "business_owner",
        label: "Empresário.",
      },
      {
        value: "no_fixed_income",
        label: "Não tenho renda fixa.",
      },
    ],
  },
  {
    id: "controleDosGastos",
    block: "Diagnóstico atual",
    title: "Você sabe para onde vai seu dinheiro todo mês?",
    description:
      "Não existe resposta certa ou errada. Queremos entender seu nível atual de organização.",
    options: [
      {
        value: "tracks_everything",
        label: "Sim, anoto tudo.",
      },
      {
        value: "rough_idea",
        label: "Tenho uma ideia por cima.",
      },
      {
        value: "no_idea",
        label: "Não faço a menor ideia.",
      },
      {
        value: "starting_now",
        label: "Estou começando a organizar agora.",
      },
    ],
  },
  {
    id: "objetivoPrincipal",
    block: "Definição de objetivos",
    title: "Qual é seu maior objetivo financeiro agora?",
    description:
      "Seu objetivo será utilizado para personalizar a experiência no Grana Clara.",
    options: [
      {
        value: "pay_debts",
        label: "Sair das dívidas.",
      },
      {
        value: "start_saving",
        label: "Começar a guardar dinheiro.",
      },
      {
        value: "emergency_fund",
        label: "Criar uma reserva de emergência.",
      },
      {
        value: "purchase_or_trip",
        label: "Comprar um bem ou realizar uma viagem.",
      },
    ],
  },
  {
    id: "prazoObjetivo",
    block: "Definição de objetivos",
    title: "Em quanto tempo você gostaria de alcançar esse objetivo?",
    description:
      "O prazo poderá ser ajustado com mais precisão durante a simulação.",
    options: [
      {
        value: "less_than_six_months",
        label: "Menos de 6 meses.",
      },
      {
        value: "six_to_twelve_months",
        label: "Entre 6 meses e 1 ano.",
      },
      {
        value: "more_than_one_year",
        label: "Mais de 1 ano.",
      },
      {
        value: "undefined",
        label: "Ainda não defini prazo.",
      },
    ],
  },
  {
    id: "nivelConhecimento",
    block: "Nível de conhecimento",
    title: "Como você se sente sobre finanças?",
    description:
      "Usaremos sua resposta para ajustar a linguagem das futuras orientações.",
    options: [
      {
        value: "beginner",
        label: "Iniciante: não entendo bem os termos.",
      },
      {
        value: "intermediate",
        label: "Intermediário: conheço o básico.",
      },
      {
        value: "advanced",
        label: "Avançado: já estudo ou invisto.",
      },
      {
        value: "learning_from_zero",
        label: "Quero aprender do zero.",
      },
    ],
  },
  {
    id: "tempoDisponivel",
    block: "Nível de conhecimento",
    title: "Quanto tempo pretende dedicar ao app?",
    description:
      "Isso ajuda a preparar uma experiência compatível com sua rotina.",
    options: [
      {
        value: "less_than_five_minutes_daily",
        label: "Menos de 5 minutos por dia.",
      },
      {
        value: "fifteen_minutes_weekly",
        label: "15 minutos no fim de semana.",
      },
      {
        value: "on_payday",
        label: "Quando receber meu salário.",
      },
      {
        value: "undefined",
        label: "Ainda não sei.",
      },
    ],
  },
];
