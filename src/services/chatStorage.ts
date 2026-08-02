import type {
  ChatMessageRole,
  SavedChatConversation,
  SavedChatMessage,
} from "../types/chat";

/**
 * Chave utilizada para persistir as conversas no navegador.
 *
 * As conversas ficam separadas das simulações financeiras,
 * evitando misturar responsabilidades entre os serviços.
 */
export const CHAT_STORAGE_KEY = "grana-clara:chat-conversations";

/**
 * Versão atual da estrutura persistida.
 *
 * Essa informação permitirá realizar migrações caso o formato
 * das conversas seja alterado futuramente.
 */
const CHAT_STORAGE_VERSION = 1;

/**
 * Limite de mensagens mantidas por simulação.
 *
 * O frontend pode armazenar mais mensagens do que as doze
 * enviadas ao Gemini, mas ainda aplicamos um limite para impedir
 * crescimento descontrolado do localStorage.
 */
const MAX_STORED_MESSAGES = 100;

/**
 * Envelope versionado persistido no navegador.
 */
type ChatStorageEnvelope = {
  version: number;
  conversations: SavedChatConversation[];
};

/**
 * Erro específico para falhas relacionadas à persistência
 * das conversas.
 */
export class ChatStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChatStorageError";
  }
}

/**
 * Verifica se um valor desconhecido é um objeto comum.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Verifica se o papel da mensagem é reconhecido pelo chat.
 */
function isChatMessageRole(value: unknown): value is ChatMessageRole {
  return value === "user" || value === "assistant";
}

/**
 * Valida uma mensagem recuperada do localStorage.
 */
function isSavedChatMessage(value: unknown): value is SavedChatMessage {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    value.id.length > 0 &&
    isChatMessageRole(value.role) &&
    typeof value.content === "string" &&
    value.content.trim().length > 0 &&
    typeof value.createdAt === "string" &&
    value.createdAt.length > 0
  );
}

/**
 * Valida uma conversa completa.
 */
function isSavedChatConversation(
  value: unknown,
): value is SavedChatConversation {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.simulationId === "string" &&
    value.simulationId.length > 0 &&
    typeof value.updatedAt === "string" &&
    value.updatedAt.length > 0 &&
    Array.isArray(value.messages) &&
    value.messages.every(isSavedChatMessage)
  );
}

/**
 * Valida o envelope completo armazenado no navegador.
 */
function isChatStorageEnvelope(value: unknown): value is ChatStorageEnvelope {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.version === CHAT_STORAGE_VERSION &&
    Array.isArray(value.conversations) &&
    value.conversations.every(isSavedChatConversation)
  );
}

/**
 * Cria um armazenamento vazio e estruturalmente válido.
 */
function createEmptyEnvelope(): ChatStorageEnvelope {
  return {
    version: CHAT_STORAGE_VERSION,
    conversations: [],
  };
}

/**
 * Obtém o localStorage somente quando o código está sendo
 * executado no navegador.
 */
function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

/**
 * Recupera e valida o conteúdo persistido.
 *
 * Dados vazios, corrompidos ou incompatíveis não interrompem
 * o funcionamento da aplicação. Nesses casos, retornamos um
 * armazenamento vazio.
 */
function readStorageEnvelope(): ChatStorageEnvelope {
  const storage = getBrowserStorage();

  if (!storage) {
    return createEmptyEnvelope();
  }

  const storedValue = storage.getItem(CHAT_STORAGE_KEY);

  if (!storedValue) {
    return createEmptyEnvelope();
  }

  try {
    const parsedValue: unknown = JSON.parse(storedValue);

    if (!isChatStorageEnvelope(parsedValue)) {
      console.warn("As conversas salvas possuem uma estrutura incompatível.");

      return createEmptyEnvelope();
    }

    return parsedValue;
  } catch {
    console.warn("Não foi possível interpretar as conversas salvas.");

    return createEmptyEnvelope();
  }
}

/**
 * Persiste o envelope completo no localStorage.
 */
function writeStorageEnvelope(envelope: ChatStorageEnvelope): void {
  const storage = getBrowserStorage();

  if (!storage) {
    throw new ChatStorageError(
      "O armazenamento local não está disponível neste ambiente.",
    );
  }

  try {
    storage.setItem(CHAT_STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    throw new ChatStorageError(
      "Não foi possível salvar a conversa neste navegador.",
    );
  }
}

/**
 * Cria uma cópia segura das mensagens.
 *
 * Isso impede que componentes externos alterem diretamente
 * os objetos mantidos pelo serviço.
 */
function cloneMessages(
  messages: readonly SavedChatMessage[],
): SavedChatMessage[] {
  return messages.map((message) => ({
    ...message,
  }));
}

/**
 * Recupera a conversa vinculada a uma simulação.
 */
export function getChatConversation(
  simulationId: string,
): SavedChatConversation | null {
  const { conversations } = readStorageEnvelope();

  const conversation = conversations.find(
    (item) => item.simulationId === simulationId,
  );

  if (!conversation) {
    return null;
  }

  return {
    ...conversation,
    messages: cloneMessages(conversation.messages),
  };
}

/**
 * Recupera somente as mensagens de uma simulação.
 *
 * Quando ainda não existe uma conversa, retorna uma lista vazia.
 */
export function getChatMessages(simulationId: string): SavedChatMessage[] {
  return getChatConversation(simulationId)?.messages ?? [];
}

/**
 * Salva ou atualiza a conversa de uma simulação.
 *
 * O mesmo simulationId sempre atualiza o registro existente,
 * evitando duplicações após novas respostas ou atualizações
 * da página.
 */
export function saveChatMessages(
  simulationId: string,
  messages: readonly SavedChatMessage[],
): SavedChatConversation {
  if (!simulationId.trim()) {
    throw new ChatStorageError(
      "Não é possível salvar uma conversa sem simulação.",
    );
  }

  if (!messages.every(isSavedChatMessage)) {
    throw new ChatStorageError("A conversa contém mensagens inválidas.");
  }

  const envelope = readStorageEnvelope();

  const storedMessages = cloneMessages(messages).slice(-MAX_STORED_MESSAGES);

  const updatedConversation: SavedChatConversation = {
    simulationId,
    updatedAt: new Date().toISOString(),
    messages: storedMessages,
  };

  const conversationIndex = envelope.conversations.findIndex(
    (conversation) => conversation.simulationId === simulationId,
  );

  const updatedConversations = [...envelope.conversations];

  if (conversationIndex >= 0) {
    updatedConversations[conversationIndex] = updatedConversation;
  } else {
    updatedConversations.push(updatedConversation);
  }

  writeStorageEnvelope({
    version: CHAT_STORAGE_VERSION,
    conversations: updatedConversations,
  });

  return {
    ...updatedConversation,
    messages: cloneMessages(updatedConversation.messages),
  };
}

/**
 * Remove somente a conversa vinculada à simulação indicada.
 *
 * A simulação financeira e seus insights permanecem preservados.
 */
export function clearChatMessages(simulationId: string): boolean {
  const envelope = readStorageEnvelope();

  const remainingConversations = envelope.conversations.filter(
    (conversation) => conversation.simulationId !== simulationId,
  );

  if (remainingConversations.length === envelope.conversations.length) {
    return false;
  }

  writeStorageEnvelope({
    version: CHAT_STORAGE_VERSION,
    conversations: remainingConversations,
  });

  return true;
}
