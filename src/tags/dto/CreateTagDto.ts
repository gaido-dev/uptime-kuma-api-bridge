import { z } from "zod";

export const CreateTagSchema = z.object({
    name: z.string().min(1),
    color: z.string().min(1).default("#3F51B5"),
});

export type CreateTagDto = z.infer<typeof CreateTagSchema>;
