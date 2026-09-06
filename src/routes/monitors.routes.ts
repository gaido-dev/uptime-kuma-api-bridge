import type { FastifyPluginAsyncZod } from "@fastify/type-provider-zod";
import { z } from "zod";

import { ChartBucketSchema } from "../monitors/dto/ChartBucketDto.js";
import { CreateHttpMonitorSchema } from "../monitors/dto/CreateHttpMonitorDto.js";
import { HeartbeatSchema } from "../monitors/dto/HeartbeatDto.js";
import { ImportantEventsResponseSchema } from "../monitors/dto/ImportantEventsResponseDto.js";
import { MonitorResponseSchema } from "../monitors/dto/MonitorResponseDto.js";
import { MonitorStatsSchema } from "../monitors/dto/MonitorStatsDto.js";
import { UpdateHttpMonitorSchema } from "../monitors/dto/UpdateHttpMonitorDto.js";
import type { MonitorService } from "../monitors/MonitorService.js";

const MonitorIdParamsSchema = z.object({ id: z.coerce.number().int().positive() });

export function registerMonitorRoutes(monitorService: MonitorService): FastifyPluginAsyncZod {
    return async (app) => {
        app.get(
            "/monitors",
            {
                schema: {
                    tags: ["Monitors"],
                    summary: "List monitors",
                    querystring: z.object({ type: z.enum(["http", "group"]).optional() }),
                    response: { 200: z.array(MonitorResponseSchema) },
                },
            },
            async (request) => monitorService.list(request.query.type),
        );

        app.get(
            "/monitors/:id",
            {
                schema: {
                    tags: ["Monitors"],
                    summary: "Get a monitor",
                    params: MonitorIdParamsSchema,
                    response: { 200: MonitorResponseSchema },
                },
            },
            async (request) => monitorService.get(request.params.id),
        );

        app.post(
            "/monitors",
            {
                schema: {
                    tags: ["Monitors"],
                    summary: "Create an HTTP(S) monitor",
                    body: CreateHttpMonitorSchema,
                    response: { 201: MonitorResponseSchema },
                },
            },
            async (request, reply) => {
                const monitor = await monitorService.create(request.body);
                reply.status(201);
                return monitor;
            },
        );

        app.put(
            "/monitors/:id",
            {
                schema: {
                    tags: ["Monitors"],
                    summary: "Partially update a monitor",
                    params: MonitorIdParamsSchema,
                    body: UpdateHttpMonitorSchema,
                    response: { 200: MonitorResponseSchema },
                },
            },
            async (request) => monitorService.update(request.params.id, request.body),
        );

        app.patch(
            "/monitors/:id/pause",
            { schema: { tags: ["Monitors"], summary: "Pause a monitor", params: MonitorIdParamsSchema } },
            async (request, reply) => {
                await monitorService.pause(request.params.id);
                reply.status(204);
            },
        );

        app.patch(
            "/monitors/:id/resume",
            { schema: { tags: ["Monitors"], summary: "Resume a monitor", params: MonitorIdParamsSchema } },
            async (request, reply) => {
                await monitorService.resume(request.params.id);
                reply.status(204);
            },
        );

        app.delete(
            "/monitors/:id",
            {
                schema: {
                    tags: ["Monitors"],
                    summary: "Delete a monitor",
                    params: MonitorIdParamsSchema,
                    querystring: z.object({ deleteChildren: z.coerce.boolean().default(false) }),
                },
            },
            async (request, reply) => {
                await monitorService.remove(request.params.id, request.query.deleteChildren);
                reply.status(204);
            },
        );

        app.get(
            "/monitors/:id/heartbeats",
            {
                schema: {
                    tags: ["Monitors"],
                    summary: "Raw heartbeat history for a monitor",
                    params: MonitorIdParamsSchema,
                    querystring: z.object({ period: z.coerce.number().int().positive().default(24) }),
                    response: { 200: z.array(HeartbeatSchema) },
                },
            },
            async (request) => monitorService.getHeartbeats(request.params.id, request.query.period),
        );

        app.get(
            "/monitors/:id/chart",
            {
                schema: {
                    tags: ["Monitors"],
                    summary: "Bucketed up/down/ping chart data for a monitor",
                    params: MonitorIdParamsSchema,
                    querystring: z.object({ period: z.coerce.number().int().positive().default(24) }),
                    response: { 200: z.array(ChartBucketSchema) },
                },
            },
            async (request) => monitorService.getChartData(request.params.id, request.query.period),
        );

        app.get(
            "/monitors/:id/important-events",
            {
                schema: {
                    tags: ["Monitors"],
                    summary: "Paginated incident/state-change history for a monitor",
                    params: MonitorIdParamsSchema,
                    querystring: z.object({
                        offset: z.coerce.number().int().min(0).default(0),
                        count: z.coerce.number().int().positive().max(100).default(25),
                    }),
                    response: { 200: ImportantEventsResponseSchema },
                },
            },
            async (request) =>
                monitorService.getImportantEvents(request.params.id, request.query.offset, request.query.count),
        );

        app.get(
            "/monitors/:id/stats",
            {
                schema: {
                    tags: ["Monitors"],
                    summary: "Uptime %, average ping, and cert/domain expiry for a monitor",
                    params: MonitorIdParamsSchema,
                    response: { 200: MonitorStatsSchema },
                },
            },
            async (request) => monitorService.getStats(request.params.id),
        );
    };
}
