import "dotenv/config";

import {
  createServer,
  type IncomingMessage,
  type OutgoingHttpHeaders,
  type ServerResponse,
} from "node:http";

import { financialChatRequestSchema } from "./schemas/financialChatRequestSchema.js";
import { financialInsightsRequestSchema } from "./schemas/financialInsightsRequestSchema.js";
import { generateFinancialChatAnswer } from "./services/geminiChatService.js";
import {
  generateFinancialInsights,
  GeminiConfigurationError,
  GeminiResponseError,
} from "./services/geminiInsightsService.js";

/**
 * Configurações padrão da API.
 *
 * Todas podem ser sobrescritas por variáveis de ambiente,
 * com exceção dos timeouts internos de segurança.
 */
const DEFAULT_API_HOST = "127.0.0.1";

const DEFAULT_API_PORT = 8787;

const DEFAULT_MAX_BODY_SIZE_BYTES = 64 * 1024;

const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;

const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 20;

const MIN_BODY_SIZE_BYTES = 1_024;

const MAX_BODY_SIZE_BYTES = 1024 * 1024;

const REQUEST_TIMEOUT_MS = 15_000;

const HEADERS_TIMEOUT_MS = 10_000;

const KEEP_ALIVE_TIMEOUT_MS = 5_000;

const FORCED_SHUTDOWN_TIMEOUT_MS = 10_000;

/**
 * Caminhos atendidos pela API.
 */
const HEALTH_PATH = "/api/health";

const INSIGHTS_PATH = "/api/ai/insights";

const CHAT_PATH = "/api/ai/chat";

/**
 * Recupera uma variável numérica positiva.
 *
 * Valores ausentes ou inválidos são substituídos pelo valor
 * padrão sem registrar seu conteúdo no terminal.
 */
function readPositiveIntegerEnvironmentVariable(
  variableName: string,
  defaultValue: number,
  minimumValue: number,
  maximumValue: number,
): number {
  const rawValue = process.env[variableName]?.trim();

  if (!rawValue) {
    return defaultValue;
  }

  const parsedValue = Number(rawValue);

  if (
    !Number.isInteger(parsedValue) ||
    parsedValue < minimumValue ||
    parsedValue > maximumValue
  ) {
    console.warn(
      `A variável ${variableName} possui um valor inválido. O valor padrão será utilizado.`,
    );

    return defaultValue;
  }

  return parsedValue;
}

/**
 * Endereço em que o servidor aceitará conexões.
 */
const apiHost = process.env.AI_API_HOST?.trim() || DEFAULT_API_HOST;

/**
 * Porta configurada para a API.
 */
const apiPort = readPositiveIntegerEnvironmentVariable(
  "AI_API_PORT",
  DEFAULT_API_PORT,
  1,
  65_535,
);

/**
 * Limite máximo permitido para o corpo das requisições.
 */
const maxBodySizeBytes = readPositiveIntegerEnvironmentVariable(
  "AI_MAX_BODY_SIZE_BYTES",
  DEFAULT_MAX_BODY_SIZE_BYTES,
  MIN_BODY_SIZE_BYTES,
  MAX_BODY_SIZE_BYTES,
);

/**
 * Configuração da limitação de requisições.
 */
const rateLimitWindowMs = readPositiveIntegerEnvironmentVariable(
  "AI_RATE_LIMIT_WINDOW_MS",
  DEFAULT_RATE_LIMIT_WINDOW_MS,
  1_000,
  60 * 60 * 1_000,
);

const rateLimitMaxRequests = readPositiveIntegerEnvironmentVariable(
  "AI_RATE_LIMIT_MAX_REQUESTS",
  DEFAULT_RATE_LIMIT_MAX_REQUESTS,
  1,
  1_000,
);

/**
 * Erro especializado para falhas relacionadas ao corpo HTTP.
 */
class RequestBodyError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);

    this.name = "RequestBodyError";

    this.statusCode = statusCode;
  }
}

/**
 * Registro interno utilizado pelo limitador de requisições.
 */
type RateLimitRecord = {
  count: number;
  resetAt: number;
};

/**
 * O limitador permanece em memória porque esta API atualmente
 * utiliza uma única instância local.
 *
 * Em um ambiente distribuído, a limitação também deverá ser
 * configurada no proxy, gateway ou provedor de hospedagem.
 */
const rateLimitRecords = new Map<string, RateLimitRecord>();

/**
 * Envia uma resposta JSON padronizada.
 */
function sendJson(
  response: ServerResponse,
  statusCode: number,
  payload: unknown,
  additionalHeaders: OutgoingHttpHeaders = {},
): void {
  const responseBody = JSON.stringify(payload);

  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",

    "Content-Length": Buffer.byteLength(responseBody),

    "Cache-Control": "no-store",

    "X-Content-Type-Options": "nosniff",

    "X-Frame-Options": "DENY",

    "Referrer-Policy": "no-referrer",

    "Cross-Origin-Resource-Policy": "same-origin",

    "Content-Security-Policy":
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",

    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",

    ...additionalHeaders,
  });

  response.end(responseBody);
}

/**
 * Responde a tentativas de utilizar um método não permitido.
 */
function sendMethodNotAllowed(
  response: ServerResponse,
  allowedMethods: string[],
): void {
  sendJson(
    response,
    405,
    {
      error: "Método HTTP não permitido para esta rota.",
    },
    {
      Allow: allowedMethods.join(", "),
    },
  );
}

/**
 * Verifica se a requisição declara um corpo JSON.
 */
function isJsonRequest(request: IncomingMessage): boolean {
  const contentTypeHeader = request.headers["content-type"];

  const contentType = Array.isArray(contentTypeHeader)
    ? contentTypeHeader[0]
    : contentTypeHeader;

  if (!contentType) {
    return false;
  }

  const mediaType = contentType.split(";")[0]?.trim().toLowerCase();

  return (
    mediaType === "application/json" || Boolean(mediaType?.endsWith("+json"))
  );
}

/**
 * Recupera o tamanho declarado pelo cliente.
 */
function getDeclaredContentLength(request: IncomingMessage): number | null {
  const contentLengthHeader = request.headers["content-length"];

  const contentLengthValue = Array.isArray(contentLengthHeader)
    ? contentLengthHeader[0]
    : contentLengthHeader;

  if (!contentLengthValue) {
    return null;
  }

  const contentLength = Number(contentLengthValue);

  if (!Number.isFinite(contentLength) || contentLength < 0) {
    return null;
  }

  return contentLength;
}

/**
 * Lê e interpreta o corpo JSON da requisição.
 *
 * A verificação é realizada tanto pelo Content-Length quanto
 * pelo número efetivo de bytes recebidos.
 */
function readJsonBody(request: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const declaredContentLength = getDeclaredContentLength(request);

    if (
      declaredContentLength !== null &&
      declaredContentLength > maxBodySizeBytes
    ) {
      request.resume();

      reject(
        new RequestBodyError(
          "O corpo da requisição excedeu o limite permitido.",
          413,
        ),
      );

      return;
    }

    let body = "";

    let bodySize = 0;

    let settled = false;

    request.setEncoding("utf8");

    /**
     * Rejeita a leitura apenas uma vez.
     */
    function rejectOnce(error: Error): void {
      if (settled) {
        return;
      }

      settled = true;

      reject(error);
    }

    /**
     * Processa cada fragmento recebido.
     */
    function handleData(chunk: string): void {
      if (settled) {
        return;
      }

      bodySize += Buffer.byteLength(chunk, "utf8");

      if (bodySize > maxBodySizeBytes) {
        request.off("data", handleData);

        /**
         * Continua drenando a requisição sem armazenar novos
         * dados, permitindo que a resposta 413 seja enviada.
         */
        request.resume();

        rejectOnce(
          new RequestBodyError(
            "O corpo da requisição excedeu o limite permitido.",
            413,
          ),
        );

        return;
      }

      body += chunk;
    }

    request.on("data", handleData);

    request.on("end", () => {
      if (settled) {
        return;
      }

      settled = true;

      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(
          new RequestBodyError(
            "O corpo da requisição não contém um JSON válido.",
            400,
          ),
        );
      }
    });

    request.on("aborted", () => {
      rejectOnce(
        new RequestBodyError(
          "A requisição foi interrompida antes de ser concluída.",
          400,
        ),
      );
    });

    request.on("error", () => {
      rejectOnce(
        new RequestBodyError(
          "Não foi possível ler o corpo da requisição.",
          400,
        ),
      );
    });
  });
}

/**
 * Remove registros expirados quando o mapa cresce.
 */
function cleanupExpiredRateLimitRecords(currentTime: number): void {
  if (rateLimitRecords.size < 1_000) {
    return;
  }

  for (const [clientIdentifier, record] of rateLimitRecords) {
    if (record.resetAt <= currentTime) {
      rateLimitRecords.delete(clientIdentifier);
    }
  }
}

/**
 * Recupera o identificador local do cliente.
 *
 * Não confiamos automaticamente em X-Forwarded-For, pois esse
 * cabeçalho pode ser falsificado quando não há um proxy confiável.
 */
function getClientIdentifier(request: IncomingMessage): string {
  return request.socket.remoteAddress || "unknown-client";
}

/**
 * Aplica uma limitação básica aos endpoints que consomem IA.
 */
function consumeAiRateLimit(
  request: IncomingMessage,
  response: ServerResponse,
): boolean {
  const currentTime = Date.now();

  cleanupExpiredRateLimitRecords(currentTime);

  const clientIdentifier = getClientIdentifier(request);

  let record = rateLimitRecords.get(clientIdentifier);

  if (!record || record.resetAt <= currentTime) {
    record = {
      count: 0,

      resetAt: currentTime + rateLimitWindowMs,
    };

    rateLimitRecords.set(clientIdentifier, record);
  }

  record.count += 1;

  const remainingRequests = Math.max(0, rateLimitMaxRequests - record.count);

  const secondsUntilReset = Math.max(
    1,
    Math.ceil((record.resetAt - currentTime) / 1_000),
  );

  response.setHeader("RateLimit-Limit", rateLimitMaxRequests);

  response.setHeader("RateLimit-Remaining", remainingRequests);

  response.setHeader("RateLimit-Reset", secondsUntilReset);

  if (record.count <= rateLimitMaxRequests) {
    return true;
  }

  sendJson(
    response,
    429,
    {
      error:
        "Muitas solicitações foram realizadas. Aguarde alguns instantes e tente novamente.",
    },
    {
      "Retry-After": secondsUntilReset,
    },
  );

  return false;
}

/**
 * Valida os requisitos básicos de uma requisição destinada à IA.
 */
function prepareAiRequest(
  request: IncomingMessage,
  response: ServerResponse,
): boolean {
  if (!isJsonRequest(request)) {
    sendJson(response, 415, {
      error: "O conteúdo da requisição deve utilizar application/json.",
    });

    return false;
  }

  return consumeAiRateLimit(request, response);
}

/**
 * Recupera o status HTTP presente nos erros do SDK Gemini.
 */
function getApiErrorStatus(error: unknown): number | undefined {
  if (!(error instanceof Error)) {
    return undefined;
  }

  return (
    error as Error & {
      status?: number;
    }
  ).status;
}

/**
 * Registra somente informações técnicas controladas.
 *
 * A chave da API e o corpo completo da requisição nunca são
 * incluídos no log.
 */
function logApiError(context: string, error: unknown): void {
  if (error instanceof Error) {
    const apiError = error as Error & {
      status?: number;
      code?: string | number;
    };

    console.error(context, {
      name: apiError.name,

      message: apiError.message,

      status: apiError.status,

      code: apiError.code,
    });

    return;
  }

  console.error(context, "Erro desconhecido.");
}

/**
 * Trata erros comuns da integração com o Gemini.
 *
 * Retorna true quando uma resposta HTTP já tiver sido enviada.
 */
function sendGeminiErrorResponse(
  response: ServerResponse,
  error: unknown,
): boolean {
  if (error instanceof GeminiConfigurationError) {
    sendJson(response, 500, {
      error: "A integração com a IA não está configurada corretamente.",
    });

    return true;
  }

  if (error instanceof GeminiResponseError) {
    sendJson(response, 502, {
      error: "A IA retornou uma resposta que não pôde ser processada.",
    });

    return true;
  }

  const apiStatus = getApiErrorStatus(error);

  if (apiStatus === 429) {
    sendJson(response, 429, {
      error:
        "O limite temporário de solicitações à IA foi atingido. Tente novamente em instantes.",
    });

    return true;
  }

  if (
    apiStatus === 500 ||
    apiStatus === 502 ||
    apiStatus === 503 ||
    apiStatus === 504
  ) {
    sendJson(response, 503, {
      error:
        "O educador financeiro está temporariamente indisponível. Tente novamente em instantes.",
    });

    return true;
  }

  return false;
}

/**
 * Gera os insights financeiros iniciais.
 */
async function handleGenerateInsights(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  try {
    const requestBody = await readJsonBody(request);

    const validationResult =
      financialInsightsRequestSchema.safeParse(requestBody);

    if (!validationResult.success) {
      sendJson(response, 400, {
        error: "Os dados enviados para análise são inválidos.",

        details: validationResult.error.flatten(),
      });

      return;
    }

    const result = await generateFinancialInsights(validationResult.data);

    sendJson(response, 200, {
      ...result,

      promptVersion: validationResult.data.promptVersion,
    });
  } catch (error) {
    if (error instanceof RequestBodyError) {
      sendJson(response, error.statusCode, {
        error: error.message,
      });

      return;
    }

    logApiError("Falha ao gerar insights:", error);

    if (sendGeminiErrorResponse(response, error)) {
      return;
    }

    sendJson(response, 500, {
      error: "Não foi possível gerar os insights neste momento.",
    });
  }
}

/**
 * Responde a uma pergunta contextualizada sobre uma simulação.
 */
async function handleFinancialChat(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  try {
    const requestBody = await readJsonBody(request);

    const validationResult = financialChatRequestSchema.safeParse(requestBody);

    if (!validationResult.success) {
      sendJson(response, 400, {
        error: "Os dados enviados para o chat são inválidos.",

        details: validationResult.error.flatten(),
      });

      return;
    }

    const result = await generateFinancialChatAnswer(validationResult.data);

    sendJson(response, 200, result);
  } catch (error) {
    if (error instanceof RequestBodyError) {
      sendJson(response, error.statusCode, {
        error: error.message,
      });

      return;
    }

    logApiError("Falha ao responder no chat:", error);

    if (sendGeminiErrorResponse(response, error)) {
      return;
    }

    sendJson(response, 500, {
      error: "Não foi possível responder à pergunta neste momento.",
    });
  }
}

/**
 * Servidor HTTP da API interna do Grana Clara.
 */
const server = createServer(async (request, response) => {
  const method = request.method ?? "GET";

  const requestUrl = new URL(request.url ?? "/", "http://localhost");

  /**
   * Endpoint de saúde.
   */
  if (requestUrl.pathname === HEALTH_PATH) {
    if (method !== "GET") {
      sendMethodNotAllowed(response, ["GET"]);

      return;
    }

    sendJson(response, 200, {
      status: "ok",

      service: "grana-clara-api",
    });

    return;
  }

  /**
   * Endpoint de insights.
   */
  if (requestUrl.pathname === INSIGHTS_PATH) {
    if (method !== "POST") {
      sendMethodNotAllowed(response, ["POST"]);

      return;
    }

    if (!prepareAiRequest(request, response)) {
      return;
    }

    await handleGenerateInsights(request, response);

    return;
  }

  /**
   * Endpoint do chat.
   */
  if (requestUrl.pathname === CHAT_PATH) {
    if (method !== "POST") {
      sendMethodNotAllowed(response, ["POST"]);

      return;
    }

    if (!prepareAiRequest(request, response)) {
      return;
    }

    await handleFinancialChat(request, response);

    return;
  }

  sendJson(response, 404, {
    error: "Rota não encontrada.",
  });
});

/**
 * Reduz a exposição a conexões lentas ou cabeçalhos excessivos.
 */
server.requestTimeout = REQUEST_TIMEOUT_MS;

server.headersTimeout = HEADERS_TIMEOUT_MS;

server.keepAliveTimeout = KEEP_ALIVE_TIMEOUT_MS;

server.maxHeadersCount = 50;

/**
 * Responde de maneira controlada a requisições HTTP malformadas.
 */
server.on("clientError", (_error, socket) => {
  if (!socket.writable) {
    return;
  }

  socket.end(
    "HTTP/1.1 400 Bad Request\r\n" +
      "Connection: close\r\n" +
      "Content-Length: 0\r\n" +
      "\r\n",
  );
});

/**
 * Registra falhas de inicialização sem exibir variáveis de ambiente.
 */
server.on("error", (error) => {
  console.error("Não foi possível iniciar a API do Grana Clara:", {
    name: error.name,

    message: error.message,
  });

  process.exitCode = 1;
});

server.listen(apiPort, apiHost, () => {
  console.log(`API do Grana Clara executando em http://${apiHost}:${apiPort}`);
});

/**
 * Evita que o encerramento seja processado mais de uma vez.
 */
let isShuttingDown = false;

/**
 * Encerra o servidor de maneira controlada.
 */
function shutdown(signal: string): void {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  console.log(`${signal} recebido. Encerrando a API do Grana Clara...`);

  const forcedShutdownTimer = setTimeout(() => {
    console.error(
      "O tempo limite de encerramento foi atingido. As conexões restantes serão finalizadas.",
    );

    server.closeAllConnections();

    process.exitCode = 1;
  }, FORCED_SHUTDOWN_TIMEOUT_MS);

  forcedShutdownTimer.unref();

  server.close((error) => {
    clearTimeout(forcedShutdownTimer);

    if (error) {
      console.error("A API não pôde ser encerrada corretamente:", {
        name: error.name,

        message: error.message,
      });

      process.exitCode = 1;

      return;
    }

    console.log("API do Grana Clara encerrada com segurança.");
  });
}

process.once("SIGINT", () => {
  shutdown("SIGINT");
});

process.once("SIGTERM", () => {
  shutdown("SIGTERM");
});
