import "dotenv/config";

import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";

import { financialInsightsRequestSchema } from "./schemas/financialInsightsRequestSchema.js";

import {
  generateFinancialInsights,
  GeminiConfigurationError,
  GeminiResponseError,
} from "./services/geminiInsightsService.js";

const DEFAULT_API_PORT = 8787;
const MAX_BODY_SIZE = 64 * 1024;

function getApiPort(): number {
  const configuredPort = Number(process.env.AI_API_PORT);

  if (Number.isInteger(configuredPort) && configuredPort > 0) {
    return configuredPort;
  }

  return DEFAULT_API_PORT;
}

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

function readJsonBody(request: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = "";
    let bodySize = 0;

    request.setEncoding("utf8");

    request.on("data", (chunk: string) => {
      bodySize += Buffer.byteLength(chunk);

      if (bodySize > MAX_BODY_SIZE) {
        reject(new Error("O corpo da requisição excedeu o limite permitido."));

        request.destroy();
        return;
      }

      body += chunk;
    });

    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("O corpo da requisição não contém um JSON válido."));
      }
    });

    request.on("error", reject);
  });
}

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
    if (error instanceof Error) {
      const apiError = error as Error & {
        status?: number;
        code?: string | number;
      };

      console.error("Falha ao gerar insights:", {
        name: apiError.name,
        message: apiError.message,
        status: apiError.status,
        code: apiError.code,
      });
    } else {
      console.error("Falha desconhecida ao gerar insights:", error);
    }

    if (error instanceof GeminiConfigurationError) {
      sendJson(response, 500, {
        error: "A integração com a IA não está configurada corretamente.",
      });

      return;
    }

    if (error instanceof GeminiResponseError) {
      sendJson(response, 502, {
        error: "A IA retornou uma resposta que não pôde ser processada.",
      });

      return;
    }

    sendJson(response, 500, {
      error: "Não foi possível gerar os insights neste momento.",
    });
  }
}

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

  sendJson(response, 404, {
    error: "Rota não encontrada.",
  });
});

const apiPort = getApiPort();

server.listen(apiPort, "127.0.0.1", () => {
  console.log(`API do Grana Clara executando em http://127.0.0.1:${apiPort}`);
});

function shutdown(): void {
  server.close(() => {
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
