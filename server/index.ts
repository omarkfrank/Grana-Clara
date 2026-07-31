import "dotenv/config";

import {
  createServer,
  type IncomingMessage,
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
 * Porta padrão utilizada pela API local.
 */
const DEFAULT_API_PORT = 8787;

/**
 * Limite máximo para o corpo das requisições.
 *
 * O limite protege o servidor contra cargas excessivas e ainda
 * comporta os dados da simulação e o histórico controlado do chat.
 */
const MAX_BODY_SIZE = 64 * 1024;

/**
 * Erro especializado para problemas no corpo da requisição.
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
 * Recupera a porta configurada no ambiente.
 */
function getApiPort(): number {
  const configuredPort = Number(process.env.AI_API_PORT);

  if (Number.isInteger(configuredPort) && configuredPort > 0) {
    return configuredPort;
  }

  return DEFAULT_API_PORT;
}

/**
 * Envia uma resposta JSON padronizada.
 */
function sendJson(
  response: ServerResponse,
  statusCode: number,
  payload: unknown,
): void {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",

    "Cache-Control": "no-store",

    "X-Content-Type-Options": "nosniff",
  });

  response.end(JSON.stringify(payload));
}

/**
 * Lê e interpreta o corpo JSON da requisição.
 */
function readJsonBody(request: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = "";
    let bodySize = 0;

    request.setEncoding("utf8");

    request.on("data", (chunk: string) => {
      bodySize += Buffer.byteLength(chunk);

      if (bodySize > MAX_BODY_SIZE) {
        reject(
          new RequestBodyError(
            "O corpo da requisição excedeu o limite permitido.",
            413,
          ),
        );

        request.destroy();

        return;
      }

      body += chunk;
    });

    request.on("end", () => {
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

    request.on("error", reject);
  });
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
 * Registra o erro técnico sem expor a API key ou o conteúdo
 * completo da requisição.
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

  console.error(context, error);
}

/**
 * Trata erros comuns da integração com o Gemini.
 *
 * Retorna true quando uma resposta já tiver sido enviada.
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

  if (apiStatus === 503) {
    sendJson(response, 503, {
      error:
        "O educador financeiro está temporariamente ocupado. Tente novamente em instantes.",
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

  if (method === "GET" && requestUrl.pathname === "/api/health") {
    sendJson(response, 200, {
      status: "ok",
      service: "grana-clara-api",
    });

    return;
  }

  if (method === "POST" && requestUrl.pathname === "/api/ai/insights") {
    await handleGenerateInsights(request, response);

    return;
  }

  if (method === "POST" && requestUrl.pathname === "/api/ai/chat") {
    await handleFinancialChat(request, response);

    return;
  }

  sendJson(response, 404, {
    error: "Rota não encontrada.",
  });
});

const apiPort = getApiPort();

server.listen(apiPort, "127.0.0.1", () => {
  console.log(`API do Grana Clara executando em http://127.0.0.1:${apiPort}`);
});

/**
 * Encerra o servidor de maneira controlada.
 */
function shutdown(): void {
  server.close(() => {
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);

process.on("SIGTERM", shutdown);
