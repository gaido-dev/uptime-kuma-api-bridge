import { z } from "zod";

export const HeartbeatSchema = z.object({
    id: z.number().int(),
    monitorId: z.number().int(),
    status: z.number().int(),
    time: z.string(),
    msg: z.string().nullable(),
    important: z.boolean(),
    duration: z.number().int(),
    ping: z.number().nullable(),
    downCount: z.number().int(),
});

export type HeartbeatDto = z.infer<typeof HeartbeatSchema>;
