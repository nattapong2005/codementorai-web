import type { Response, Request } from "express";
import prisma from "../database/db";
import bcrypt from "bcryptjs";
import { createUserSchema, updateUserSchema } from "../types/user";


export const userController = {
    getAllUser: async (req: Request, res: Response) => {
        try {
            const user = await prisma.users.findMany();
            if (!user) {
                return res.status(404).json({ message: "ไม่พบผู้ใช้" });
            }
            return res.status(200).json(user);
        } catch (err) {
            console.log(err)
        }
    },
    getUserById: async (req: Request, res: Response) => {
        try {
            const { user_id } = req.params;
            const user = await prisma.users.findUnique({
                where: { user_id: user_id as string },
            });
            if (!user) {
                return res.status(404).json({ message: "ไม่พบข้อมูลนักเรียน" });
            }
            return res.status(200).json(user);
        } catch (err) {
            console.log(err)
        }
    },
    // createUser: async (req: Request, res: Response) => {
    //     try {
    //         const result = createUserSchema.safeParse(req.body);
    //         console.log(req.body)
    //         if (!result.success) {
    //             return res.status(400).json({ message: "กรุณาตรวจสอบข้อมูลให้ถูกต้อง", errors: result.error.flatten().fieldErrors, });
    //         }
    //         const { name, lastname, email, password, level, role } = result.data;
    //         const existingUser = await prisma.users.findUnique({
    //             where: { email },
    //         });
    //         if (existingUser) {
    //             return res.status(400).json({ message: "อีเมลนี้ถูกใช้ไปแล้ว" });
    //         }
    //         const hashedPassword = await bcrypt.hash(password, 10)
    //         const user = await prisma.users.create({
    //             data: {
    //                 name,
    //                 lastname,
    //                 email,
    //                 password: hashedPassword,
    //                 level,
    //                 role,
    //             },
    //         });
    //         if (!user) {
    //             return res.status(500).json({ message: "เกิดข้อผิดพลาดในการสร้างผู้ใช้" });
    //         }
    //         return res.status(201).json({ message: "สร้างผู้ใช้สำเร็จ", user });
    //     } catch (err) {
    //         console.log(err)
    //     }
    // },
    createUserwithEnrollment: async (req: Request, res: Response) => {
        try {
            const result = createUserSchema.safeParse(req.body);

            if (!result.success) {
                return res.status(400).json({
                    message: "กรุณาตรวจสอบข้อมูลให้ถูกต้อง",
                    errors: result.error.flatten().fieldErrors,
                });
            }
            const {
                std_id,
                name,
                lastname,
                email,
                password,
                level,
                role,
                classroom_id,
            } = result.data;

            const existingUser = await prisma.users.findUnique({
                where: { email },
            });

            if (existingUser) {
                return res.status(400).json({
                    message: "อีเมลนี้ถูกใช้ไปแล้ว",
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const user = await prisma.users.create({
                data: {
                    std_id,
                    name,
                    lastname,
                    email,
                    password: hashedPassword,
                    level,
                    role,

                    ...(role === "STUDENT" && classroom_id && {
                        enrollments: {
                            create: {
                                class_id: classroom_id,
                            },
                        },
                    }),
                },
                include: {
                    enrollments: true,
                },
            });

            return res.status(201).json({
                message: "สร้างผู้ใช้สำเร็จ",
                user,
            });
        } catch (err) {
            console.error(err);
            return res.status(500).json({
                message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
            });
        }
    },

    updateUser: async (req: Request, res: Response) => {
        try {
            const result = updateUserSchema.safeParse(req.body);
            const { user_id } = req.params;
            if (!user_id) {
                return res.status(400).json({ message: "กรุณาระบุ user_id" });
            }
            if (!result.success) {
                return res.status(400).json({ message: "กรุณาตรวจสอบข้อมูลให้ถูกต้อง", errors: result.error.flatten().fieldErrors, });
            }

            const { std_id, name, lastname, email, password, level, role } = result.data;

            let hashedPassword = password;
            if (password) {
                hashedPassword = await bcrypt.hash(password, 10);
            }

            const user = await prisma.users.update({
                where: { user_id: user_id as string },
                data: {
                    std_id,
                    name,
                    lastname,
                    email,
                    password: hashedPassword,
                    level,
                    role,
                },
            });
            if (!user) {
                return res.status(404).json({ message: "ไม่พบผู้ใช้" });
            }
            return res.status(200).json({ message: "อัพเดตผู้ใช้สําเร็จ", user });
        } catch (err) {
            console.log(err)
        }
    },
    deleteUser: async (req: Request, res: Response) => {
        try {
            const { user_id } = req.params;
            if (!user_id) {
                return res.status(400).json({ message: "กรุณาระบุ user_id" });
            }

            const deleteEnrollment = await prisma.enrollment.deleteMany({
                where: { student_id: user_id as string },
            })

            if (!deleteEnrollment) {
                return res.status(404).json({ message: "ลบการลงทะเบียนไม่สําเร็จ" });
            }

            const user = await prisma.users.delete({
                where: { user_id: user_id as string },
            });
            if (!user) {
                return res.status(404).json({ message: "ไม่พบผู้ใช้" });
            }
            return res.status(200).json({ message: "ลบผู้ใช้สําเร็จ" });
        } catch (err) {
            console.log(err)
        }
    },
    getMe: async (req: Request, res: Response) => {
        if (!req.user) {
            return res.status(401).json({ message: "ไม่พบข้อมูลผู้ใช้" });
        }
        const user = await prisma.users.findUnique({ where: { user_id: req.user.user_id } });
        if (!user) {
            return res.status(500).json({ message: "เกิดข้อผิดพลาดในเซิฟเวอร์" });
        }
        return res.status(200).json(user);
    },
    getAllStudent: async (req: Request, res: Response) => {
        try {
            const students = await prisma.users.findMany({
                where: { role: "STUDENT" },
            });
            if (!students) {
                return res.status(404).json({ message: "ไม่พบรายชื่อนักเรียน" });
            }
            return res.status(200).json(students);
        } catch (err) {
            console.log(err)
        }
    },

}