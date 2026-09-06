import { BridgeError } from "./BridgeError.js";

/** Thrown when Uptime Kuma does not acknowledge a socket.io event within the configured timeout. */
export class AckTimeoutError extends BridgeError {
    readonly httpStatus = 504;
    readonly code = "UPSTREAM_TIMEOUT";

    constructor(event: string) {
        super(`Uptime Kuma did not respond to "${event}" in time`);
    }
}
