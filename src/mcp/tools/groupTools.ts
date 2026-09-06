import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { CreateGroupSchema } from "../../groups/dto/CreateGroupDto.js";
import type { GroupService } from "../../groups/GroupService.js";
import type { Logger } from "../../logger.js";
import { toMcpErrorResult } from "../toMcpErrorResult.js";

export function registerGroupTools(server: McpServer, groupService: GroupService, logger: Logger): void {
    server.registerTool("groups_list", { description: "List Uptime Kuma monitor groups" }, async () => {
        try {
            const groups = await groupService.list();
            return { content: [{ type: "text", text: JSON.stringify(groups) }] };
        } catch (error) {
            return toMcpErrorResult(error, logger);
        }
    });

    server.registerTool(
        "groups_create",
        { description: "Create a new Uptime Kuma monitor group", inputSchema: CreateGroupSchema.shape },
        async (dto) => {
            try {
                const group = await groupService.create(dto);
                return { content: [{ type: "text", text: JSON.stringify(group) }] };
            } catch (error) {
                return toMcpErrorResult(error, logger);
            }
        },
    );
}
