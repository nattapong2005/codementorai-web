import {z} from "zod";
import { SubmitStatus } from "../generated/prisma";
export const submissionSchema = z.object({
     submission_id: z.string(),
     code: z.string(),
     submitted_at: z.string().optional(),
     status: z.enum([SubmitStatus.PENDING, SubmitStatus.LATE, SubmitStatus.DONE, SubmitStatus.MISSING] as const, {
          message: "สถานะการส่งไม่ถูกต้อง"
     }),
     score: z.number().optional(),
     ai_feedback: z.string().optional(),
     teacher_feedback: z.string().optional(),
     assignment_id: z.string(),
     student_id: z.string(),
});

export const createSubmissionSchema = submissionSchema.omit({ submission_id: true });
export const updateSubmissionSchema = submissionSchema.partial();




