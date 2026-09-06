import { UpstreamRejectedError } from "../errors/UpstreamRejectedError.js";
import type { MonitorResponseDto } from "../monitors/dto/MonitorResponseDto.js";
import type { MonitorService } from "../monitors/MonitorService.js";
import type { UptimeKumaAddAck, UptimeKumaMonitorPayload } from "../uptime-kuma-client/types.js";
import type { UptimeKumaSocketClient } from "../uptime-kuma-client/UptimeKumaSocketClient.js";
import type { CreateGroupDto } from "./dto/CreateGroupDto.js";

export class GroupService {
    constructor(
        private readonly client: UptimeKumaSocketClient,
        private readonly monitorService: MonitorService,
    ) {}

    async list(): Promise<MonitorResponseDto[]> {
        return this.monitorService.list("group");
    }

    async create(dto: CreateGroupDto): Promise<MonitorResponseDto> {
        const payload: UptimeKumaMonitorPayload = {
            name: dto.name,
            description: dto.description,
            parent: dto.parent,
            type: "group",
            active: true,
            accepted_statuscodes: [],
            conditions: [],
        };

        const ack = await this.client.getEmitter().emitWithAck<UptimeKumaAddAck>("add", payload);
        if (ack.monitorID === undefined) {
            throw new UpstreamRejectedError('Uptime Kuma did not return a monitor id for "add"');
        }
        return this.monitorService.get(ack.monitorID);
    }
}
