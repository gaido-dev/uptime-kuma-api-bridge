import type { FastifyPluginAsyncZod } from "@fastify/type-provider-zod";
import { z } from "zod";

import { CreateGroupSchema } from "../groups/dto/CreateGroupDto.js";
import type { GroupService } from "../groups/GroupService.js";
import { MonitorResponseSchema } from "../monitors/dto/MonitorResponseDto.js";

export function registerGroupRoutes(groupService: GroupService): FastifyPluginAsyncZod {
    return async (app) => {
        app.get(
            "/groups",
            { schema: { tags: ["Groups"], summary: "List groups", response: { 200: z.array(MonitorResponseSchema) } } },
            async () => groupService.list(),
        );

        app.post(
            "/groups",
            {
                schema: {
                    tags: ["Groups"],
                    summary: "Create a group",
                    body: CreateGroupSchema,
                    response: { 201: MonitorResponseSchema },
                },
            },
            async (request, reply) => {
                const group = await groupService.create(request.body);
                reply.status(201);
                return group;
            },
        );
    };
}
