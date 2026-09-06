import { NotFoundError } from "../errors/NotFoundError.js";
import { UpstreamRejectedError } from "../errors/UpstreamRejectedError.js";
import type {
    UptimeKumaAck,
    UptimeKumaAddAck,
    UptimeKumaChartBucket,
    UptimeKumaChartDataAck,
    UptimeKumaHeartbeat,
    UptimeKumaHeartbeatsAck,
    UptimeKumaImportantEventsAck,
    UptimeKumaImportantEventsCountAck,
    UptimeKumaMonitor,
    UptimeKumaMonitorAck,
    UptimeKumaMonitorList,
} from "../uptime-kuma-client/types.js";
import type { UptimeKumaSocketClient } from "../uptime-kuma-client/UptimeKumaSocketClient.js";
import type { ChartBucketDto } from "./dto/ChartBucketDto.js";
import type { CreateHttpMonitorDto } from "./dto/CreateHttpMonitorDto.js";
import type { HeartbeatDto } from "./dto/HeartbeatDto.js";
import type { ImportantEventsResponseDto } from "./dto/ImportantEventsResponseDto.js";
import type { MonitorResponseDto } from "./dto/MonitorResponseDto.js";
import type { MonitorStatsDto } from "./dto/MonitorStatsDto.js";
import type { UpdateHttpMonitorDto } from "./dto/UpdateHttpMonitorDto.js";
import { HttpMonitorMapper } from "./mapper/HttpMonitorMapper.js";

export class MonitorService {
    private readonly mapper = new HttpMonitorMapper();

    constructor(private readonly client: UptimeKumaSocketClient) {}

    async list(type?: "http" | "group"): Promise<MonitorResponseDto[]> {
        const list = await this.client
            .getEmitter()
            .emitAndAwaitBroadcast<UptimeKumaMonitorList>("getMonitorList", "monitorList");

        return Object.values(list)
            .filter((monitor) => !type || monitor.type === type)
            .map((monitor) => this.mapper.toResponseDto(monitor));
    }

    async get(id: number): Promise<MonitorResponseDto> {
        return this.mapper.toResponseDto(await this.getRaw(id));
    }

    async create(dto: CreateHttpMonitorDto): Promise<MonitorResponseDto> {
        const ack = await this.client
            .getEmitter()
            .emitWithAck<UptimeKumaAddAck>("add", this.mapper.toCreatePayload(dto));
        if (ack.monitorID === undefined) {
            throw new UpstreamRejectedError('Uptime Kuma did not return a monitor id for "add"');
        }
        await this.syncTags(ack.monitorID, [], dto.tagIds);
        return this.get(ack.monitorID);
    }

    async update(id: number, dto: UpdateHttpMonitorDto): Promise<MonitorResponseDto> {
        const existing = await this.getRaw(id);
        const payload = { ...this.mapper.toEditPayload(existing, dto), id };
        await this.client.getEmitter().emitWithAck<UptimeKumaMonitorAck>("editMonitor", payload);
        await this.syncTags(id, this.mapper.fromTagPayload(existing.tags), dto.tagIds);
        return this.get(id);
    }

    async pause(id: number): Promise<void> {
        await this.client.getEmitter().emitWithAck<UptimeKumaAck>("pauseMonitor", id);
    }

    async resume(id: number): Promise<void> {
        await this.client.getEmitter().emitWithAck<UptimeKumaAck>("resumeMonitor", id);
    }

    async remove(id: number, deleteChildren: boolean): Promise<void> {
        await this.client.getEmitter().emitWithAck<UptimeKumaAck>("deleteMonitor", id, deleteChildren);
    }

    async getHeartbeats(id: number, periodHours: number): Promise<HeartbeatDto[]> {
        await this.getRaw(id);
        const ack = await this.client
            .getEmitter()
            .emitWithAck<UptimeKumaHeartbeatsAck>("getMonitorBeats", id, periodHours);
        return (ack.data ?? []).map((heartbeat) => this.toHeartbeatDto(heartbeat));
    }

    async getChartData(id: number, periodHours: number): Promise<ChartBucketDto[]> {
        await this.getRaw(id);
        const ack = await this.client
            .getEmitter()
            .emitWithAck<UptimeKumaChartDataAck>("getMonitorChartData", id, periodHours);
        return ack.data ?? [];
    }

    async getImportantEvents(id: number, offset: number, count: number): Promise<ImportantEventsResponseDto> {
        await this.getRaw(id);
        const [countAck, listAck] = await Promise.all([
            this.client
                .getEmitter()
                .emitWithAck<UptimeKumaImportantEventsCountAck>("monitorImportantHeartbeatListCount", id),
            this.client
                .getEmitter()
                .emitWithAck<UptimeKumaImportantEventsAck>("monitorImportantHeartbeatListPaged", id, offset, count),
        ]);
        return {
            total: countAck.count ?? 0,
            events: (listAck.data ?? []).map((heartbeat) => this.toHeartbeatDto(heartbeat)),
        };
    }

    async getStats(id: number): Promise<MonitorStatsDto> {
        await this.getRaw(id);

        const [chart24h, chart30d, chart1y] = await Promise.all([
            this.getChartData(id, 24),
            this.getChartData(id, 720),
            this.getChartData(id, 8760),
        ]);

        const certAndDomain = this.client.getCertAndDomainInfo(id);

        return {
            uptime24h: this.calcUptime(chart24h),
            uptime30d: this.calcUptime(chart30d),
            uptime1y: this.calcUptime(chart1y),
            avgPing24h: this.calcAvgPing(chart24h),
            certInfo: certAndDomain.certInfo,
            domainDaysRemaining: certAndDomain.domainDaysRemaining,
            domainExpiresOn: certAndDomain.domainExpiresOn,
        };
    }

    private calcUptime(buckets: UptimeKumaChartBucket[]): number | null {
        const totalUp = buckets.reduce((sum, bucket) => sum + bucket.up, 0);
        const totalDown = buckets.reduce((sum, bucket) => sum + bucket.down, 0);
        const total = totalUp + totalDown;
        return total > 0 ? totalUp / total : null;
    }

    private calcAvgPing(buckets: UptimeKumaChartBucket[]): number | null {
        const pings = buckets.filter((bucket) => bucket.avgPing !== null).map((bucket) => bucket.avgPing as number);
        return pings.length > 0 ? pings.reduce((sum, ping) => sum + ping, 0) / pings.length : null;
    }

    private toHeartbeatDto(heartbeat: UptimeKumaHeartbeat): HeartbeatDto {
        return {
            id: heartbeat.id,
            monitorId: heartbeat.monitor_id,
            status: heartbeat.status,
            time: heartbeat.time,
            msg: heartbeat.msg,
            // SQLite has no native boolean type — redbean-node returns this column as a raw 0/1 integer.
            important: Boolean(heartbeat.important),
            duration: heartbeat.duration,
            ping: heartbeat.ping,
            downCount: heartbeat.down_count,
        };
    }

    /**
     * Uptime Kuma links tags to a monitor through dedicated `addMonitorTag`/`deleteMonitorTag`
     * events, not through `add`/`editMonitor` (see `HttpMonitorMapper.fromTagPayload`), so tag
     * assignment has to be reconciled here as a separate step. `desiredTagIds === undefined`
     * means the caller didn't touch tags (a partial update that omitted `tagIds`).
     */
    private async syncTags(monitorId: number, currentTagIds: number[], desiredTagIds?: number[]): Promise<void> {
        if (desiredTagIds === undefined) {
            return;
        }

        const toAdd = desiredTagIds.filter((tagId) => !currentTagIds.includes(tagId));
        const toRemove = currentTagIds.filter((tagId) => !desiredTagIds.includes(tagId));

        await Promise.all([
            ...toAdd.map((tagId) =>
                this.client.getEmitter().emitWithAck<UptimeKumaAck>("addMonitorTag", tagId, monitorId, ""),
            ),
            ...toRemove.map((tagId) =>
                this.client.getEmitter().emitWithAck<UptimeKumaAck>("deleteMonitorTag", tagId, monitorId, ""),
            ),
        ]);
    }

    private async getRaw(id: number): Promise<UptimeKumaMonitor> {
        try {
            const ack = await this.client.getEmitter().emitWithAck<UptimeKumaMonitorAck>("getMonitor", id);
            if (!ack.monitor) {
                throw new NotFoundError(`Monitor ${id} not found`);
            }
            return ack.monitor;
        } catch (err) {
            // Uptime Kuma's "getMonitor" throws a raw, unstable JS error message when the
            // monitor doesn't exist or isn't owned by the service account (see
            // server/server.js:1011-1030) — always treat it as a 404 rather than relaying it.
            if (err instanceof UpstreamRejectedError) {
                throw new NotFoundError(`Monitor ${id} not found`);
            }
            throw err;
        }
    }
}
