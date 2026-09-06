import { BridgeError } from "./BridgeError.js";

export class NotFoundError extends BridgeError {
    readonly httpStatus = 404;
    readonly code = "NOT_FOUND";
}
