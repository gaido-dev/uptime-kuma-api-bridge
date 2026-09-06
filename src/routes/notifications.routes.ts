import type { FastifyPluginAsyncZod } from "@fastify/type-provider-zod";
import { z } from "zod";

import type { NotificationService } from "../notifications/NotificationService.js";

const NotificationResponseSchema = z.object({
    id: z.number().int(),
    name: z.string(),
    active: z.boolean(),
    isDefault: z.boolean(),
});

export function registerNotificationRoutes(notificationService: NotificationService): FastifyPluginAsyncZod {
    return async (app) => {
        app.get(
            "/notifications",
            {
                schema: {
                    tags: ["Notifications"],
                    summary: "List notifications (for their IDs)",
                    response: { 200: z.array(NotificationResponseSchema) },
                },
            },
            async () => notificationService.list(),
        );
    };
}
