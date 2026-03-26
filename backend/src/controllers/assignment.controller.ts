import type { Response, Request } from "express";
import prisma from "../database/db";
import { createAssignmentSchema, updateAssignmentSchema } from "../types/assignment";
import { EmailService } from "../services/email.service";
import { AIAnalysisService } from "../services/ai.performance.service";

export const assignmentController = {
    getAssignment: async (req: Request, res: Response) => {
        try {
            const assignment = await prisma.assignment.findMany();
            if (!assignment) {
                return res.status(404).json({ message: "ไม่พบการส่งงาน" });
            }
            return res.status(200).json(assignment);
        } catch (err) {
            console.log(err)
        }
    },
    getAssignmentById: async (req: Request, res: Response) => {
        try {
            const { assignment_id } = req.params;
            const assignment = await prisma.assignment.findUnique({
                where: { assignment_id: assignment_id as string },
            });
            if (!assignment) {
                return res.status(404).json({ message: "ไม่พบงาน" });
            }
            return res.status(200).json(assignment);
        } catch (err: any) {
            console.log(err)
            if (err.code === "P2023") {
                return res.status(400).json({ message: "assignment_id ไม่ถูกต้อง" });
            }
        }
    },
    getAssignmentByClassId: async (req: Request, res: Response) => {
        try {
            const { class_id } = req.params;

            const assignment = await prisma.assignment.findMany({
                where: { class_id: class_id as string },
                orderBy: {
                    create_at: "desc",
                }
            });

            if (!assignment) {
                return res.status(404).json({ message: "ไม่พบงาน" });
            }
            return res.status(200).json(assignment);
        } catch (err) {
            console.log(err)
        }
    },
    getMyAssignmentStatus: async (req: Request, res: Response) => {
        try {
            const { class_id } = req.params;
            const student_id = req.user?.user_id;

            const assignments = await prisma.assignment.findMany({
                where: { class_id: class_id as string },
                include: {
                    submissions: {
                        where: { student_id: student_id as string },
                        select: { status: true, score: true }
                    }
                },
                orderBy: { create_at: 'desc' }
            });

            return res.json(assignments);

        } catch (error) {
            return res.status(500).json({ message: "Error" });
        }
    },
    createAssignment: async (req: Request, res: Response) => {
        try {
            const result = createAssignmentSchema.safeParse(req.body);
            if (!result.success) {
                return res.status(400).json({
                    message: "กรุณาตรวจสอบข้อมูลให้ถูกต้อง",
                    errors: result.error.flatten().fieldErrors
                });
            }
            const { title, description, feedback_level, due_date, score, class_id } = result.data;
            const assignment = await prisma.assignment.create({
                data: {
                    title,
                    description,
                    feedback_level,
                    due_date: new Date(due_date ?? Date.now()),
                    score,
                    class_id
                },
            });

            if (!assignment) {
                return res.status(500).json({ message: "เกิดข้อผิดพลาดในการสร้างการส่งงาน" });
            }

            (async () => {
                try {
                    const enrollments = await prisma.enrollment.findMany({
                        where: {
                            class_id: class_id // หาเฉพาะคนเรียนคลาสนี้
                        },
                        include: {
                            student: {
                                select: { email: true }
                            }
                        }
                    });

                    const studentEmails = enrollments
                        .map((e) => e.student?.email)
                        .filter((email): email is string => !!email);

                    if (studentEmails.length > 0) {
                        // console.log(`📧 กำลังส่งอีเมลแจ้งเตือนงานใหม่ไปยัง ${studentEmails.length} คน...`);
                        await EmailService.notifyNewAssignment(
                            studentEmails,
                            assignment.title,
                            assignment.description,
                            assignment.due_date
                        );
                    }
                } catch (emailError) {
                    console.error("❌ Email notification failed:", emailError);
                }
            })();
            return res.status(201).json({ message: "สร้างการส่งงานสําเร็จ", assignment });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: "เกิดข้อผิดพลาดในเซิฟเวอร์" });
        }
    },
    updateAssignment: async (req: Request, res: Response) => {
        try {
            const result = updateAssignmentSchema.safeParse(req.body);
            const { assignment_id } = req.params;
            if (!assignment_id) {
                return res.status(400).json({ message: "กรุณาระบุ assignment_id" });
            }
            if (!result.success) {
                return res.status(400).json({ message: "กรุณาตรวจสอบข้อมูลให้ถูกต้อง", errors: result.error.flatten().fieldErrors, });
            }
            const { title, description, due_date, score, feedback_level } = result.data;
            const assignment = await prisma.assignment.update({
                where: { assignment_id: assignment_id as string },
                data: {
                    title,
                    description,
                    due_date: new Date(due_date ?? Date.now()),
                    score,
                    feedback_level,
                },
            });
            if (!assignment) {
                return res.status(404).json({ message: "ไม่พบการส่งงาน" });
            }
            return res.status(200).json({ message: "อัพเดตการส่งงานสําเร็จ", assignment });
        } catch (err) {
            console.log(err)
        }
    },
    deleteAssignment: async (req: Request, res: Response) => {
        try {
            const { assignment_id } = req.params;

            if (!assignment_id) {
                return res.status(400).json({ message: "กรุณาระบุ assignment_id" });
            }

            const existingAssignment = await prisma.assignment.findUnique({
                where: { assignment_id },
            });

            if (!existingAssignment) {
                return res.status(404).json({ message: "ไม่พบงานที่ต้องการลบ" });
            }

            // await prisma.$transaction([
            //     prisma.submission.deleteMany({
            //         where: { assignment_id },
            //     }),
            //     prisma.assignment.delete({
            //         where: { assignment_id },
            //     }),
            // ]);
            await prisma.$transaction([
                prisma.submission.deleteMany({
                    where: { assignment_id },
                }),
                prisma.assignmentAnalysis.deleteMany({
                    where: { assignment_id },
                }),
                prisma.assignment.delete({
                    where: { assignment_id: assignment_id },
                }),
            ])

            return res.status(200).json({
                message: "ลบ Assignment และ Submission ที่เกี่ยวข้องเรียบร้อยแล้ว",
            });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
        }
    },

    analyzeAssignment: async (req: Request, res: Response) => {
        try {
            const { assignment_id } = req.params;

            if (!assignment_id) {
                return res.status(400).json({ error: "Assignment ID is required" });
            }

            const analysis = await AIAnalysisService.analyzeClassPerformance(assignment_id);

            res.json({
                success: true,
                data: analysis
            });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
            res.status(500).json({ success: false, error: errorMessage });
        }
    },

};  