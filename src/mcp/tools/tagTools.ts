import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import type { Logger } from "../../logger.js";
import { CreateTagSchema } from "../../tags/dto/CreateTagDto.js";
import { UpdateTagSchema } from "../../tags/dto/UpdateTagDto.js";
import type { TagService } from "../../tags/TagService.js";
import { toMcpErrorResult } from "../toMcpErrorResult.js";

export function registerTagTools(server: McpServer, tagService: TagService, logger: Logger): void {
    server.registerTool("tags_list", { description: "List Uptime Kuma monitor tags" }, async () => {
        try {
            const tags = await tagService.list();
            return { content: [{ type: "text", text: JSON.stringify(tags) }] };
        } catch (error) {
            return toMcpErrorResult(error, logger);
        }
    });

    server.registerTool(
        "tags_create",
        { description: "Create a new Uptime Kuma monitor tag", inputSchema: CreateTagSchema.shape },
        async (dto) => {
            try {
                const tag = await tagService.create(dto);
                return { content: [{ type: "text", text: JSON.stringify(tag) }] };
            } catch (error) {
                return toMcpErrorResult(error, logger);
            }
        },
    );

    server.registerTool(
        "tags_update",
        {
            description: "Update an Uptime Kuma monitor tag's name/color",
            inputSchema: { id: z.number().int().positive(), ...UpdateTagSchema.shape },
        },
        async ({ id, ...dto }) => {
            try {
                const tag = await tagService.update(id, dto);
                return { content: [{ type: "text", text: JSON.stringify(tag) }] };
            } catch (error) {
                return toMcpErrorResult(error, logger);
            }
        },
    );

    server.registerTool(
        "tags_delete",
        { description: "Delete an Uptime Kuma monitor tag", inputSchema: { id: z.number().int().positive() } },
        async ({ id }) => {
            try {
                await tagService.remove(id);
                return { content: [{ type: "text", text: "ok" }] };
            } catch (error) {
                return toMcpErrorResult(error, logger);
            }
        },
    );
}
