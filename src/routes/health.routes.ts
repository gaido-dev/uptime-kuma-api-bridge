import type { FastifyPluginAsync } from "fastify";

import type { UptimeKumaSocketClient } from "../uptime-kuma-client/UptimeKumaSocketClient.js";

/**
 * Liveness/readiness probes, exempt from bearer token auth (see `config.public` in
 * `bridgeAuthPlugin`) so container/orchestrator health checks don't need credentials.
 */
export function registerHealthRoutes(client: UptimeKumaSocketClient): FastifyPluginAsync {
    return async (app) => {
        app.get(
            "/health",
            { config: { public: true }, schema: { tags: ["Health"], summary: "Liveness probe", security: [] } },
            async () => ({ status: "ok" }),
        );

        app.get(
            "/ready",
            { config: { public: true }, schema: { tags: ["Health"], summary: "Readiness probe", security: [] } },
            async (_request, reply) => {
                const ready = client.isReady();
                reply.status(ready ? 200 : 503);
                return { status: ready ? "ready" : "not-ready", uptimeKumaConnected: ready };
            },
        );
    };
}
