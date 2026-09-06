import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

import { BridgeError } from "../errors/BridgeError.js";
import type { Logger } from "../logger.js";

/** Maps a thrown error to an MCP tool error result, reusing the same BridgeError taxonomy as the REST error handler. */
export function toMcpErrorResult(error: unknown, logger: Logger): CallToolResult {
    if (error instanceof BridgeError) {
        return { isError: true, content: [{ type: "text", text: `${error.code}: ${error.message}` }] };
    }

    logger.error({ err: error }, "Unhandled error in MCP tool");
    return { isError: true, content: [{ type: "text", text: "Internal error" }] };
}
