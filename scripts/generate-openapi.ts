import { writeFile } from "node:fs/promises";

/**
 * Generates openapi.json from the app's actual zod-derived Fastify schemas — this never
 * connects to a real Uptime Kuma instance, it only registers routes to introspect their
 * schemas. Env vars are set to placeholders below (imports are hoisted in ESM, so they must
 * be assigned before the dynamic `import()` calls that transitively load `config/env.ts`).
 */
async function main(): Promise<void> {
    process.env.PORT ??= "3050";
    process.env.HOST ??= "0.0.0.0";
    process.env.LOG_LEVEL ??= "silent";
    process.env.BRIDGE_AUTH_TOKEN ??= "generate-openapi-placeholder-token";
    process.env.UPTIME_KUMA_URL ??= "http://localhost:3001";
    process.env.UPTIME_KUMA_SERVICE_USERNAME ??= "placeholder";
    process.env.UPTIME_KUMA_SERVICE_PASSWORD ??= "placeholder";
    process.env.UPTIME_KUMA_SOCKET_TIMEOUT_MS ??= "10000";
    process.env.UPTIME_KUMA_ACK_TIMEOUT_MS ??= "10000";

    const { buildApp } = await import("../src/app.js");
    const { logger } = await import("../src/logger.js");
    const { UptimeKumaSocketClient } = await import("../src/uptime-kuma-client/UptimeKumaSocketClient.js");

    const client = new UptimeKumaSocketClient({
        url: process.env.UPTIME_KUMA_URL as string,
        username: process.env.UPTIME_KUMA_SERVICE_USERNAME as string,
        password: process.env.UPTIME_KUMA_SERVICE_PASSWORD as string,
        socketTimeoutMs: 10000,
        ackTimeoutMs: 10000,
        logger,
    });

    const app = buildApp(client);
    await app.ready();
    const spec = app.swagger();
    await writeFile("./openapi.json", JSON.stringify(spec, null, 2), "utf8");
    await app.close();
    await client.close();
    console.log("openapi.json written");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
