import { hasZodFastifySchemaValidationErrors } from "@fastify/type-provider-zod";
import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { BridgeError } from "./BridgeError.js";

export function registerErrorHandler(app: FastifyInstance): void {
    app.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
        if (error instanceof BridgeError) {
            reply.status(error.httpStatus).send(error.toJSON());
            return;
        }

        if (hasZodFastifySchemaValidationErrors(error)) {
            reply.status(400).send({
                error: "VALIDATION_FAILED",
                message: "Request payload does not match the expected schema",
                details: error.validation,
            });
            return;
        }

        request.log.error({ err: error }, "Unhandled error");
        reply.status(error.statusCode ?? 500).send({
            error: "INTERNAL_ERROR",
            message: "An unexpected error occurred",
        });
    });
}
