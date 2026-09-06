import type { Socket } from "socket.io-client";

import { AckTimeoutError } from "../errors/AckTimeoutError.js";
import { UpstreamRejectedError } from "../errors/UpstreamRejectedError.js";
import type { UptimeKumaAck } from "./types.js";

/**
 * Promisifies Uptime Kuma's socket.io emit/ack protocol.
 *
 * Most Uptime Kuma events resolve their result directly in the ack callback. A few
 * (`getMonitorList`, `getMonitorList`-derived reads) only ack `{ ok: true }` and push the
 * actual payload on a separate broadcast event (e.g. "monitorList") — see
 * uptime-kuma/server/uptime-kuma-server.js `sendMonitorList`. `awaitEvent` covers that case.
 */
export class SocketEmitter {
    constructor(
        private readonly socket: Socket,
        private readonly defaultTimeoutMs: number,
    ) {}

    /** Emits `event` and resolves with the ack payload. Throws if Uptime Kuma rejects it. */
    async emitWithAck<TAck extends UptimeKumaAck>(event: string, ...args: unknown[]): Promise<TAck> {
        const ack = await this.rawEmitWithAck<TAck>(event, args);
        if (!ack.ok) {
            throw new UpstreamRejectedError(ack.msg ?? `Uptime Kuma rejected "${event}"`);
        }
        return ack;
    }

    /**
     * Emits `event`, waits for its ack, then waits for the next occurrence of `broadcastEvent`
     * and resolves with that event's payload. Used for events like `getMonitorList` whose ack
     * carries no data.
     */
    async emitAndAwaitBroadcast<TPayload>(
        event: string,
        broadcastEvent: string,
        ...args: unknown[]
    ): Promise<TPayload> {
        const broadcastPromise = this.waitForEvent<TPayload>(broadcastEvent);
        await this.emitWithAck<UptimeKumaAck>(event, ...args);
        return broadcastPromise;
    }

    private rawEmitWithAck<TAck>(event: string, args: unknown[]): Promise<TAck> {
        return new Promise((resolve, reject) => {
            this.socket.timeout(this.defaultTimeoutMs).emit(event, ...args, (err: Error | null, ack: TAck) => {
                if (err) {
                    reject(new AckTimeoutError(event));
                    return;
                }
                resolve(ack);
            });
        });
    }

    private waitForEvent<TPayload>(event: string): Promise<TPayload> {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.socket.off(event, onEvent);
                reject(new AckTimeoutError(event));
            }, this.defaultTimeoutMs);

            const onEvent = (payload: TPayload): void => {
                clearTimeout(timer);
                resolve(payload);
            };

            this.socket.once(event, onEvent);
        });
    }
}
