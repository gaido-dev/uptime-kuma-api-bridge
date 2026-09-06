import { NotFoundError } from "../errors/NotFoundError.js";
import { UpstreamRejectedError } from "../errors/UpstreamRejectedError.js";
import type { UptimeKumaAck, UptimeKumaTag, UptimeKumaTagAck, UptimeKumaTagsAck } from "../uptime-kuma-client/types.js";
import type { UptimeKumaSocketClient } from "../uptime-kuma-client/UptimeKumaSocketClient.js";
import type { CreateTagDto } from "./dto/CreateTagDto.js";
import type { UpdateTagDto } from "./dto/UpdateTagDto.js";

export interface TagDto {
    id: number;
    name: string;
    color: string;
}

export class TagService {
    constructor(private readonly client: UptimeKumaSocketClient) {}

    async list(): Promise<TagDto[]> {
        const ack = await this.client.getEmitter().emitWithAck<UptimeKumaTagsAck>("getTags");
        return (ack.tags ?? []).map((tag) => this.toDto(tag));
    }

    async create(dto: CreateTagDto): Promise<TagDto> {
        const ack = await this.client.getEmitter().emitWithAck<UptimeKumaTagAck>("addTag", {
            name: dto.name,
            color: dto.color,
        });
        if (!ack.tag) {
            throw new UpstreamRejectedError('Uptime Kuma did not return a tag for "addTag"');
        }
        return this.toDto(ack.tag);
    }

    async update(id: number, dto: UpdateTagDto): Promise<TagDto> {
        const existing = await this.getOne(id);
        const ack = await this.client.getEmitter().emitWithAck<UptimeKumaTagAck>("editTag", {
            id,
            name: dto.name ?? existing.name,
            color: dto.color ?? existing.color,
        });
        if (!ack.tag) {
            throw new UpstreamRejectedError('Uptime Kuma did not return a tag for "editTag"');
        }
        return this.toDto(ack.tag);
    }

    async remove(id: number): Promise<void> {
        await this.getOne(id);
        await this.client.getEmitter().emitWithAck<UptimeKumaAck>("deleteTag", id);
    }

    /**
     * Uptime Kuma has no single-tag getter event, only `getTags` (a full list), so a 404 for an
     * unknown id has to be derived client-side.
     */
    private async getOne(id: number): Promise<TagDto> {
        const tag = (await this.list()).find((candidate) => candidate.id === id);
        if (!tag) {
            throw new NotFoundError(`Tag ${id} not found`);
        }
        return tag;
    }

    private toDto(tag: UptimeKumaTag): TagDto {
        return { id: tag.id, name: tag.name, color: tag.color };
    }
}
