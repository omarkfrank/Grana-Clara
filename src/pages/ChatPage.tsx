import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import ReactMarkdown from "react-markdown";
import { useParams } from "react-router";

import { Alert } from "../components/common/Alert";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { ButtonLink } from "../components/common/ButtonLink";
import { Card } from "../components/common/Card";
import {
  ChatStorageError,
  clearChatMessages,
  getChatMessages,
  saveChatMessages,
} from "../services/chatStorage";
import {
  FinancialChatApiError,
  requestFinancialChatAnswer,
  type FinancialChatHistoryMessage,
} from "../services/financialChatApi";
import { getSimulationById } from "../services/simulationStorage";
import type { SavedChatMessage } from "../types/chat";
import type { SavedSimulation } from "../types/simulation";
import { formatCurrency } from "../utils/formatCurrency";

/**
 * Propriedades internas da conversa.
 */
type ChatConversationProps = {
  simulation: SavedSimulation;
};

/**
 * Perguntas iniciais que ajudam a pessoa usuária a compreender
 * como o Educador Financeiro pode ser utilizado.
 */
const suggestedQuestions = [
  "Como posso organizar melhor meu orçamento mensal?",
  "O que posso ajustar para alcançar minha meta mais rápido?",
  "Como posso começar uma reserva de emergência?",
] as const;

/**
 * Gera um identificador local para uma mensagem.
 */
function createMessageId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return ["message", Date.now(), Math.random().toString(36).slice(2, 10)].join(
    "-",
  );
}

/**
 * Cria uma nova mensagem pronta para exibição e persistência.
 */
function createChatMessage(
  role: SavedChatMessage["role"],
  content: string,
): SavedChatMessage {
  return {
    id: createMessageId(),
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Formata o horário da mensagem para o padrão brasileiro.
 */
function formatMessageTime(createdAt: string): string {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Converte erros técnicos em mensagens apropriadas para
 * apresentação na interface.
 */
function getFriendlyErrorMessage(error: unknown): string {
  if (error instanceof FinancialChatApiError) {
    if (error.status === 400) {
      return error.message;
    }

    if (error.status === 429) {
      return "O limite temporário de perguntas foi atingido. Aguarde alguns instantes e tente novamente.";
    }

    if (error.status === 503) {
      return "O Educador Financeiro está temporariamente ocupado. Tente novamente em alguns instantes.";
    }

    if (error.status >= 500) {
      return "O serviço de conversa está temporariamente indisponível.";
    }

    return error.message;
  }

  if (error instanceof TypeError) {
    return "Não foi possível conectar ao serviço de conversa. Verifique sua conexão.";
  }

  return "Ocorreu um erro inesperado ao enviar sua pergunta.";
}

/**
 * Converte as mensagens persistidas para o formato enviado à API.
 *
 * O serviço HTTP selecionará somente as mensagens mais recentes
 * antes de enviar o histórico ao backend.
 */
function buildChatHistory(
  messages: SavedChatMessage[],
): FinancialChatHistoryMessage[] {
  return messages.map(({ role, content }) => ({
    role,
    content,
  }));
}

/**
 * Renderiza o conteúdo Markdown produzido pelo Educador.
 *
 * HTML bruto não é habilitado. A hierarquia visual recebida da
 * IA também é adaptada para não criar outros títulos h1 na página.
 */
function AssistantMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => (
          <h3 className="mb-3 mt-4 text-lg font-bold first:mt-0">{children}</h3>
        ),

        h2: ({ children }) => (
          <h4 className="mb-2 mt-4 text-base font-bold first:mt-0">
            {children}
          </h4>
        ),

        h3: ({ children }) => (
          <h5 className="mb-2 mt-3 font-semibold first:mt-0">{children}</h5>
        ),

        p: ({ children }) => (
          <p className="mb-3 whitespace-pre-wrap last:mb-0">{children}</p>
        ),

        ul: ({ children }) => (
          <ul className="my-3 list-disc space-y-1 pl-5">{children}</ul>
        ),

        ol: ({ children }) => (
          <ol className="my-3 list-decimal space-y-1 pl-5">{children}</ol>
        ),

        li: ({ children }) => <li className="pl-1">{children}</li>,

        strong: ({ children }) => (
          <strong className="font-semibold text-[var(--color-text)]">
            {children}
          </strong>
        ),

        em: ({ children }) => <em className="italic">{children}</em>,

        blockquote: ({ children }) => (
          <blockquote className="my-3 border-l-4 border-[var(--color-primary)] pl-4 italic text-[var(--color-text-muted)]">
            {children}
          </blockquote>
        ),

        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-[var(--color-primary)] underline decoration-current/50 underline-offset-2"
          >
            {children}
          </a>
        ),

        pre: ({ children }) => (
          <pre className="my-3 overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs leading-5 text-slate-100">
            {children}
          </pre>
        ),

        code: ({ children }) => (
          <code className="rounded bg-slate-200 px-1 py-0.5 font-mono text-xs text-slate-900 dark:bg-slate-800 dark:text-slate-100">
            {children}
          </code>
        ),

        hr: () => <hr className="my-4 border-[var(--color-border)]" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

/**
 * Renderiza uma mensagem da conversa.
 *
 * As perguntas permanecem como texto simples. Somente as respostas
 * do Educador utilizam Markdown.
 */
function ChatMessageBubble({ message }: { message: SavedChatMessage }) {
  const isUserMessage = message.role === "user";

  const author = isUserMessage ? "Você" : "Educador Financeiro";

  const messageTime = formatMessageTime(message.createdAt);

  return (
    <div className={isUserMessage ? "flex justify-end" : "flex justify-start"}>
      <article
        aria-label={`Mensagem de ${author}`}
        className={[
          "max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[82%]",
          isUserMessage
            ? "rounded-br-md bg-[var(--color-primary)] text-white"
            : "rounded-bl-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]",
        ].join(" ")}
      >
        <header
          className={[
            "mb-2 flex flex-wrap items-center gap-x-2 text-xs",
            isUserMessage ? "text-white/85" : "text-[var(--color-text-muted)]",
          ].join(" ")}
        >
          <strong>{author}</strong>

          {messageTime && (
            <time dateTime={message.createdAt}>{messageTime}</time>
          )}
        </header>

        {isUserMessage ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <AssistantMarkdown content={message.content} />
        )}
      </article>
    </div>
  );
}

/**
 * Conversa associada a uma simulação válida.
 */
function ChatConversation({ simulation }: ChatConversationProps) {
  const conversationTitleId = useId();
  const questionCounterId = useId();
  const questionInstructionsId = useId();

  const [messages, setMessages] = useState<SavedChatMessage[]>(() =>
    getChatMessages(simulation.id),
  );

  const [question, setQuestion] = useState("");

  const [pendingMessage, setPendingMessage] = useState<SavedChatMessage | null>(
    null,
  );

  const [isSending, setIsSending] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [errorAnnouncementKey, setErrorAnnouncementKey] = useState(0);

  const [storageWarning, setStorageWarning] = useState<string | null>(null);

  const [storageWarningKey, setStorageWarningKey] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const questionInputRef = useRef<HTMLTextAreaElement | null>(null);
  const errorContainerRef = useRef<HTMLDivElement | null>(null);
  const storageWarningContainerRef = useRef<HTMLDivElement | null>(null);
  const emptyConversationRef = useRef<HTMLDivElement | null>(null);

  const shouldFocusEmptyConversationRef = useRef(false);
  const shouldFocusQuestionRef = useRef(false);

  const pendingMessageId = pendingMessage?.id;

  /**
   * Mantém a parte mais recente da conversa visível.
   *
   * A animação é removida quando a pessoa prefere movimento
   * reduzido no sistema operacional.
   */
  useEffect(() => {
    const messagesEnd = messagesEndRef.current;

    if (!messagesEnd || typeof messagesEnd.scrollIntoView !== "function") {
      return;
    }

    const prefersReducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    messagesEnd.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "end",
    });
  }, [messages.length, pendingMessageId, isSending]);

  /**
   * Move o foco para o erro de comunicação com a API.
   */
  useEffect(() => {
    if (!errorMessage) {
      return;
    }

    errorContainerRef.current?.focus({
      preventScroll: false,
    });
  }, [errorMessage, errorAnnouncementKey]);

  /**
   * Move o foco para avisos de persistência.
   */
  useEffect(() => {
    if (!storageWarning) {
      return;
    }

    storageWarningContainerRef.current?.focus({
      preventScroll: false,
    });
  }, [storageWarning, storageWarningKey]);

  /**
   * Move o foco para o estado vazio somente depois de uma
   * limpeza solicitada pela pessoa usuária.
   */
  useEffect(() => {
    if (
      messages.length !== 0 ||
      pendingMessage ||
      !shouldFocusEmptyConversationRef.current
    ) {
      return;
    }

    shouldFocusEmptyConversationRef.current = false;

    emptyConversationRef.current?.focus({
      preventScroll: false,
    });
  }, [messages.length, pendingMessage]);

  /**
   * Devolve o foco ao campo depois de uma resposta concluída.
   */
  useEffect(() => {
    if (
      isSending ||
      errorMessage ||
      storageWarning ||
      !shouldFocusQuestionRef.current
    ) {
      return;
    }

    shouldFocusQuestionRef.current = false;

    questionInputRef.current?.focus({
      preventScroll: false,
    });
  }, [isSending, errorMessage, storageWarning]);

  function showError(message: string): void {
    setErrorMessage(message);

    setErrorAnnouncementKey((currentKey) => currentKey + 1);
  }

  function showStorageWarning(message: string): void {
    setStorageWarning(message);

    setStorageWarningKey((currentKey) => currentKey + 1);
  }

  /**
   * Persiste a versão mais recente da conversa.
   *
   * Uma falha no localStorage não remove as mensagens já
   * apresentadas na interface.
   */
  function persistMessages(nextMessages: SavedChatMessage[]): void {
    try {
      saveChatMessages(simulation.id, nextMessages);

      setStorageWarning(null);
    } catch (error) {
      console.error("Falha ao salvar a conversa:", error);

      showStorageWarning(
        error instanceof ChatStorageError
          ? error.message
          : "A conversa está visível, mas não pôde ser salva neste navegador.",
      );
    }
  }

  /**
   * Envia uma pergunta e incorpora a resposta à conversa.
   *
   * Uma mensagem pendente é reaproveitada na opção de nova
   * tentativa, evitando perguntas duplicadas.
   */
  async function sendQuestion(
    questionToSend: string,
    messageToSend = createChatMessage("user", questionToSend),
  ): Promise<void> {
    if (isSending) {
      return;
    }

    setIsSending(true);
    setErrorMessage(null);
    setPendingMessage(messageToSend);

    try {
      const response = await requestFinancialChatAnswer(
        simulation,
        questionToSend,
        buildChatHistory(messages),
      );

      const assistantMessage = createChatMessage("assistant", response.answer);

      const nextMessages = [...messages, messageToSend, assistantMessage];

      setMessages(nextMessages);
      persistMessages(nextMessages);

      setPendingMessage(null);
      shouldFocusQuestionRef.current = true;
    } catch (error) {
      showError(getFriendlyErrorMessage(error));
    } finally {
      setIsSending(false);
    }
  }

  /**
   * Valida e envia a pergunta digitada.
   */
  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const normalizedQuestion = question.trim();

    if (normalizedQuestion.length < 2 || isSending) {
      return;
    }

    setQuestion("");

    void sendQuestion(normalizedQuestion);
  }

  /**
   * Enter envia a pergunta; Shift + Enter cria uma nova linha.
   */
  function handleQuestionKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
  ): void {
    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    ) {
      return;
    }

    event.preventDefault();

    if (isSending || question.trim().length < 2) {
      return;
    }

    event.currentTarget.form?.requestSubmit();
  }

  /**
   * Preenche o campo com uma pergunta sugerida e mantém o foco
   * no local em que o texto poderá ser editado.
   */
  function handleSuggestedQuestion(suggestedQuestion: string): void {
    setQuestion(suggestedQuestion);

    questionInputRef.current?.focus({
      preventScroll: false,
    });
  }

  /**
   * Tenta novamente a pergunta que falhou.
   */
  function handleRetry(): void {
    if (!pendingMessage || isSending) {
      return;
    }

    void sendQuestion(pendingMessage.content, pendingMessage);
  }

  /**
   * Remove somente as mensagens desta simulação.
   */
  function handleClearConversation(): void {
    if (messages.length === 0 || isSending) {
      return;
    }

    const shouldClear = window.confirm(
      "Deseja apagar todas as mensagens desta conversa? A simulação financeira será preservada.",
    );

    if (!shouldClear) {
      return;
    }

    try {
      clearChatMessages(simulation.id);

      shouldFocusEmptyConversationRef.current = true;

      setMessages([]);
      setPendingMessage(null);
      setQuestion("");
      setErrorMessage(null);
      setStorageWarning(null);
    } catch (error) {
      console.error("Falha ao limpar a conversa:", error);

      showStorageWarning("Não foi possível apagar a conversa neste navegador.");
    }
  }

  return (
    <div className="space-y-6">
      <Card padding="lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge variant="success">Educador Financeiro</Badge>

            <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
              Converse sobre sua meta
            </h1>

            <p className="mt-3 leading-7 text-[var(--color-text-muted)]">
              Tire dúvidas usando os dados da simulação de maneira educativa e
              contextualizada.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            <ButtonLink to={`/resultado/${simulation.id}`} variant="secondary">
              Voltar ao resultado
            </ButtonLink>

            {messages.length > 0 && (
              <Button
                variant="secondary"
                disabled={isSending}
                onClick={handleClearConversation}
              >
                Limpar conversa
              </Button>
            )}
          </div>
        </div>

        <section
          aria-label="Resumo da simulação"
          className="mt-6 grid gap-3 sm:grid-cols-3"
        >
          <Card variant="muted" padding="sm">
            <dl>
              <dt className="text-xs text-[var(--color-text-muted)]">Meta</dt>

              <dd className="mt-1 text-sm font-bold">
                {simulation.input.meta}
              </dd>
            </dl>
          </Card>

          <Card variant="muted" padding="sm">
            <dl>
              <dt className="text-xs text-[var(--color-text-muted)]">
                Valor da meta
              </dt>

              <dd className="mt-1 text-sm font-bold">
                {formatCurrency(simulation.input.custoDaMeta)}
              </dd>
            </dl>
          </Card>

          <Card variant="muted" padding="sm">
            <dl>
              <dt className="text-xs text-[var(--color-text-muted)]">Prazo</dt>

              <dd className="mt-1 text-sm font-bold">
                {simulation.input.prazoDesejadoEmMeses} meses
              </dd>
            </dl>
          </Card>
        </section>
      </Card>

      <Card padding="lg">
        <h2 id={conversationTitleId} className="sr-only">
          Conversa com o Educador Financeiro
        </h2>

        <div
          role="log"
          aria-labelledby={conversationTitleId}
          aria-live="polite"
          aria-relevant="additions text"
          aria-busy={isSending}
          className="max-h-[65vh] min-h-64 space-y-4 overflow-y-auto scroll-smooth pr-1"
        >
          {messages.length === 0 && !pendingMessage && (
            <div
              ref={emptyConversationRef}
              role="region"
              aria-label="Conversa vazia"
              tabIndex={-1}
              className="scroll-mt-24 rounded-2xl py-4 text-center outline-none"
            >
              <h3 className="text-lg font-semibold">
                O que você gostaria de entender?
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--color-text-muted)]">
                Você pode perguntar sobre orçamento, prazo, organização dos
                gastos, dívidas ou próximos passos para sua meta.
              </p>

              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {suggestedQuestions.map((suggestedQuestion) => (
                  <button
                    key={suggestedQuestion}
                    type="button"
                    className="min-h-11 rounded-full border border-[var(--color-border)] px-4 py-2 text-sm transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] motion-reduce:transition-none"
                    onClick={() => {
                      handleSuggestedQuestion(suggestedQuestion);
                    }}
                  >
                    {suggestedQuestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <ChatMessageBubble key={message.id} message={message} />
          ))}

          {pendingMessage && <ChatMessageBubble message={pendingMessage} />}

          {isSending && (
            <div className="flex justify-start">
              <div
                role="status"
                aria-label="Resposta em preparação"
                aria-live="polite"
                aria-busy="true"
                className="rounded-2xl rounded-bl-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-muted)]"
              >
                O Educador Financeiro está preparando a resposta...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} aria-hidden="true" />
        </div>

        {storageWarning && (
          <div
            ref={storageWarningContainerRef}
            tabIndex={-1}
            className="mt-6 scroll-mt-24 rounded-2xl outline-none"
          >
            <Alert
              key={storageWarningKey}
              title="A conversa não foi salva"
              variant="warning"
            >
              {storageWarning}
            </Alert>
          </div>
        )}

        {errorMessage && (
          <div
            ref={errorContainerRef}
            tabIndex={-1}
            className="mt-6 scroll-mt-24 rounded-2xl outline-none"
          >
            <Alert
              key={errorAnnouncementKey}
              title="Não foi possível responder"
              variant="danger"
            >
              <div className="space-y-3">
                <p>{errorMessage}</p>

                {pendingMessage && (
                  <Button
                    variant="secondary"
                    disabled={isSending}
                    onClick={handleRetry}
                  >
                    Tentar novamente
                  </Button>
                )}
              </div>
            </Alert>
          </div>
        )}

        <form
          aria-label="Enviar pergunta ao Educador Financeiro"
          className="mt-6 border-t border-[var(--color-border)] pt-6"
          onSubmit={handleSubmit}
        >
          <label
            htmlFor="financial-chat-question"
            className="text-sm font-semibold"
          >
            Sua pergunta
          </label>

          <textarea
            ref={questionInputRef}
            id="financial-chat-question"
            name="financialChatQuestion"
            rows={4}
            maxLength={600}
            value={question}
            disabled={isSending}
            aria-describedby={`${questionCounterId} ${questionInstructionsId}`}
            placeholder="Exemplo: como posso organizar melhor o valor que sobra por mês?"
            className="mt-2 w-full resize-y rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-focus-ring)]/20 disabled:cursor-not-allowed disabled:opacity-70 motion-reduce:transition-none"
            onChange={(event) => {
              setQuestion(event.target.value);
            }}
            onKeyDown={handleQuestionKeyDown}
          />

          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p
                id={questionCounterId}
                className="text-xs text-[var(--color-text-muted)]"
              >
                {question.length}/600 caracteres
              </p>

              <p
                id={questionInstructionsId}
                className="mt-1 text-xs text-[var(--color-text-muted)]"
              >
                Enter envia · Shift + Enter cria uma nova linha
              </p>
            </div>

            <Button
              type="submit"
              disabled={isSending || question.trim().length < 2}
              aria-busy={isSending}
            >
              {isSending ? "Enviando..." : "Enviar pergunta"}
            </Button>
          </div>
        </form>
      </Card>

      <p className="text-center text-xs leading-5 text-[var(--color-text-muted)]">
        As respostas possuem finalidade educativa e não substituem orientação
        financeira, contábil, jurídica ou profissional personalizada.
      </p>
    </div>
  );
}

/**
 * Página responsável por recuperar a simulação indicada na URL
 * e carregar a conversa correspondente.
 */
export function ChatPage() {
  const { simulationId } = useParams();

  const simulation = simulationId ? getSimulationById(simulationId) : null;

  if (!simulation) {
    return (
      <section className="py-4">
        <Card padding="lg" className="mx-auto max-w-2xl">
          <Badge variant="danger">Simulação não encontrada</Badge>

          <h1 className="mt-4 text-2xl font-bold tracking-tight">
            Não foi possível abrir esta conversa.
          </h1>

          <p className="mt-3 leading-7 text-[var(--color-text-muted)]">
            A simulação pode ter sido excluída ou o identificador informado não
            existe neste navegador.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <ButtonLink to="/simulacao">Criar simulação</ButtonLink>

            <ButtonLink to="/historico" variant="secondary">
              Ver histórico
            </ButtonLink>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section className="py-4">
      <div className="mx-auto max-w-3xl">
        <ChatConversation key={simulation.id} simulation={simulation} />
      </div>
    </section>
  );
}
