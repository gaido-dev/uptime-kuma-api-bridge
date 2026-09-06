import { BridgeError } from "./BridgeError.js";

/** Thrown when the socket.io connection to Uptime Kuma is not connected/authenticated. */
export class UpstreamUnavailableError extends BridgeError {
    readonly httpStatus = 502;
    readonly code = "UPSTREAM_UNAVAILABLE";

    constructor(message = "Not connected to Uptime Kuma") {
        super(message);
    }
}
