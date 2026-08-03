import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ChatStorageError,
  clearChatMessages,
  getChatMessages,
  saveChatMessages,
} from "../services/chatStorage";
import {
  FinancialChatApiError,
  requestFinancialChatAnswer,
} from "../services/financialChatApi";
import { getSimulationById } from "../services/simulationStorage";
import type { SavedChatMessage } from "../types/chat";
import type { SavedSimulation } from "../types/simulation";
import { ChatPage } from "./ChatPage";

/**
 * Mantém a classe real ChatStorageError para que as verificações
 * com instanceof executadas pela página continuem funcionando.
 *
 * Somente as funções que acessam o localStorage são substituídas
 * por mocks controlados pela suíte.
 */
vi.mock("../services/chatStorage", async (importOriginal) => {
  const actualModule =
    await importOriginal<typeof import("../services/chatStorage")>();

  return {
    ...actualModule,

    getChatMessages: vi.fn(),
    saveChatMessages: vi.fn(),
    clearChatMessages: vi.fn(),
  };
});

/**
 * Mantém a classe real FinancialChatApiError.
 *
 * Apenas a solicitação HTTP é substituída para que cada teste
 * controle o resultado da API sem utilizar o backend verdadeiro.
 */
vi.mock("../services/financialChatApi", async (importOriginal) => {
  const actualModule =
    await importOriginal<typeof import("../services/financialChatApi")>();

  return {
    ...actualModule,

    requestFinancialChatAnswer: vi.fn(),
  };
});

/**
 * Mantém o restante do serviço de simulações e substitui somente
 * a função utilizada pela ChatPage para localizar a simulação.
 */
vi.mock("../services/simulationStorage", async (importOriginal) => {
  const actualModule =
    await importOriginal<typeof import("../services/simulationStorage")>();

  return {
    ...actualModule,

    getSimulationById: vi.fn(),
  };
});

/**
 * Versões tipadas dos mocks.
 *
 * vi.mocked preserva os parâmetros e retornos definidos nas
 * funções reais, oferecendo autocomplete e validação TypeScript.
 */
const mockedGetChatMessages = vi.mocked(getChatMessages);

const mockedSaveChatMessages = vi.mocked(saveChatMessages);

const mockedClearChatMessages = vi.mocked(clearChatMessages);

const mockedRequestFinancialChatAnswer = vi.mocked(requestFinancialChatAnswer);

const mockedGetSimulationById = vi.mocked(getSimulationById);

/**
 * Simulação financeira válida utilizada pelos testes.
 */
const simulation: SavedSimulation = {
  id: "chat-simulation-test",

  createdAt: "2026-08-03T12:00:00.000Z",

  promptVersion: "financial-educator-v2",

  input: {
    rendaMensalBruta: 5000,
    custosFixosEssenciais: 2500,
    dividasParceladasMensais: 500,
    meta: "Reserva para viagem",
    custoDaMeta: 12000,
    prazoDesejadoEmMeses: 12,
  },

  result: {
    valorDisponivelPorMes: 2000,
    economiaMensalNecessaria: 1000,
    saldoAposReservaParaMeta: 1000,
    status: "viable",
  },

  onboarding: {
    situacaoFinanceiraAtual: "balanced_no_surplus",

    fonteDeRenda: "employee",

    controleDosGastos: "rough_idea",

    objetivoPrincipal: "purchase_or_trip",

    prazoObjetivo: "six_to_twelve_months",

    nivelConhecimento: "beginner",

    tempoDisponivel: "less_than_five_minutes_daily",
  },
};

/**
 * Histórico previamente salvo para validar o carregamento,
 * a renderização e o envio de contexto para a API.
 */
const persistedMessages: SavedChatMessage[] = [
  {
    id: "message-user-existing",
    role: "user",
    content: "Como está minha situação?",
    createdAt: "2026-08-03T12:10:00.000Z",
  },

  {
    id: "message-assistant-existing",
    role: "assistant",
    content: "Sua **prioridade** pode ser preservar o valor disponível.",
    createdAt: "2026-08-03T12:11:00.000Z",
  },
];

/**
 * Resposta mínima necessária para a ChatPage.
 *
 * A página utiliza a propriedade answer para criar a mensagem
 * retornada pelo Educador Financeiro.
 */
const chatResponse = {
  answer: "Comece pelo **orçamento mensal** e acompanhe os gastos variáveis.",
} as Awaited<ReturnType<typeof requestFinancialChatAnswer>>;

/**
 * Cria uma Promise que pode ser resolvida manualmente pelo teste.
 *
 * Essa estrutura permite verificar o estado de carregamento antes
 * que a resposta simulada seja concluída.
 */
function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;

  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return {
    promise,
    resolve,
    reject,
  };
}

/**
 * Renderiza a ChatPage dentro da rota parametrizada esperada
 * pelo componente.
 */
function renderChatPage(simulationId = simulation.id): void {
  render(
    <MemoryRouter initialEntries={[`/chat/${simulationId}`]}>
      <Routes>
        <Route path="/chat/:simulationId" element={<ChatPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

/**
 * Preenche o campo e envia uma pergunta utilizando o botão
 * principal do formulário.
 */
function submitQuestion(question: string): void {
  fireEvent.change(screen.getByLabelText("Sua pergunta"), {
    target: {
      value: question,
    },
  });

  fireEvent.click(
    screen.getByRole("button", {
      name: "Enviar pergunta",
    }),
  );
}

describe("ChatPage", () => {
  beforeEach(() => {
    /**
     * Remove chamadas e implementações deixadas por testes
     * anteriores.
     */
    mockedGetSimulationById.mockReset();
    mockedGetChatMessages.mockReset();
    mockedSaveChatMessages.mockReset();
    mockedClearChatMessages.mockReset();
    mockedRequestFinancialChatAnswer.mockReset();

    /**
     * Cenário padrão da suíte:
     * - A simulação existe.
     * - A conversa começa sem mensagens.
     *
     * saveChatMessages e clearChatMessages não precisam receber
     * uma implementação padrão. Como são vi.fn(), elas podem ser
     * chamadas normalmente e seus retornos não são utilizados
     * pela ChatPage.
     */
    mockedGetSimulationById.mockReturnValue(simulation);

    mockedGetChatMessages.mockReturnValue([]);
  });

  afterEach(() => {
    /**
     * Restaura spies criados sobre APIs globais, como confirm
     * e console.error.
     */
    vi.restoreAllMocks();
  });

  it("apresenta o estado de simulação não encontrada", () => {
    mockedGetSimulationById.mockReturnValue(null);

    renderChatPage("inexistente");

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Não foi possível abrir esta conversa.",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: "Criar simulação",
      }),
    ).toHaveAttribute("href", "/simulacao");

    expect(
      screen.getByRole("link", {
        name: "Ver histórico",
      }),
    ).toHaveAttribute("href", "/historico");

    /**
     * O histórico não deve ser consultado quando a simulação
     * associada à rota não existe.
     */
    expect(mockedGetChatMessages).not.toHaveBeenCalled();
  });

  it("carrega mensagens persistidas e renderiza o Markdown da resposta", () => {
    mockedGetChatMessages.mockReturnValue(persistedMessages);

    renderChatPage();

    const conversationLog = screen.getByRole("log", {
      name: "Conversa com o Educador Financeiro",
    });

    expect(mockedGetChatMessages).toHaveBeenCalledWith(simulation.id);

    expect(
      within(conversationLog).getByRole("article", {
        name: "Mensagem de Você",
      }),
    ).toHaveTextContent(persistedMessages[0].content);

    const assistantMessage = within(conversationLog).getByRole("article", {
      name: "Mensagem de Educador Financeiro",
    });

    /**
     * Confirma que a sintaxe Markdown **prioridade** foi
     * transformada em um elemento strong.
     */
    const highlightedText = within(assistantMessage).getByText("prioridade");

    expect(highlightedText.tagName).toBe("STRONG");

    expect(
      screen.getByRole("link", {
        name: "Voltar ao resultado",
      }),
    ).toHaveAttribute("href", `/resultado/${simulation.id}`);

    expect(mockedRequestFinancialChatAnswer).not.toHaveBeenCalled();
  });

  it("preenche uma pergunta sugerida e direciona o foco ao campo", () => {
    renderChatPage();

    const suggestedQuestion =
      "Como posso organizar melhor meu orçamento mensal?";

    fireEvent.click(
      screen.getByRole("button", {
        name: suggestedQuestion,
      }),
    );

    const questionInput = screen.getByLabelText("Sua pergunta");

    expect(questionInput).toHaveValue(suggestedQuestion);

    expect(questionInput).toHaveFocus();

    expect(
      screen.getByRole("button", {
        name: "Enviar pergunta",
      }),
    ).toBeEnabled();
  });

  it("envia uma pergunta, inclui o histórico e persiste a resposta", async () => {
    mockedGetChatMessages.mockReturnValue(persistedMessages);

    const deferredResponse = createDeferred<typeof chatResponse>();

    mockedRequestFinancialChatAnswer.mockReturnValue(deferredResponse.promise);

    renderChatPage();

    const question = "Como posso reduzir meus gastos?";

    submitQuestion(question);

    /**
     * A resposta permanece pendente para que o indicador
     * intermediário possa ser verificado.
     */
    expect(
      screen.getByRole("status", {
        name: "Resposta em preparação",
      }),
    ).toHaveAttribute("aria-busy", "true");

    expect(mockedRequestFinancialChatAnswer).toHaveBeenCalledWith(
      simulation,
      question,
      [
        {
          role: "user",
          content: persistedMessages[0].content,
        },

        {
          role: "assistant",
          content: persistedMessages[1].content,
        },
      ],
    );

    await act(async () => {
      deferredResponse.resolve(chatResponse);
    });

    expect(await screen.findByText("orçamento mensal")).toBeInTheDocument();

    expect(mockedSaveChatMessages).toHaveBeenCalledTimes(1);

    const [savedSimulationId, savedMessages] =
      mockedSaveChatMessages.mock.calls[0];

    expect(savedSimulationId).toBe(simulation.id);

    expect(savedMessages).toHaveLength(4);

    expect(savedMessages[2]).toMatchObject({
      role: "user",
      content: question,
    });

    expect(savedMessages[3]).toMatchObject({
      role: "assistant",
      content: chatResponse.answer,
    });

    /**
     * Depois da resposta, o campo volta a receber foco para
     * facilitar o envio de uma nova pergunta.
     */
    await waitFor(() => {
      expect(screen.getByLabelText("Sua pergunta")).toHaveFocus();
    });
  });

  it("usa Shift + Enter para nova linha e Enter para enviar", async () => {
    mockedRequestFinancialChatAnswer.mockResolvedValue(chatResponse);

    renderChatPage();

    const questionInput = screen.getByLabelText("Sua pergunta");

    fireEvent.change(questionInput, {
      target: {
        value: "Como posso ajustar minha meta?",
      },
    });

    /**
     * Shift + Enter não deve submeter o formulário.
     */
    fireEvent.keyDown(questionInput, {
      key: "Enter",
      shiftKey: true,
    });

    expect(mockedRequestFinancialChatAnswer).not.toHaveBeenCalled();

    /**
     * Enter sem Shift envia a pergunta.
     */
    fireEvent.keyDown(questionInput, {
      key: "Enter",
      shiftKey: false,
    });

    expect(await screen.findByText("orçamento mensal")).toBeInTheDocument();

    expect(mockedRequestFinancialChatAnswer).toHaveBeenCalledTimes(1);
  });

  it("apresenta o erro, mantém a pergunta e permite tentar novamente", async () => {
    mockedRequestFinancialChatAnswer
      .mockRejectedValueOnce(new FinancialChatApiError("Serviço ocupado.", 503))
      .mockResolvedValueOnce(chatResponse);

    renderChatPage();

    const question = "Como posso melhorar este resultado?";

    submitQuestion(question);

    const alert = await screen.findByRole("alert", {
      name: "Não foi possível responder",
    });

    /**
     * Utilizamos uma expressão porque a descrição acessível também
     * pode incluir o texto do botão de nova tentativa.
     */
    expect(alert).toHaveAccessibleDescription(
      /O Educador Financeiro está temporariamente ocupado\./,
    );

    expect(
      screen.getByRole("article", {
        name: "Mensagem de Você",
      }),
    ).toHaveTextContent(question);

    const errorContainer = alert.parentElement;

    expect(errorContainer).not.toBeNull();

    await waitFor(() => {
      expect(errorContainer).toHaveFocus();
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Tentar novamente",
      }),
    );

    expect(await screen.findByText("orçamento mensal")).toBeInTheDocument();

    expect(mockedRequestFinancialChatAnswer).toHaveBeenCalledTimes(2);

    expect(mockedSaveChatMessages).toHaveBeenCalledTimes(1);

    expect(
      screen.queryByRole("alert", {
        name: "Não foi possível responder",
      }),
    ).not.toBeInTheDocument();
  });

  it("mantém a conversa visível quando a persistência falha", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    mockedRequestFinancialChatAnswer.mockResolvedValue(chatResponse);

    /**
     * Uma função que sempre lança possui retorno never.
     *
     * O tipo never é compatível com o retorno original do serviço,
     * eliminando a necessidade de inventar um SavedChatConversation.
     */
    mockedSaveChatMessages.mockImplementation(() => {
      throw new ChatStorageError(
        "Não foi possível salvar a conversa no navegador.",
      );
    });

    renderChatPage();

    submitQuestion("Como posso organizar meu orçamento?");

    expect(await screen.findByText("orçamento mensal")).toBeInTheDocument();

    const warning = await screen.findByRole("status", {
      name: "A conversa não foi salva",
    });

    expect(warning).toHaveAccessibleDescription(
      "Não foi possível salvar a conversa no navegador.",
    );

    const warningContainer = warning.parentElement;

    expect(warningContainer).not.toBeNull();

    await waitFor(() => {
      expect(warningContainer).toHaveFocus();
    });

    expect(
      screen.getByRole("article", {
        name: "Mensagem de Você",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("article", {
        name: "Mensagem de Educador Financeiro",
      }),
    ).toBeInTheDocument();

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });

  it("cancela a limpeza sem remover as mensagens", () => {
    mockedGetChatMessages.mockReturnValue(persistedMessages);

    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

    renderChatPage();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Limpar conversa",
      }),
    );

    expect(confirmSpy).toHaveBeenCalledWith(
      "Deseja apagar todas as mensagens desta conversa? A simulação financeira será preservada.",
    );

    expect(mockedClearChatMessages).not.toHaveBeenCalled();

    expect(screen.getAllByRole("article")).toHaveLength(2);
  });

  it("limpa a conversa e focaliza o estado vazio", async () => {
    mockedGetChatMessages.mockReturnValue(persistedMessages);

    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderChatPage();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Limpar conversa",
      }),
    );

    expect(mockedClearChatMessages).toHaveBeenCalledWith(simulation.id);

    const emptyConversation = await screen.findByRole("region", {
      name: "Conversa vazia",
    });

    await waitFor(() => {
      expect(emptyConversation).toHaveFocus();
    });

    expect(screen.queryByRole("article")).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Limpar conversa",
      }),
    ).not.toBeInTheDocument();
  });

  it("mantém as mensagens e focaliza o aviso quando a limpeza falha", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    mockedGetChatMessages.mockReturnValue(persistedMessages);

    vi.spyOn(window, "confirm").mockReturnValue(true);

    /**
     * Como a função sempre lança, o retorno inferido é never,
     * compatível com o boolean retornado pelo serviço real.
     */
    mockedClearChatMessages.mockImplementation(() => {
      throw new Error("Falha ao limpar.");
    });

    renderChatPage();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Limpar conversa",
      }),
    );

    const warning = await screen.findByRole("status", {
      name: "A conversa não foi salva",
    });

    expect(warning).toHaveAccessibleDescription(
      "Não foi possível apagar a conversa neste navegador.",
    );

    const warningContainer = warning.parentElement;

    expect(warningContainer).not.toBeNull();

    await waitFor(() => {
      expect(warningContainer).toHaveFocus();
    });

    expect(screen.getAllByRole("article")).toHaveLength(2);

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });
});
