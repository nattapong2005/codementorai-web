import { z } from "zod";
import { FeedBackLevel } from "../generated/prisma";

export const assignmentSchema = z.object({
    assignment_id: z.string(),
    title: z.string().min(1, { message: "กรุณากรอกหัวข้อ" }),
    score: z.int(),
    description: z.string().min(1, { message: "กรุณากรอกรายละเอียด" }),
    due_date: z.string(),
    create_at: z.date().optional(),   
    feedback_level: z.enum([FeedBackLevel.HINT, FeedBackLevel.CONCEPT, FeedBackLevel.ANSWER, FeedBackLevel.NONE] as const, {
        message: "ประเภทคำแนะนำไม่ถูกต้อง"
    }),
    class_id: z.string(),
});

export const createAssignmentSchema = assignmentSchema.omit({ assignment_id: true });
export const updateAssignmentSchema = assignmentSchema.partial();


