import { z } from "zod";

import { HeartbeatSchema } from "./HeartbeatDto.js";

export const ImportantEventsResponseSchema = z.object({
    total: z.number().int(),
    events: z.array(HeartbeatSchema),
});

export type ImportantEventsResponseDto = z.infer<typeof ImportantEventsResponseSchema>;
