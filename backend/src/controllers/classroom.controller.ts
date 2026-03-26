import type { Response, Request } from "express";
import prisma from "../database/db";
import { createClassroomSchema, updateClassroomSchema } from "../types/classroom";
import jwt from "jsonwebtoken";


const JWT_SECRET = process.env.JWT_SECRET || "fghfKDSJJfgrk#U$Y#@#($($4564553485734A";

export const classroomController = {
    getAllClassroom: async (req: Request, res: Response) => {
        try {
            const classroom = await prisma.classroom.findMany({
                include: {
                    teacher: true
                }
            });
            if (!classroom) {
                return res.status(404).json({ message: "ไม่พบห้องเรียน" });
            }
            return res.status(200).json(classroom);
        } catch (err) {
            console.log(err)
        }
    },
    getClassroomById: async (req: Request, res: Response) => {
        try {
            const { class_id } = req.params;
            const classroom = await prisma.classroom.findUnique({
                include: {
                    teacher: true
                },
                where: { class_id: class_id as string },
            });
            if (!classroom) {
                return res.status(404).json({ message: "ไม่พบห้องเรียน" });
            }
            return res.status(200).json(classroom);
        } catch (err) {
            console.log(err)
            return res.status(500).json({ message: "เกิดข้อผิดพลาดในเซิฟเวอร์" });
        }
    },
    getMyClassroom: async (req: Request, res: Response) => {
        try {
            const teacher_id = req.user?.user_id;
            const classrooms = await prisma.classroom.findMany({
                where: { teacher_id: teacher_id },
                include: {
                    teacher: {
                        select: {
                            name: true,
                            lastname: true,
                            email: true
                        }
                    },
                    students: {
                        include: {
                            student: {
                                select: {
                                    user_id: true,
                                    std_id: true,
                                    name: true,
                                    lastname: true,
                                    email: true,
                                    level: true
                                }
                            }
                        }
                    },
                    _count: {
                        select: {
                            students: true,
                            assignments: true
                        }
                    }
                }
            });

            if (!classrooms) {
                return res.status(404).json({ message: "ไม่พบห้องเรียน" });
            }

            const result = classrooms.map(cls => ({
                ...cls,
                studentList: cls.students.map(s => s.student),
                studentCount: cls._count.students,
                assignmentCount: cls._count.assignments
            }));

            return res.status(200).json(result);
        } catch (err) {
            console.log(err)
            return res.status(500).json({ message: "เกิดข้อผิดพลาดในเซิฟเวอร์" });
        }
    },
    getStudentsByClassroom: async (req: Request, res: Response) => {
        try {
            const { class_id } = req.params;
            const teacher_id = req.user?.user_id;

            const classroom = await prisma.classroom.findFirst({
                where: {
                    class_id: class_id,
                    teacher_id: teacher_id
                },
                include: {
                    students: {
                        include: {
                            student: {
                                select: {
                                    user_id: true,
                                    std_id: true,
                                    name: true,
                                    lastname: true,
                                    email: true,
                                    level: true
                                }
                            }
                        }
                    }
                }
            });

            if (!classroom) {
                return res.status(404).json({ message: "ไม่พบห้องเรียน หรือคุณไม่มีสิทธิ์เข้าถึงห้องเรียนนี้" });
            }

            const studentList = classroom.students.map(enrollment => enrollment.student);

            return res.status(200).json(studentList);
        } catch (err) {
            console.error("getStudentsByClassroom error:", err);
            return res.status(500).json({ message: "เกิดข้อผิดพลาดในเซิฟเวอร์" });
        }
    },
    createClassroom: async (req: Request, res: Response) => {
        try {
            const result = createClassroomSchema.safeParse(req.body);
            if (!result.success) {
                return res.status(400).json({ message: "กรุณาตรวจสอบข้อมูลให้ถูกต้อง", errors: result.error.flatten().fieldErrors, });
            }
            const { class_name, class_color, description, teacher_id } = result.data;
            const classroom = await prisma.classroom.create({
                data: {
                    class_name,
                    class_color: class_color || "#000000",
                    description,
                    teacher_id
                },
            });
            if (!classroom) {
                return res.status(500).json({ message: "เกิดข้อผิดพลาดในการสร้างห้องเรียน" });
            }
            return res.status(201).json({ message: "สร้างห้องเรียนสําเร็จ", classroom });
        } catch (err) {
            console.log(err)
            return res.status(500).json({ message: "เกิดข้อผิดพลาดในเซิฟเวอร์" });
        }
    },
    updateClassroom: async (req: Request, res: Response) => {
        try {
            const result = updateClassroomSchema.safeParse(req.body);
            const { class_id } = req.params;
            if (!class_id) {
                return res.status(400).json({ message: "กรุณาระบุ class_id" });
            }
            if (!result.success) {
                return res.status(400).json({ message: "กรุณาตรวจสอบข้อมูลให้ถูกต้อง", errors: result.error.flatten().fieldErrors, });
            }
            const { class_name, description, teacher_id, announce, class_color } = result.data;
            const classroom = await prisma.classroom.update({
                where: { class_id: class_id as string },
                data: {
                    class_name,
                    description,
                    teacher_id,
                    announce,
                    class_color: class_color ?? null,
                },
            });
            if (!classroom) {
                return res.status(404).json({ message: "ไม่พบห้องเรียน" });
            }
            return res.status(200).json({ message: "อัพเดตห้องเรียนสําเร็จ", classroom });
        } catch (err) {
            console.log(err)
            return res.status(500).json({ message: "เกิดข้อผิดพลาดในเซิฟเวอร์" });
        }
    },
    deleteClassroom: async (req: Request, res: Response) => {
        try {
            const { class_id } = req.params;
            const classroom = await prisma.classroom.findUnique({
                where: { class_id },
            });

            if (!classroom) {
                return res.status(404).json({ message: "ไม่พบห้องเรียน" });
            }

            await prisma.$transaction([
                prisma.submission.deleteMany({
                    where: {
                        assignment: {
                            class_id,
                        },
                    },
                }),
                prisma.assignmentAnalysis.deleteMany({
                    where: {
                        assignment: {
                            class_id,
                        },
                    },
                }),

                prisma.assignment.deleteMany({
                    where: { class_id },
                }),

                prisma.enrollment.deleteMany({
                    where: { class_id },
                }),

                prisma.classroom.delete({
                    where: { class_id },
                }),
            ]);

            return res.status(200).json({ message: "ลบห้องเรียนสําเร็จ" });

        } catch (err) {
            console.error("deleteClassroom error:", err);
            return res.status(500).json({ message: "เกิดข้อผิดพลาดในเซิฟเวอร์" });
        }
    },

}