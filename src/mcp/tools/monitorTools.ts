import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { CreateHttpMonitorSchema } from "../../monitors/dto/CreateHttpMonitorDto.js";
import { UpdateHttpMonitorSchema } from "../../monitors/dto/UpdateHttpMonitorDto.js";
import type { MonitorService } from "../../monitors/MonitorService.js";
import type { Logger } from "../../logger.js";
import { toMcpErrorResult } from "../toMcpErrorResult.js";

const MonitorIdShape = { id: z.number().int().positive() };

export function registerMonitorTools(server: McpServer, monitorService: MonitorService, logger: Logger): void {
    server.registerTool(
        "monitors_list",
        {
            description: "List Uptime Kuma monitors, optionally filtered by type",
            inputSchema: { type: z.enum(["http", "group"]).optional() },
        },
        async ({ type }) => {
            try {
                const monitors = await monitorService.list(type);
                return { content: [{ type: "text", text: JSON.stringify(monitors) }] };
            } catch (error) {
                return toMcpErrorResult(error, logger);
            }
        },
    );

    server.registerTool(
        "monitors_get",
        { description: "Get a single Uptime Kuma monitor by id", inputSchema: MonitorIdShape },
        async ({ id }) => {
            try {
                const monitor = await monitorService.get(id);
                return { content: [{ type: "text", text: JSON.stringify(monitor) }] };
            } catch (error) {
                return toMcpErrorResult(error, logger);
            }
        },
    );

    server.registerTool(
        "monitors_create",
        { description: "Create a new HTTP(S) Uptime Kuma monitor", inputSchema: CreateHttpMonitorSchema.shape },
        async (dto) => {
            try {
                const monitor = await monitorService.create(dto);
                return { content: [{ type: "text", text: JSON.stringify(monitor) }] };
            } catch (error) {
                return toMcpErrorResult(error, logger);
            }
        },
    );

    server.registerTool(
        "monitors_update",
        {
            description: "Partially update an existing Uptime Kuma monitor",
            inputSchema: { id: z.number().int().positive(), ...UpdateHttpMonitorSchema.shape },
        },
        async ({ id, ...dto }) => {
            try {
                const monitor = await monitorService.update(id, dto);
                return { content: [{ type: "text", text: JSON.stringify(monitor) }] };
            } catch (error) {
                return toMcpErrorResult(error, logger);
            }
        },
    );

    server.registerTool(
        "monitors_pause",
        { description: "Pause an Uptime Kuma monitor", inputSchema: MonitorIdShape },
        async ({ id }) => {
            try {
                await monitorService.pause(id);
                return { content: [{ type: "text", text: "ok" }] };
            } catch (error) {
                return toMcpErrorResult(error, logger);
            }
        },
    );

    server.registerTool(
        "monitors_resume",
        { description: "Resume a paused Uptime Kuma monitor", inputSchema: MonitorIdShape },
        async ({ id }) => {
            try {
                await monitorService.resume(id);
                return { content: [{ type: "text", text: "ok" }] };
            } catch (error) {
                return toMcpErrorResult(error, logger);
            }
        },
    );

    server.registerTool(
        "monitors_delete",
        {
            description: "Delete an Uptime Kuma monitor",
            inputSchema: { id: z.number().int().positive(), deleteChildren: z.boolean().default(false) },
        },
        async ({ id, deleteChildren }) => {
            try {
                await monitorService.remove(id, deleteChildren);
                return { content: [{ type: "text", text: "ok" }] };
            } catch (error) {
                return toMcpErrorResult(error, logger);
            }
        },
    );

    server.registerTool(
        "monitors_heartbeats",
        {
            description: "Raw heartbeat history for a monitor over the last N hours",
            inputSchema: { id: z.number().int().positive(), period: z.number().int().positive().default(24) },
        },
        async ({ id, period }) => {
            try {
                const heartbeats = await monitorService.getHeartbeats(id, period);
                return { content: [{ type: "text", text: JSON.stringify(heartbeats) }] };
            } catch (error) {
                return toMcpErrorResult(error, logger);
            }
        },
    );

    server.registerTool(
        "monitors_chart",
        {
            description: "Bucketed up/down/ping chart data for a monitor over the last N hours",
            inputSchema: { id: z.number().int().positive(), period: z.number().int().positive().default(24) },
        },
        async ({ id, period }) => {
            try {
                const buckets = await monitorService.getChartData(id, period);
                return { content: [{ type: "text", text: JSON.stringify(buckets) }] };
            } catch (error) {
                return toMcpErrorResult(error, logger);
            }
        },
    );

    server.registerTool(
        "monitors_important_events",
        {
            description: "Paginated incident/state-change history for a monitor",
            inputSchema: {
                id: z.number().int().positive(),
                offset: z.number().int().min(0).default(0),
                count: z.number().int().positive().max(100).default(25),
            },
        },
        async ({ id, offset, count }) => {
            try {
                const result = await monitorService.getImportantEvents(id, offset, count);
                return { content: [{ type: "text", text: JSON.stringify(result) }] };
            } catch (error) {
                return toMcpErrorResult(error, logger);
            }
        },
    );

    server.registerTool(
        "monitors_stats",
        {
            description: "Uptime %, average ping, and cert/domain expiry for a monitor",
            inputSchema: MonitorIdShape,
        },
        async ({ id }) => {
            try {
                const stats = await monitorService.getStats(id);
                return { content: [{ type: "text", text: JSON.stringify(stats) }] };
            } catch (error) {
                return toMcpErrorResult(error, logger);
            }
        },
    );
}
