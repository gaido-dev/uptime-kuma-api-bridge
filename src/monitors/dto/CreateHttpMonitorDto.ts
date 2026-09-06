import { z } from "zod";

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as const;

export const CreateHttpMonitorSchema = z.object({
    name: z.string().min(1),
    url: z.url(),
    parent: z.number().int().positive().nullable().default(null),
    description: z.string().nullable().default(null),
    method: z.enum(HTTP_METHODS).default("GET"),
    interval: z.number().int().min(20).default(60),
    retryInterval: z.number().int().min(20).optional(),
    resendInterval: z.number().int().min(0).default(0),
    retries: z.number().int().min(0).default(0),
    timeout: z.number().int().min(1).default(48),
    acceptedStatusCodes: z.array(z.string()).min(1).default(["200-299"]),
    maxRedirects: z.number().int().min(0).default(10),
    keyword: z.string().nullable().default(null),
    invertKeyword: z.boolean().default(false),
    ignoreTls: z.boolean().default(false),
    upsideDown: z.boolean().default(false),
    body: z.string().nullable().default(null),
    headers: z.record(z.string(), z.string()).nullable().default(null),
    basicAuth: z.object({ username: z.string(), password: z.string() }).nullable().default(null),
    bearerToken: z.string().nullable().default(null),
    notificationIds: z.array(z.number().int().positive()).default([]),
    tagIds: z.array(z.number().int().positive()).default([]),
    expiryNotification: z.boolean().default(false),
    domainExpiryNotification: z.boolean().default(false),
    cacheBust: z.boolean().default(false),
    active: z.boolean().default(true),
});

export type CreateHttpMonitorDto = z.infer<typeof CreateHttpMonitorSchema>;
