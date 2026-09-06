import pino, { type LoggerOptions } from "pino";

import { env } from "./config/env.js";

export type Logger = pino.Logger;

export const loggerOptions: LoggerOptions = {
    level: env.LOG_LEVEL,
    transport:
        process.env.NODE_ENV === "production"
            ? undefined
            : { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname" } },
};

/** Standalone logger for use outside the Fastify request lifecycle (bootstrap, socket client). */
export const logger = pino(loggerOptions);
