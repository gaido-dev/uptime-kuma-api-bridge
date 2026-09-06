import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
    runtimeEnv: process.env,
    server: {
        PORT: z.coerce.number().int().positive().default(3050),
        HOST: z.string().default("0.0.0.0"),
        LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),

        BRIDGE_AUTH_TOKEN: z.string().min(16, "BRIDGE_AUTH_TOKEN must be at least 16 characters long"),

        UPTIME_KUMA_URL: z.url(),
        UPTIME_KUMA_SERVICE_USERNAME: z.string().min(1),
        UPTIME_KUMA_SERVICE_PASSWORD: z.string().min(1),
        UPTIME_KUMA_SOCKET_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
        UPTIME_KUMA_ACK_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
    },
});

export type Env = typeof env;
