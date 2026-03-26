import { z } from "zod";
import { Role, UserLevel } from "../generated/prisma";

export const userSchema = z.object({
    user_id: z.string(),
    std_id: z.string(),
    classroom_id: z.string().optional(),
    name: z.string().min(1, { message: "กรุณากรอกชื่อ" }),
    lastname: z.string().min(1, { message: "กรุณากรอกนามสกุล" }),
    email: z.string().email({ message: "รูปแบบอีเมลไม่ถูกต้อง" }).optional(),
    password: z.string(),
    level: z.enum([UserLevel.VOC_1,UserLevel.VOC_2,UserLevel.VOC_3,UserLevel.VHC_1,UserLevel.VHC_2]),
    role: z.enum([Role.ADMIN, Role.TEACHER, Role.STUDENT] as const, {
        message: "บทบาทผู้ใช้ไม่ถูกต้อง"
    }),
});
export type User = z.infer<typeof userSchema>;
export const createUserSchema = userSchema.omit({ user_id: true });
export const updateUserSchema = userSchema.partial();
