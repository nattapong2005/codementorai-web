import {z} from "zod";

export const loginSchema = z.object({
    std_id: z.string(),
    password: z.string(),
});
export type LoginInput = z.infer<typeof loginSchema>;