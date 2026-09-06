import { z } from "zod";

export const MonitorStatsSchema = z.object({
    uptime24h: z.number().nullable(),
    uptime30d: z.number().nullable(),
    uptime1y: z.number().nullable(),
    avgPing24h: z.number().nullable(),
    /**
     * Only populated once Uptime Kuma has pushed a `certInfo`/`domainInfo` event for this monitor
     * since the bridge connected (see `UptimeKumaSocketClient.getCertAndDomainInfo`) — null until
     * then, and always null for non-HTTPS monitors and groups.
     */
    certInfo: z.unknown().nullable(),
    domainDaysRemaining: z.number().nullable(),
    domainExpiresOn: z.string().nullable(),
});

export type MonitorStatsDto = z.infer<typeof MonitorStatsSchema>;
