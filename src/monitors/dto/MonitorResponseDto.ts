import { z } from "zod";

export const MonitorResponseSchema = z.object({
    id: z.number().int(),
    name: z.string(),
    description: z.string().nullable(),
    parent: z.number().int().nullable(),
    type: z.enum(["http", "group"]),
    active: z.boolean(),
    // Uptime Kuma stores `url` as NULL for group monitors (no HTTP target).
    url: z.string().nullable().optional(),
    method: z.string().optional(),
    interval: z.number().int().optional(),
    retryInterval: z.number().int().optional(),
    resendInterval: z.number().int().optional(),
    maxretries: z.number().int().optional(),
    timeout: z.number().int().optional(),
    acceptedStatusCodes: z.array(z.string()).optional(),
    maxRedirects: z.number().int().optional(),
    keyword: z.string().nullable().optional(),
    invertKeyword: z.boolean().optional(),
    ignoreTls: z.boolean().optional(),
    upsideDown: z.boolean().optional(),
    notificationIds: z.array(z.number().int()).optional(),
    tagIds: z.array(z.number().int()).optional(),
    expiryNotification: z.boolean().optional(),
    domainExpiryNotification: z.boolean().optional(),
    cacheBust: z.boolean().optional(),
});

export type MonitorResponseDto = z.infer<typeof MonitorResponseSchema>;
