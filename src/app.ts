import fastifyHelmet from "@fastify/helmet";
import fastifySensible from "@fastify/sensible";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import { jsonSchemaTransform, serializerCompiler, validatorCompiler } from "@fastify/type-provider-zod";
import Fastify, { type FastifyInstance } from "fastify";

import { bridgeAuthPlugin } from "./auth/bridgeAuthPlugin.js";
import { env } from "./config/env.js";
import { registerErrorHandler } from "./errors/errorHandler.js";
import { GroupService } from "./groups/GroupService.js";
import { logger, loggerOptions } from "./logger.js";
import { registerMcpRoute } from "./mcp/registerMcpRoute.js";
import { MonitorService } from "./monitors/MonitorService.js";
import { NotificationService } from "./notifications/NotificationService.js";
import { registerGroupRoutes } from "./routes/groups.routes.js";
import { registerHealthRoutes } from "./routes/health.routes.js";
import { registerMonitorRoutes } from "./routes/monitors.routes.js";
import { registerNotificationRoutes } from "./routes/notifications.routes.js";
import { registerTagRoutes } from "./routes/tags.routes.js";
import { TagService } from "./tags/TagService.js";
import type { UptimeKumaSocketClient } from "./uptime-kuma-client/UptimeKumaSocketClient.js";

export function buildApp(client: UptimeKumaSocketClient): FastifyInstance {
    const app = Fastify({ logger: loggerOptions });

    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    registerErrorHandler(app);

    app.register(fastifyHelmet);
    app.register(fastifySensible);

    app.register(fastifySwagger, {
        openapi: {
            info: {
                title: "Uptime Kuma API Bridge",
                version: "1.0.0",
                description:
                    "Private REST bridge to provision and synchronize Uptime Kuma monitors. " +
                    "Every request (except /health and /ready) requires `Authorization: Bearer <BRIDGE_AUTH_TOKEN>`.",
            },
            servers: [
                {
                    url: "{baseUrl}",
                    variables: { baseUrl: { default: `http://localhost:${env.PORT}` } },
                },
            ],
            tags: [
                { name: "Monitors", description: "HTTP(S) monitor CRUD, pause/resume" },
                { name: "Groups", description: "Monitor groups (folders)" },
                { name: "Notifications", description: "Read-only, to look up notification IDs" },
                { name: "Tags", description: "Monitor tags" },
                { name: "Health", description: "Liveness/readiness probes, no auth required" },
            ],
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: "http",
                        scheme: "bearer",
                        description:
                            "Bridge's own static token (BRIDGE_AUTH_TOKEN), unrelated to Uptime Kuma accounts.",
                    },
                },
            },
            security: [{ bearerAuth: [] }],
        },
        transform: jsonSchemaTransform,
    });
    app.register(fastifySwaggerUi, { routePrefix: "/docs" });

    app.register(bridgeAuthPlugin, { authToken: env.BRIDGE_AUTH_TOKEN });

    app.register(registerHealthRoutes(client));

    const monitorService = new MonitorService(client);
    const groupService = new GroupService(client, monitorService);
    const notificationService = new NotificationService(client);
    const tagService = new TagService(client);

    app.register(registerMonitorRoutes(monitorService), { prefix: "/api/v1" });
    app.register(registerGroupRoutes(groupService), { prefix: "/api/v1" });
    app.register(registerNotificationRoutes(notificationService), { prefix: "/api/v1" });
    app.register(registerTagRoutes(tagService), { prefix: "/api/v1" });

    app.register(registerMcpRoute({ monitorService, groupService, notificationService, tagService }, logger));

    return app;
}
