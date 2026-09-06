import { z } from "zod";

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as const;

/**
 * All fields optional and WITHOUT defaults: only the fields actually present in the request
 * are changed. Uptime Kuma's `editMonitor` event expects a full payload, so
 * `MonitorService.updateMonitor` fetches the current monitor first and merges this partial DTO
 * onto it (see `HttpMonitorMapper.toEditPayload`).
 *
 * This is deliberately NOT derived via `CreateHttpMonitorSchema.partial()`: zod still applies a
 * field's `.default()` when that field is absent from the input even on a partial schema, which
 * would silently reset every omitted field to its create-time default and clobber the monitor's
 * existing values.
 */
export const UpdateHttpMonitorSchema = z.object({
    name: z.string().min(1).optional(),
    url: z.url().optional(),
    parent: z.number().int().positive().nullable().optional(),
    description: z.string().nullable().optional(),
    method: z.enum(HTTP_METHODS).optional(),
    interval: z.number().int().min(20).optional(),
    retryInterval: z.number().int().min(20).optional(),
    resendInterval: z.number().int().min(0).optional(),
    retries: z.number().int().min(0).optional(),
    timeout: z.number().int().min(1).optional(),
    acceptedStatusCodes: z.array(z.string()).min(1).optional(),
    maxRedirects: z.number().int().min(0).optional(),
    keyword: z.string().nullable().optional(),
    invertKeyword: z.boolean().optional(),
    ignoreTls: z.boolean().optional(),
    upsideDown: z.boolean().optional(),
    body: z.string().nullable().optional(),
    headers: z.record(z.string(), z.string()).nullable().optional(),
    basicAuth: z.object({ username: z.string(), password: z.string() }).nullable().optional(),
    bearerToken: z.string().nullable().optional(),
    notificationIds: z.array(z.number().int().positive()).optional(),
    tagIds: z.array(z.number().int().positive()).optional(),
    expiryNotification: z.boolean().optional(),
    domainExpiryNotification: z.boolean().optional(),
    cacheBust: z.boolean().optional(),
});

export type UpdateHttpMonitorDto = z.infer<typeof UpdateHttpMonitorSchema>;
