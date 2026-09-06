import { z } from "zod";

export const CreateGroupSchema = z.object({
    name: z.string().min(1),
    description: z.string().nullable().default(null),
    parent: z.number().int().positive().nullable().default(null),
});

export type CreateGroupDto = z.infer<typeof CreateGroupSchema>;
