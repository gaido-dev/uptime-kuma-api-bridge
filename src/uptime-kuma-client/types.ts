/**
 * Shapes mirroring Uptime Kuma's own socket.io payloads/acks.
 * Reference: uptime-kuma/server/server.js (events `add`, `editMonitor`, `getMonitor`,
 * `getMonitorList`, `pauseMonitor`, `resumeMonitor`, `deleteMonitor`), and
 * uptime-kuma/server/uptime-kuma-server.js (`sendMonitorList`, `sendNotificationList`).
 * Only the subset of ~90 monitor fields relevant to HTTP(S) monitors and groups is typed here.
 */

export type UptimeKumaMonitorType = "http" | "group";

/** The payload Uptime Kuma expects for `add` / `editMonitor` (HTTP(S) monitor or group). */
export interface UptimeKumaMonitorPayload {
    id?: number;
    name: string;
    description?: string | null;
    parent: number | null;
    type: UptimeKumaMonitorType;
    active: boolean;

    // HTTP(S)-only fields (ignored by Uptime Kuma for type "group")
    url?: string;
    method?: string;
    body?: string | null;
    headers?: string | null;
    basic_auth_user?: string | null;
    basic_auth_pass?: string | null;
    bearer_token?: string | null;
    interval?: number;
    retryInterval?: number;
    resendInterval?: number;
    maxretries?: number;
    timeout?: number;
    accepted_statuscodes?: string[];
    maxredirects?: number;
    keyword?: string | null;
    invertKeyword?: boolean;
    ignoreTls?: boolean;
    upsideDown?: boolean;
    expiryNotification?: boolean;
    domainExpiryNotification?: boolean;
    cacheBust?: boolean;
    notificationIDList?: Record<string, boolean>;
    tags?: Array<{ tag_id: number; value?: string }>;

    /**
     * The `monitor` table's `conditions` column is `NOT NULL DEFAULT '[]'`, but Uptime Kuma's
     * `add`/`editMonitor` handlers unconditionally do `monitor.conditions = JSON.stringify(monitor.conditions)`
     * before saving — an absent field becomes `JSON.stringify(undefined) === undefined`, which is
     * stored as an explicit NULL and violates the NOT NULL constraint. Must always be an array.
     */
    conditions?: unknown[];
}

/** The monitor shape returned by Uptime Kuma in `getMonitor` acks / `monitorList` broadcasts. */
export interface UptimeKumaMonitor extends UptimeKumaMonitorPayload {
    id: number;
}

export type UptimeKumaMonitorList = Record<string, UptimeKumaMonitor>;

export interface UptimeKumaNotification {
    id: number;
    name: string;
    active: boolean;
    isDefault: boolean;
    config: string;
}

export interface UptimeKumaTag {
    id: number;
    name: string;
    color: string;
}

/** Generic ack shape used by most Uptime Kuma socket.io event callbacks. */
export interface UptimeKumaAck {
    ok: boolean;
    msg?: string;
}

export interface UptimeKumaMonitorAck extends UptimeKumaAck {
    monitor?: UptimeKumaMonitor;
}

export interface UptimeKumaAddAck extends UptimeKumaAck {
    monitorID?: number;
}

export interface UptimeKumaLoginAck extends UptimeKumaAck {
    token?: string;
}

export interface UptimeKumaTagsAck extends UptimeKumaAck {
    tags?: UptimeKumaTag[];
}

export interface UptimeKumaTagAck extends UptimeKumaAck {
    tag?: UptimeKumaTag;
}

/** A single row of the `heartbeat` table, as returned by `getMonitorBeats` / `monitorImportantHeartbeatListPaged`. */
export interface UptimeKumaHeartbeat {
    id: number;
    monitor_id: number;
    status: number;
    time: string;
    msg: string | null;
    important: boolean;
    duration: number;
    ping: number | null;
    down_count: number;
}

export interface UptimeKumaHeartbeatsAck extends UptimeKumaAck {
    data?: UptimeKumaHeartbeat[];
}

export interface UptimeKumaImportantEventsAck extends UptimeKumaAck {
    data?: UptimeKumaHeartbeat[];
}

export interface UptimeKumaImportantEventsCountAck extends UptimeKumaAck {
    count?: number;
}

/** One bucket of `getMonitorChartData`, backed by Uptime Kuma's `UptimeCalculator` rollups. */
export interface UptimeKumaChartBucket {
    timestamp: number;
    up: number;
    down: number;
    avgPing: number | null;
    minPing: number | null;
    maxPing: number | null;
}

export interface UptimeKumaChartDataAck extends UptimeKumaAck {
    data?: UptimeKumaChartBucket[];
}
