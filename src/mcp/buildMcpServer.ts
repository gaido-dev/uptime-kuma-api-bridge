import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import type { GroupService } from "../groups/GroupService.js";
import type { Logger } from "../logger.js";
import type { MonitorService } from "../monitors/MonitorService.js";
import type { NotificationService } from "../notifications/NotificationService.js";
import type { TagService } from "../tags/TagService.js";
import { registerGroupTools } from "./tools/groupTools.js";
import { registerMonitorTools } from "./tools/monitorTools.js";
import { registerNotificationTools } from "./tools/notificationTools.js";
import { registerTagTools } from "./tools/tagTools.js";

export interface McpServices {
    monitorService: MonitorService;
    groupService: GroupService;
    notificationService: NotificationService;
    tagService: TagService;
}

/** Builds a fresh, stateless McpServer wired to the bridge's existing service layer. */
export function buildMcpServer(services: McpServices, logger: Logger): McpServer {
    const server = new McpServer({ name: "uptime-kuma-api-bridge", version: "1.0.0" });

    registerMonitorTools(server, services.monitorService, logger);
    registerGroupTools(server, services.groupService, logger);
    registerNotificationTools(server, services.notificationService, logger);
    registerTagTools(server, services.tagService, logger);

    return server;
}
