/**
 * Papéis reconhecidos nas mensagens do chat.
 *
 * - user: mensagem enviada pela pessoa usuária.
 * - assistant: resposta produzida pelo Educador Financeiro.
 */
export type ChatMessageRole = "user" | "assistant";

/**
 * Representa uma mensagem persistida no navegador.
 *
 * O identificador é utilizado pelo React e também permite
 * evoluções futuras, como exclusão individual ou reações.
 */
export type SavedChatMessage = {
  id: string;
  role: ChatMessageRole;
  content: string;
  createdAt: string;
};

/**
 * Representa a conversa vinculada a uma simulação financeira.
 */
export type SavedChatConversation = {
  simulationId: string;
  updatedAt: string;
  messages: SavedChatMessage[];
};
