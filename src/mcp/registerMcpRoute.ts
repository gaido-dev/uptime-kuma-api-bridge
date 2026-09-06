import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { FastifyPluginAsync } from "fastify";

import type { Logger } from "../logger.js";
import { buildMcpServer, type McpServices } from "./buildMcpServer.js";

/**
 * Exposes the bridge's service layer to LLM clients over MCP (Streamable HTTP, stateless mode).
 * Registered like any other route, so it inherits the global bearer-token preHandler from
 * `bridgeAuthPlugin` — no separate auth wiring needed here.
 */
export function registerMcpRoute(services: McpServices, logger: Logger): FastifyPluginAsync {
    return async (app) => {
        app.post("/mcp", async (request, reply) => {
            reply.hijack();

            const server = buildMcpServer(services, logger);
            const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

            reply.raw.on("close", () => {
                transport.close();
                server.close();
            });

            await server.connect(transport);
            await transport.handleRequest(request.raw, reply.raw, request.body);
        });
    };
}
