import type { UptimeKumaMonitor, UptimeKumaMonitorPayload } from "../../uptime-kuma-client/types.js";
import type { CreateHttpMonitorDto } from "../dto/CreateHttpMonitorDto.js";
import type { MonitorResponseDto } from "../dto/MonitorResponseDto.js";
import type { UpdateHttpMonitorDto } from "../dto/UpdateHttpMonitorDto.js";

/**
 * Translates between the bridge's simplified REST DTOs and Uptime Kuma's native monitor
 * payload/response shape (`server/model/monitor.js: toJSON()`, `server/server.js: add`/`editMonitor`).
 *
 * `editMonitor` copies every field it knows about from the incoming payload onto the existing
 * bean unconditionally (see server.js:847-963) — omitting a field means overwriting it with
 * `undefined`. So `toEditPayload` always starts from the *current* monitor (fetched via
 * `getMonitor`, whose response shape already matches editMonitor's expected input almost
 * verbatim) and only overrides the fields present in the partial update DTO.
 */
export class HttpMonitorMapper {
    toCreatePayload(dto: CreateHttpMonitorDto): UptimeKumaMonitorPayload {
        return {
            name: dto.name,
            description: dto.description,
            parent: dto.parent,
            type: "http",
            active: dto.active,
            url: dto.url,
            method: dto.method,
            body: dto.body,
            headers: dto.headers ? JSON.stringify(dto.headers) : null,
            basic_auth_user: dto.basicAuth?.username ?? null,
            basic_auth_pass: dto.basicAuth?.password ?? null,
            bearer_token: dto.bearerToken,
            interval: dto.interval,
            retryInterval: dto.retryInterval ?? dto.interval,
            resendInterval: dto.resendInterval,
            maxretries: dto.retries,
            timeout: dto.timeout,
            accepted_statuscodes: dto.acceptedStatusCodes,
            maxredirects: dto.maxRedirects,
            keyword: dto.keyword,
            invertKeyword: dto.invertKeyword,
            ignoreTls: dto.ignoreTls,
            upsideDown: dto.upsideDown,
            expiryNotification: dto.expiryNotification,
            domainExpiryNotification: dto.domainExpiryNotification,
            cacheBust: dto.cacheBust,
            notificationIDList: this.toNotificationIDList(dto.notificationIds),
            conditions: [],
        };
    }

    toEditPayload(existing: UptimeKumaMonitor, dto: UpdateHttpMonitorDto): UptimeKumaMonitorPayload {
        const payload: UptimeKumaMonitorPayload = { ...existing, type: "http" };

        if (dto.name !== undefined) payload.name = dto.name;
        if (dto.description !== undefined) payload.description = dto.description;
        if (dto.parent !== undefined) payload.parent = dto.parent;
        if (dto.url !== undefined) payload.url = dto.url;
        if (dto.method !== undefined) payload.method = dto.method;
        if (dto.body !== undefined) payload.body = dto.body;
        if (dto.headers !== undefined) payload.headers = dto.headers ? JSON.stringify(dto.headers) : null;
        if (dto.basicAuth !== undefined) {
            payload.basic_auth_user = dto.basicAuth?.username ?? null;
            payload.basic_auth_pass = dto.basicAuth?.password ?? null;
        }
        if (dto.bearerToken !== undefined) payload.bearer_token = dto.bearerToken;
        if (dto.interval !== undefined) payload.interval = dto.interval;
        if (dto.retryInterval !== undefined) payload.retryInterval = dto.retryInterval;
        if (dto.resendInterval !== undefined) payload.resendInterval = dto.resendInterval;
        if (dto.retries !== undefined) payload.maxretries = dto.retries;
        if (dto.timeout !== undefined) payload.timeout = dto.timeout;
        if (dto.acceptedStatusCodes !== undefined) payload.accepted_statuscodes = dto.acceptedStatusCodes;
        if (dto.maxRedirects !== undefined) payload.maxredirects = dto.maxRedirects;
        if (dto.keyword !== undefined) payload.keyword = dto.keyword;
        if (dto.invertKeyword !== undefined) payload.invertKeyword = dto.invertKeyword;
        if (dto.ignoreTls !== undefined) payload.ignoreTls = dto.ignoreTls;
        if (dto.upsideDown !== undefined) payload.upsideDown = dto.upsideDown;
        if (dto.expiryNotification !== undefined) payload.expiryNotification = dto.expiryNotification;
        if (dto.domainExpiryNotification !== undefined) payload.domainExpiryNotification = dto.domainExpiryNotification;
        if (dto.cacheBust !== undefined) payload.cacheBust = dto.cacheBust;
        if (dto.notificationIds !== undefined)
            payload.notificationIDList = this.toNotificationIDList(dto.notificationIds);

        return payload;
    }

    toResponseDto(monitor: UptimeKumaMonitor): MonitorResponseDto {
        return {
            id: monitor.id,
            name: monitor.name,
            description: monitor.description ?? null,
            parent: monitor.parent,
            type: monitor.type,
            active: monitor.active,
            url: monitor.url,
            method: monitor.method,
            interval: monitor.interval,
            retryInterval: monitor.retryInterval,
            resendInterval: monitor.resendInterval,
            maxretries: monitor.maxretries,
            timeout: monitor.timeout,
            acceptedStatusCodes: monitor.accepted_statuscodes,
            maxRedirects: monitor.maxredirects,
            keyword: monitor.keyword,
            invertKeyword: monitor.invertKeyword,
            ignoreTls: monitor.ignoreTls,
            upsideDown: monitor.upsideDown,
            expiryNotification: monitor.expiryNotification,
            domainExpiryNotification: monitor.domainExpiryNotification,
            cacheBust: monitor.cacheBust,
            notificationIds: this.fromNotificationIDList(monitor.notificationIDList),
            tagIds: this.fromTagPayload(monitor.tags),
        };
    }

    private toNotificationIDList(ids: number[]): Record<string, boolean> {
        return Object.fromEntries(ids.map((id) => [String(id), true]));
    }

    private fromNotificationIDList(list: Record<string, boolean> | undefined): number[] {
        if (!list) return [];
        return Object.entries(list)
            .filter(([, enabled]) => enabled)
            .map(([id]) => Number(id));
    }

    /**
     * Tags are not part of the `add`/`editMonitor` payload (Uptime Kuma silently ignores a
     * `tags` field there, see server.js:743-963) — they're only readable here from
     * `getMonitor`/`getMonitorList`, and writable via the dedicated `addMonitorTag`/
     * `deleteMonitorTag` events driven from `MonitorService`.
     */
    fromTagPayload(tags: Array<{ tag_id: number; value?: string }> | undefined): number[] {
        if (!tags) return [];
        return tags.map((tag) => tag.tag_id);
    }
}
