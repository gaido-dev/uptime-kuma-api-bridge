import { z } from "zod";

export const UpdateTagSchema = z.object({
    name: z.string().min(1).optional(),
    color: z.string().min(1).optional(),
});

export type UpdateTagDto = z.infer<typeof UpdateTagSchema>;
