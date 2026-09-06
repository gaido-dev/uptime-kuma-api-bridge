import type { FastifyPluginAsyncZod } from "@fastify/type-provider-zod";
import { z } from "zod";

import { CreateTagSchema } from "../tags/dto/CreateTagDto.js";
import { UpdateTagSchema } from "../tags/dto/UpdateTagDto.js";
import type { TagService } from "../tags/TagService.js";

const TagResponseSchema = z.object({
    id: z.number().int(),
    name: z.string(),
    color: z.string(),
});

const TagIdParamsSchema = z.object({ id: z.coerce.number().int().positive() });

export function registerTagRoutes(tagService: TagService): FastifyPluginAsyncZod {
    return async (app) => {
        app.get(
            "/tags",
            {
                schema: {
                    tags: ["Tags"],
                    summary: "List tags",
                    response: { 200: z.array(TagResponseSchema) },
                },
            },
            async () => tagService.list(),
        );

        app.post(
            "/tags",
            {
                schema: {
                    tags: ["Tags"],
                    summary: "Create a tag",
                    body: CreateTagSchema,
                    response: { 201: TagResponseSchema },
                },
            },
            async (request, reply) => {
                const tag = await tagService.create(request.body);
                reply.status(201);
                return tag;
            },
        );

        app.put(
            "/tags/:id",
            {
                schema: {
                    tags: ["Tags"],
                    summary: "Update a tag's name/color",
                    params: TagIdParamsSchema,
                    body: UpdateTagSchema,
                    response: { 200: TagResponseSchema },
                },
            },
            async (request) => tagService.update(request.params.id, request.body),
        );

        app.delete(
            "/tags/:id",
            { schema: { tags: ["Tags"], summary: "Delete a tag", params: TagIdParamsSchema } },
            async (request, reply) => {
                await tagService.remove(request.params.id);
                reply.status(204);
            },
        );
    };
}
