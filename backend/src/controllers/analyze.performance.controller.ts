import { Request, Response } from 'express';
import { AIAnalysisService } from '../services/ai.performance.service';
import prisma from "../database/db";

export const analyzeController = {
    

    getClassAnalysis: async (req: Request, res: Response) => {
        try {
            const { assignment_id } = req.params;
            const { confirm, force } = req.query; 

            if (!assignment_id) {
                return res.status(400).json({ message: "ไม่พบ assignment_id" });
            }

            const existingData = await AIAnalysisService.getAnalysisResult(assignment_id);

            // ถ้ามีข้อมูลเดิมอยู่แล้ว และไม่ได้สั่ง force update ให้ส่งข้อมูลเดิมกลับไป
            if (existingData && force !== 'true') {
                return res.status(200).json({
                    success: true,
                    analyzed: true, 
                    // message: "ดึงข้อมูลจากฐานข้อมูลสำเร็จ",
                    data: existingData
                });
            }

            // ถ้าไม่มีข้อมูลเดิม และยังไม่ยืนยัน (confirm) ว่าจะวิเคราะห์ ให้แจ้งกลับไป
            // (กรณี force=true จะข้ามส่วนนี้ไปทำข้างล่างเลย)
            if (!existingData && confirm !== 'true') {
                return res.status(200).json({
                    success: true,
                    analyzed: false, 
                    message: "ยังไม่มีผลการวิเคราะห์ กรุณากดยืนยันเพื่อเริ่ม",
                    data: null
                });
            }

            // เริ่มการวิเคราะห์ (ทั้งกรณีทำครั้งแรก หรือ สั่ง force update)
            const newData = await AIAnalysisService.analyzeClassPerformance(assignment_id);
            return res.status(200).json({
                success: true,
                analyzed: true,
                message: force === 'true' ? "อัปเดตข้อมูลการวิเคราะห์เรียบร้อยแล้ว" : "วิเคราะห์และบันทึกข้อมูลเรียบร้อยแล้ว",
                data: newData
            });

        } catch (error) {
            console.error("Performance Analysis Error:", error);
            const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
            return res.status(500).json({
                success: false,
                message: "เกิดข้อผิดพลาดในการวิเคราะห์ผลงาน",
                error: errorMessage
            });
        }
    },
     getAllAnalysis: async (req: Request, res: Response) => {
        try {
            const analysis = await prisma.assignmentAnalysis.findMany()
            if(!analysis) return res.status(404).json({ message: "ไม่พบการวิเคราะห์" });
            return res.status(200).json(analysis);
        }catch(err) {
            console.error(err)
            return res.status(500).json({ message: "Internal Server Error" });
        }
     },
    getAnalysisById: async (req: Request, res: Response) => {
        try {
            const {analysis_id} = req.params;
            if (!analysis_id) {
                return res.status(400).json({ message: "ไม่พบ analysis_id" });
            }
            const analysis = await prisma.assignmentAnalysis.findUnique({
                where: { id: analysis_id as string },
            });
            if (!analysis) {
                return res.status(404).json({ message: "ไม่พบการวิเคราะห์" });
            }
            return res.status(200).json(analysis);  
        }catch(err: any) {
            console.error(err)
            return res.status(500).json({ message: "Internal Server Error" });
        }
    },
    deleteAnalasis: async (req: Request, res: Response) => {
        try {
            const {analysis_id} = req.params;
            const analysis = await prisma.assignmentAnalysis.delete({
                where: { id: analysis_id as string },
            });
            if (!analysis) {
                return res.status(404).json({ message: "ไม่พบการวิเคราะห์" });
            }
            return res.status(200).json({ message: "ลบการวิเคราะห์สําเร็จ" });  
        }catch(err: any) {
            console.error(err)
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }
};
