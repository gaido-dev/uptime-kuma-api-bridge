import { BridgeError } from "./BridgeError.js";

const NOT_FOUND_PATTERNS = [/not found/i, /does not exist/i, /permission denied/i, /do not own/i];
const CONFLICT_PATTERNS = [/cycle/i, /already/i, /duplicate/i, /invalid monitor group/i];
const VALIDATION_PATTERNS = [/cannot be/i, /must be/i, /required/i, /invalid json/i, /is invalid/i];

/**
 * Thrown when Uptime Kuma acknowledges a socket.io event with `{ ok: false, msg }`.
 * The upstream message isn't a stable contract, so classification is a best-effort
 * pattern match against known phrasings from `server/server.js` and `Monitor.validate()`.
 */
export class UpstreamRejectedError extends BridgeError {
    readonly httpStatus: number;
    readonly code: string;

    constructor(upstreamMessage: string) {
        super(upstreamMessage);
        if (NOT_FOUND_PATTERNS.some((pattern) => pattern.test(upstreamMessage))) {
            this.httpStatus = 404;
            this.code = "MONITOR_NOT_FOUND";
        } else if (CONFLICT_PATTERNS.some((pattern) => pattern.test(upstreamMessage))) {
            this.httpStatus = 409;
            this.code = "UPSTREAM_CONFLICT";
        } else if (VALIDATION_PATTERNS.some((pattern) => pattern.test(upstreamMessage))) {
            this.httpStatus = 422;
            this.code = "UPSTREAM_VALIDATION_FAILED";
        } else {
            this.httpStatus = 502;
            this.code = "UPSTREAM_REJECTED";
        }
    }
}
