import closeWithGrace from "close-with-grace";

import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./logger.js";
import { UptimeKumaSocketClient } from "./uptime-kuma-client/UptimeKumaSocketClient.js";

async function main(): Promise<void> {
    const client = new UptimeKumaSocketClient({
        url: env.UPTIME_KUMA_URL,
        username: env.UPTIME_KUMA_SERVICE_USERNAME,
        password: env.UPTIME_KUMA_SERVICE_PASSWORD,
        socketTimeoutMs: env.UPTIME_KUMA_SOCKET_TIMEOUT_MS,
        ackTimeoutMs: env.UPTIME_KUMA_ACK_TIMEOUT_MS,
        logger,
    });

    logger.info({ url: env.UPTIME_KUMA_URL }, "Connecting to Uptime Kuma...");
    await client.connect();
    logger.info("Connected to Uptime Kuma");

    const app = buildApp(client);
    await app.listen({ port: env.PORT, host: env.HOST });

    closeWithGrace({ delay: 5000 }, async ({ err }) => {
        if (err) {
            logger.error({ err }, "Shutting down due to unhandled error");
        } else {
            logger.info("Shutting down...");
        }
        await app.close();
        await client.close();
    });
}

main().catch((err: unknown) => {
    logger.error({ err }, "Failed to start uptime-kuma-api-bridge");
    process.exit(1);
});
