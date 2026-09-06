import { io, type Socket } from "socket.io-client";

import { UpstreamUnavailableError } from "../errors/UpstreamUnavailableError.js";
import type { Logger } from "../logger.js";
import { SocketEmitter } from "./SocketEmitter.js";
import type { UptimeKumaAck, UptimeKumaLoginAck, UptimeKumaNotification } from "./types.js";

export interface UptimeKumaSocketClientOptions {
    url: string;
    username: string;
    password: string;
    socketTimeoutMs: number;
    ackTimeoutMs: number;
    logger: Logger;
}

/**
 * Certificate/domain expiry info as last pushed by Uptime Kuma for a given monitor. There is no
 * ack-based event for this data (see `certInfo`/`domainInfo` in `registerLifecycleHandlers`),
 * so entries only populate after that monitor's next heartbeat cycle completes.
 */
export interface CertAndDomainInfo {
    certInfo: unknown | null;
    domainDaysRemaining: number | null;
    domainExpiresOn: string | null;
}

/**
 * Maintains a persistent, authenticated socket.io connection to an Uptime Kuma instance,
 * acting as a logged-in browser client would. All monitor/group mutations must go through
 * this connection (rather than direct DB writes) so Uptime Kuma's own business logic keeps
 * its database, in-memory `server.monitorList`, and scheduler in sync.
 */
export class UptimeKumaSocketClient {
    private readonly socket: Socket;
    private readonly emitter: SocketEmitter;
    private readonly logger: Logger;
    private ready = false;
    private cachedToken: string | undefined;
    private cachedNotifications: UptimeKumaNotification[] = [];
    private readonly certAndDomainCache = new Map<number, CertAndDomainInfo>();

    constructor(private readonly options: UptimeKumaSocketClientOptions) {
        this.logger = options.logger;
        this.socket = io(options.url, {
            transports: ["websocket"],
            reconnection: true,
            timeout: options.socketTimeoutMs,
            autoConnect: false,
        });
        this.emitter = new SocketEmitter(this.socket, options.ackTimeoutMs);
        this.registerLifecycleHandlers();
    }

    /** Connects and authenticates. Resolves once the client is ready to drive monitors. */
    async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.socket.once("connect_error", (err: Error) => {
                reject(new UpstreamUnavailableError(`Cannot reach Uptime Kuma: ${err.message}`));
            });
            this.socket.connect();
            this.socket.once("connect", () => {
                this.authenticate().then(resolve, reject);
            });
        });
    }

    isReady(): boolean {
        return this.ready;
    }

    getEmitter(): SocketEmitter {
        if (!this.ready) {
            throw new UpstreamUnavailableError();
        }
        return this.emitter;
    }

    getCachedNotifications(): UptimeKumaNotification[] {
        return this.cachedNotifications;
    }

    /** Last known cert/domain info for a monitor, or all-null if no `certInfo`/`domainInfo` push has arrived yet. */
    getCertAndDomainInfo(monitorId: number): CertAndDomainInfo {
        return (
            this.certAndDomainCache.get(monitorId) ?? {
                certInfo: null,
                domainDaysRemaining: null,
                domainExpiresOn: null,
            }
        );
    }

    async close(): Promise<void> {
        this.socket.disconnect();
    }

    private registerLifecycleHandlers(): void {
        this.socket.on("disconnect", (reason: string) => {
            this.ready = false;
            this.logger.warn({ reason }, "Disconnected from Uptime Kuma");
        });

        this.socket.on("connect", () => {
            if (this.cachedToken) {
                this.authenticate().catch((err: unknown) => {
                    this.logger.error({ err }, "Failed to re-authenticate with Uptime Kuma after reconnect");
                });
            }
        });

        this.socket.on("notificationList", (notifications: UptimeKumaNotification[]) => {
            this.cachedNotifications = notifications;
        });

        this.socket.on("certInfo", (monitorId: number, infoJson: string) => {
            const existing = this.certAndDomainCache.get(monitorId);
            let certInfo: unknown | null = null;
            try {
                certInfo = JSON.parse(infoJson);
            } catch (err) {
                this.logger.warn({ err, monitorId }, "Failed to parse certInfo payload from Uptime Kuma");
            }
            this.certAndDomainCache.set(monitorId, {
                domainDaysRemaining: null,
                domainExpiresOn: null,
                ...existing,
                certInfo,
            });
        });

        this.socket.on("domainInfo", (monitorId: number, daysRemaining: number, expiresOn: string) => {
            const existing = this.certAndDomainCache.get(monitorId);
            this.certAndDomainCache.set(monitorId, {
                certInfo: null,
                ...existing,
                domainDaysRemaining: daysRemaining,
                domainExpiresOn: expiresOn,
            });
        });
    }

    private async authenticate(): Promise<void> {
        if (this.cachedToken) {
            try {
                await this.emitter.emitWithAck<UptimeKumaAck>("loginByToken", this.cachedToken);
                this.ready = true;
                this.logger.info("Re-authenticated with Uptime Kuma using cached token");
                return;
            } catch (err) {
                this.logger.warn({ err }, "Cached Uptime Kuma token rejected, falling back to password login");
                this.cachedToken = undefined;
            }
        }

        const ack = await this.emitter.emitWithAck<UptimeKumaLoginAck>("login", {
            username: this.options.username,
            password: this.options.password,
        });
        this.cachedToken = ack.token;
        this.ready = true;
        this.logger.info("Authenticated with Uptime Kuma");
    }
}
