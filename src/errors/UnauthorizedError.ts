import { BridgeError } from "./BridgeError.js";

export class UnauthorizedError extends BridgeError {
    readonly httpStatus = 401;
    readonly code = "UNAUTHORIZED";

    constructor(message = "Missing or invalid bearer token") {
        super(message);
    }
}
