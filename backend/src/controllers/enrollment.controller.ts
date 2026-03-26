import type { Response, Request } from "express";
import prisma from "../database/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fghfKDSJJfgrk#U$Y#@#($($4564553485734A";

export const enrollController = {
    getAllEnrollment: async (req: Request, res: Response) => {
        try {
            const enrollment = await prisma.enrollment.findMany();
            if (!enrollment) {
                return res.status(404).json({ message: "ไม่พบการลงทะเบียน" });
            }
            return res.status(200).json(enrollment);
        } catch (err) {
            console.log(err)
        }
    },
    getEnrollmentByClassId: async (req: Request, res: Response) => {
        try {
            const { classroom_id } = req.params;

            const enrollment = await prisma.enrollment.findMany({
                where: {
                    class_id: classroom_id as string
                },
                include: {
                    student: {
                        select: {
                            user_id: true,
                            std_id: true,
                            name: true,
                            lastname: true,
                            email: true,
                            level: true,
                            role: true
                        }
                    }
                }
            });

            if (enrollment.length === 0) {
                return res.status(404).json({ message: "ไม่พบการลงทะเบียน" });
            }

            return res.status(200).json(enrollment);
        } catch (err) {
            console.log(err);
            return res.status(500).json({ message: "เกิดข้อผิดพลาด" });
        }
    },
    getMyEnrollment: async (req: Request, res: Response) => {
        try {
            const token = req.cookies.auth_token;
            if (!token) return res.status(401).json({ message: "ไม่พบ Token" });
            const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
            const user_id = decoded.user_id;
            const result = await prisma.enrollment.findMany({
                where: { student_id: user_id },
                include: {
                    classroom: {
                        include: {
                            teacher: {
                                select: { name: true, lastname: true }
                            }
                        }
                    }
                }
            });
            res.json(result);
        } catch (err) {
            console.log(err);
            res.status(500).json({ message: "เกิดข้อผิดพลาดในเซิฟเวอร์" });
        }
    },
    createEnrollment: async (req: Request, res: Response) => {
        try {
            const { class_id, student_id } = req.body;
            if (!class_id || !student_id) {
                return res.status(400).json({ message: "กรุณาระบุ class_id และ student_id" });
            }

            const existingEnrollment = await prisma.enrollment.findUnique({
                where: {
                    class_id_student_id: {
                        class_id,
                        student_id
                    }
                }
            });

            if (existingEnrollment) {
                return res.status(400).json({ message: "ผู้เรียนคนนี้อยู่ในห้องเรียนนี้อยู่แล้ว" });
            }

            const enrollment = await prisma.enrollment.create({
                data: {
                    class_id,
                    student_id
                }
            });

            return res.status(201).json({ message: "เพิ่มผู้เรียนเข้าห้องเรียนสำเร็จ", enrollment });
        } catch (err) {
            console.log(err);
            return res.status(500).json({ message: "เกิดข้อผิดพลาดในเซิฟเวอร์" });
        }
    },
    getStudentsNotEnrolled: async (req: Request, res: Response) => {
    try {
        const { class_id } = req.params;
        // ค้นหา Users ที่เป็น STUDENT และยังไม่เคยลงทะเบียนใน class_id นี้
        const students = await prisma.users.findMany({
            where: {
                role: 'STUDENT', // กรองเฉพาะนักเรียน
                enrollments: {
                    none: {
                        class_id: class_id // ต้องไม่มี enrollment ที่ class_id ตรงกับที่ส่งมา
                    }
                }
            },
            // เลือกเฉพาะ field ที่จำเป็น
            select: {
                user_id: true,
                std_id: true,
                name: true,
                lastname: true,
                email: true,
                level: true
            }
        });

        return res.status(200).json(students);
    } catch (err) {
        console.error("getStudentsNotEnrolled error:", err);
        return res.status(500).json({ message: "เกิดข้อผิดพลาดในเซิฟเวอร์" });
    }
},
}