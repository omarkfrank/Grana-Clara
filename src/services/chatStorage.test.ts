import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CHAT_STORAGE_KEY,
  clearChatMessages,
  getChatConversation,
  getChatMessages,
  saveChatMessages,
} from "./chatStorage";
import type { SavedChatMessage } from "../types/chat";

/**
 * Implementação em memória da interface Storage.
 *
 * Ela permite testar o serviço sem depender do localStorage
 * real de um navegador.
 */
class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

/**
 * Cria uma mensagem válida para os cenários de teste.
 */
function createMessage(
  id: string,
  role: SavedChatMessage["role"],
  content: string,
): SavedChatMessage {
  return {
    id,
    role,
    content,
    createdAt: "2026-07-31T12:00:00.000Z",
  };
}

describe("chatStorage", () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();

    vi.stubGlobal("window", {
      localStorage: storage,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("retorna uma lista vazia quando não existe conversa", () => {
    expect(getChatMessages("simulation-1")).toEqual([]);
  });

  it("salva e recupera as mensagens de uma simulação", () => {
    const messages = [
      createMessage("message-1", "user", "Como posso organizar meu orçamento?"),

      createMessage(
        "message-2",
        "assistant",
        "Comece separando despesas essenciais e variáveis.",
      ),
    ];

    saveChatMessages("simulation-1", messages);

    expect(getChatMessages("simulation-1")).toEqual(messages);
  });

  it("atualiza a conversa existente sem criar duplicação", () => {
    saveChatMessages("simulation-1", [
      createMessage("message-1", "user", "Primeira pergunta"),
    ]);

    saveChatMessages("simulation-1", [
      createMessage("message-1", "user", "Primeira pergunta"),

      createMessage("message-2", "assistant", "Primeira resposta"),
    ]);

    const storedValue = storage.getItem(CHAT_STORAGE_KEY);

    expect(storedValue).not.toBeNull();

    const parsedValue = JSON.parse(storedValue ?? "{}") as {
      conversations: unknown[];
    };

    expect(parsedValue.conversations).toHaveLength(1);

    expect(getChatMessages("simulation-1")).toHaveLength(2);
  });

  it("mantém conversas separadas por simulação", () => {
    saveChatMessages("simulation-1", [
      createMessage("message-1", "user", "Pergunta da primeira simulação"),
    ]);

    saveChatMessages("simulation-2", [
      createMessage("message-2", "user", "Pergunta da segunda simulação"),
    ]);

    expect(getChatConversation("simulation-1")?.messages[0]?.content).toBe(
      "Pergunta da primeira simulação",
    );

    expect(getChatConversation("simulation-2")?.messages[0]?.content).toBe(
      "Pergunta da segunda simulação",
    );
  });

  it("limpa somente a conversa solicitada", () => {
    saveChatMessages("simulation-1", [
      createMessage("message-1", "user", "Conversa que será removida"),
    ]);

    saveChatMessages("simulation-2", [
      createMessage("message-2", "user", "Conversa que será preservada"),
    ]);

    expect(clearChatMessages("simulation-1")).toBe(true);

    expect(getChatMessages("simulation-1")).toEqual([]);

    expect(getChatMessages("simulation-2")).toHaveLength(1);
  });

  it("ignora conteúdo corrompido no localStorage", () => {
    storage.setItem(CHAT_STORAGE_KEY, "{conteudo-invalido");

    expect(getChatMessages("simulation-1")).toEqual([]);
  });
});
