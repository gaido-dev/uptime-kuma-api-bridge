import { z } from "zod";

export const ChartBucketSchema = z.object({
    timestamp: z.number().int(),
    up: z.number().int(),
    down: z.number().int(),
    avgPing: z.number().nullable(),
    minPing: z.number().nullable(),
    maxPing: z.number().nullable(),
});

export type ChartBucketDto = z.infer<typeof ChartBucketSchema>;
