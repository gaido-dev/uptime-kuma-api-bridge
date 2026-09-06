import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

import { UnauthorizedError } from "../errors/UnauthorizedError.js";
import { BridgeTokenAuthenticator } from "./BridgeTokenAuthenticator.js";

declare module "fastify" {
    interface FastifyContextConfig {
        /** Set on a route's `config` to skip bearer token verification (e.g. health checks). */
        public?: boolean;
    }
}

const BEARER_PREFIX = "Bearer ";

export interface BridgeAuthPluginOptions {
    authToken: string;
}

const plugin: FastifyPluginAsync<BridgeAuthPluginOptions> = async (
    app: FastifyInstance,
    opts: BridgeAuthPluginOptions,
) => {
    const authenticator = new BridgeTokenAuthenticator(opts.authToken);

    app.addHook("preHandler", async (request) => {
        // Swagger UI's own assets/spec fetches can't carry a bearer header from a plain browser
        // navigation, so /docs is exempt too. It only exposes route/schema shapes, not data.
        if (request.routeOptions.config?.public || request.url.startsWith("/docs")) {
            return;
        }

        const header = request.headers.authorization;
        const token = header?.startsWith(BEARER_PREFIX) ? header.slice(BEARER_PREFIX.length) : undefined;

        if (!authenticator.verify(token)) {
            throw new UnauthorizedError();
        }
    });
};

export const bridgeAuthPlugin = fp(plugin, { name: "bridge-auth" });
