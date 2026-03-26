import type { Response, Request } from "express";
import prisma from "../database/db";
import { createSubmissionSchema, updateSubmissionSchema } from "../types/submission";
import { analyzeCodeWithAI } from "../services/ai.service";
import { EmailService } from "../services/email.service";

const processSubmission = async (student_id: string, assignment_id: string, code: string) => {
    const assignment = await prisma.assignment.findUnique({
        where: { assignment_id },
        select: {
            title: true,
            description: true,
            feedback_level: true,
            class_id: true,
            score: true
        }
    });

    if (!assignment) {
        throw new Error("ไม่พบงานที่ระบุ");
    }

    const newSubmission = await prisma.submission.create({
        data: {
            code: code,
            status: "PENDING",
            assignment_id: assignment_id,
            student_id: student_id,
            submitted_at: new Date(),
            score: 0
        }
    });

    const aiResult = await analyzeCodeWithAI(
        code,
        assignment.title,
        assignment.description,
        assignment.feedback_level,
        assignment.score
    );

    const updatedSubmission = await prisma.submission.update({
        where: { submission_id: newSubmission.submission_id },
        data: {
            status: "DONE",
            score: aiResult.score,
            ai_feedback: aiResult as any,
        }
    });

    return updatedSubmission;
};

export const submissionController = {
    getAllSubmission: async (req: Request, res: Response) => {
        try {
            const submission = await prisma.submission.findMany();

            if (submission.length === 0) return res.status(404).json({ message: "ไม่พบการส่งงาน" });

            if (!submission) {
                return res.status(404).json({ message: "ไม่พบการส่งงาน" });
            }
            return res.status(200).json(submission);
        } catch (err) {
            console.log(err)
        }
    },
    getSubmissionById: async (req: Request, res: Response) => {
        try {
            const { submission_id } = req.params;
            const submission = await prisma.submission.findUnique({
                where: { submission_id: submission_id as string },
            });
            if (!submission) {
                return res.status(404).json({ message: "ไม่พบการส่งงาน" });
            }
            return res.status(200).json(submission);
        } catch (err) {
            console.log(err)
        }
    },
    getSubmissionByAssignmentId: async (req: Request, res: Response) => {
        try {
            const { assignment_id } = req.params;
            const submission = await prisma.submission.findMany({
                where: { assignment_id: assignment_id as string },
            });
            if (!submission) {
                return res.status(404).json({ message: "ไม่พบการส่งงาน" });
            }
            return res.status(200).json(submission);
        } catch (err) {
            console.log(err)
        }
    },
    createSubmission: async (req: Request, res: Response) => {
        try {
            const result = createSubmissionSchema.safeParse(req.body);
            if (!result.success) {
                return res.status(400).json({ message: "กรุณาตรวจสอบข้อมูลให้ถูกต้อง" });
            }
            const { code, status, ai_feedback, teacher_feedback, assignment_id, student_id } = result.data;
            const submission = await prisma.submission.create({
                data: {
                    code,
                    status,
                    score: 0,
                    ai_feedback: ai_feedback ?? "",
                    teacher_feedback: teacher_feedback ?? "",
                    assignment_id,
                    student_id
                },
            });
            if (!submission) {
                return res.status(500).json({ message: "เกิดข้อผิดพลาดในการสร้างการส่งงาน" });
            }
            return res.status(201).json({ message: "สร้างการส่งงานสําเร็จ", submission });

        } catch (err) {
            console.log(err)
            return res.status(500).json({ message: "เกิดข้อผิดพลาดในเซิฟเวอร์" });
        }
    },
    updateSubmission: async (req: Request, res: Response) => {
        try {
            const result = updateSubmissionSchema.safeParse(req.body);
            const { submission_id } = req.params;
            if (!submission_id) {
                return res.status(400).json({ message: "กรุณาระบุ submission_id" });
            }
            if (!result.success) {
                return res.status(400).json({ message: "กรุณาตรวจสอบข้อมูลให้ถูกต้อง", errors: result.error.flatten().fieldErrors, });
            }
            const { code, submitted_at, status, score, ai_feedback, teacher_feedback, assignment_id, student_id } = result.data;
            const submission = await prisma.submission.update({
                where: { submission_id: submission_id as string },
                data: {
                    code,
                    submitted_at,
                    status,
                    score,
                    ai_feedback,
                    teacher_feedback,
                    assignment_id,
                    student_id
                },
            });
            if (!submission) {
                return res.status(404).json({ message: "ไม่พบการส่งงาน" });
            }
            return res.status(200).json({ message: "อัพเดตการส่งงานสําเร็จ", submission });
        } catch (error) {
            console.log(error)
            return res.status(500).json({ message: "เกิดข้อผิดพลาดในเซิฟเวอร์" });
        }
    },
    deleteSubmission: async (req: Request, res: Response) => {
        try {
            const { submission_id } = req.params;

            const submission = await prisma.submission.findUnique({
                where: { submission_id: submission_id },
                select: { assignment_id: true }
            });

            if (!submission) {
                return res.status(404).json({ message: "ไม่พบข้อมูลการส่งงานนี้" });
            }

            await prisma.$transaction([

                prisma.submission.delete({
                    where: { submission_id: submission_id }
                }),

                prisma.assignmentAnalysis.deleteMany({
                    where: { assignment_id: submission.assignment_id }
                })
            ]);

            return res.status(200).json({
                success: true,
                message: "ลบงานส่งและล้างข้อมูลการวิเคราะห์เรียบร้อยแล้ว"
            });

        } catch (error) {
            console.error("Delete Submission Error:", error);
            return res.status(500).json({
                success: false,
                message: "เกิดข้อผิดพลาดในการลบข้อมูล",
                error: error instanceof Error ? error.message : "Unknown Error"
            });
        }
    },
    testSubmit: async (req: Request, res: Response) => {
        try {
            const { assignment_id, code, student_id} = req.body;
            // const student_id = req.user?.user_id;
            if (!student_id || !assignment_id || !code) {
                return res.status(400).json({ message: "ข้อมูลไม่ครบถ้วน" });
            }

            const result = await processSubmission(student_id, assignment_id, code);

            return res.status(200).json({
                message: "ส่งงานและตรวจเรียบร้อยแล้ว",
                result
            });

        } catch (error) {
            console.error("Submission Error:", error);
            const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการส่งงาน";
            if (message === "ไม่พบงานที่ระบุ") {
                return res.status(404).json({ message });
            }
            return res.status(500).json({ message: "เกิดข้อผิดพลาดในการส่งงาน" });
        }
    },

    testConcurrent: async (req: Request, res: Response) => {
        try {
            const { assignment_id, code } = req.body;
            const student_id = req.user?.user_id;

            if (!student_id || !assignment_id || !code) {
                return res.status(400).json({ message: "ข้อมูลไม่ครบถ้วน" });
            }

            console.log(`Starting concurrent test for 10 submissions...`);

            const promises = [];
            for (let i = 0; i < 10; i++) {
                promises.push(processSubmission(student_id, assignment_id, code)
                    .then(res => ({ status: 'success', id: res.submission_id }))
                    .catch(err => ({ status: 'failed', error: err instanceof Error ? err.message : String(err) }))
                );
            }

            const results = await Promise.all(promises);

            return res.status(200).json({
                message: "ทดสอบการส่งงานพร้อมกัน 10 คนเรียบร้อยแล้ว",
                results
            });

        } catch (error) {
            console.error("Concurrent Test Error:", error);
            return res.status(500).json({ message: "เกิดข้อผิดพลาดในการทดสอบ" });
        }
    }
};