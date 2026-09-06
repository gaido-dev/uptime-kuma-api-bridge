import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import type { Logger } from "../../logger.js";
import type { NotificationService } from "../../notifications/NotificationService.js";
import { toMcpErrorResult } from "../toMcpErrorResult.js";

export function registerNotificationTools(
    server: McpServer,
    notificationService: NotificationService,
    logger: Logger,
): void {
    server.registerTool(
        "notifications_list",
        { description: "List Uptime Kuma notifications (to look up their ids)" },
        async () => {
            try {
                const notifications = notificationService.list();
                return { content: [{ type: "text", text: JSON.stringify(notifications) }] };
            } catch (error) {
                return toMcpErrorResult(error, logger);
            }
        },
    );
}
