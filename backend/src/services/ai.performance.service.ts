import { z } from 'zod';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import prisma from "../database/db";

const StudentInsightSchema = z.object({
    studentName: z.string().describe("ชื่อ-นามสกุล ของนักเรียน"),
    reason: z.string().describe("เหตุผลประกอบ (วิเคราะห์จากโค้ดหรือผลการประเมินของเขา)"),
});

export const ClassAnalysisSchema = z.object({
    overallStrengths: z.string().describe("จุดเด่นของนักเรียนในภาพรวม (ความเข้าใจโจทย์, Logic, Coding Practice)"),
    overallWeaknesses: z.string().describe("จุดที่ควรพัฒนาในภาพรวม (Common mistakes, Logic errors, สิ่งที่นักเรียนส่วนใหญ่ยังไม่เข้าใจ)"),
    studentsNeedingHelp: z.array(StudentInsightSchema).describe("รายชื่อนักเรียนที่ควรได้รับการฝึกเพิ่มเติม พร้อมเหตุผล (ถ้ามี)"),
    topPerformers: z.array(StudentInsightSchema).describe("รายชื่อนักเรียนที่ทำงานนี้ได้ดี พร้อมเหตุผล (ถ้ามี)"),
});

export type ClassAnalysisResponse = z.infer<typeof ClassAnalysisSchema>;

export class AIAnalysisService {

    static async analyzeClassPerformance(assignmentId: string): Promise<ClassAnalysisResponse> {

        const assignment = await prisma.assignment.findUnique({
            where: { assignment_id: assignmentId },
            include: {
                submissions: {
                    where: {
                        code: { not: "" } // กรองเอาเฉพาะคนที่มีโค้ดส่งมา
                    },
                    include: {
                        student: true
                    }
                }
            }
        });

        if (!assignment) {
            throw new Error("ไม่พบข้อมูลงาน");
        }

        const submissions = assignment.submissions;

        if (submissions.length === 0) {
            throw new Error("ยังไม่พบการส่งงาน");
        }

        const studentsDataPrompt = submissions.map((sub, index) => {
            const studentName = sub.student ? `${sub.student.name} ${sub.student.lastname}` : `Student ${index + 1}`;
            
            // ดึงข้อมูล feedback เดิมมาใช้ (ถ้ามี) เพื่อลดความยาว prompt และเพิ่มความแม่นยำ
            let feedbackSummary = "";
            if (sub.ai_feedback) {
                const fb = typeof sub.ai_feedback === 'string' ? JSON.parse(sub.ai_feedback) : sub.ai_feedback;
                feedbackSummary = `[ผลประเมินเดิม]: ${fb.feedback || ""} ${fb.mistake_tags ? `(Tags: ${fb.mistake_tags.join(", ")})` : ""}`;
            }

            // ส่งโค้ดไปเฉพาะส่วนที่จำเป็น (ตัดให้สั้นลงถ้าโค้ดยาวมาก)
            const codeSnippet = sub.code ? sub.code.substring(0, 1500) : "(No code content)";
            
            return `
            [ชื่อนักเรียน]: ${studentName}
            [คะแนน]: ${sub.score || "ยังไม่ตรวจ"}
            ${feedbackSummary}
            [โค้ด]: 
            ${codeSnippet} 
            ------------------------------------------------
            `;
        }).join("\n");

        const model = google('gemini-flash-latest');

        const prompt = `
        คุณคืออาจารย์ผู้เชี่ยวชาญด้านการสอนเขียนโปรแกรม Python
        จงวิเคราะห์ผลงานของนักเรียนทุกคนในชั้นเรียนสำหรับหัวข้อ: "${assignment.title}"
        คำอธิบายโจทย์: "${assignment.description}"

        ข้อมูลผลงานของนักเรียนทุกคน:
        ${studentsDataPrompt}

        คำสั่ง:
        1. วิเคราะห์จุดเด่นและจุดด้อยในภาพรวมของทั้งห้องเรียน (Common Patterns)
        2. คัดเลือกนักเรียนที่ "ควรฝึกเพิ่มเติม" (พิจารณาจาก Logic ที่ผิดพลาดบ่อยหรือคะแนนน้อย)
        3. คัดเลือกนักเรียนที่ "ทำได้ดีเยี่ยม" (พิจารณาจากความสะอาดของโค้ดหรือ Logic ที่ซับซ้อน)
        4. หากนักเรียนส่วนใหญ่ผิดพลาดในจุดเดียวกัน ให้ระบุใน "จุดที่ควรพัฒนาในภาพรวม" เพื่อให้อาจารย์นำไปสอนเสริมได้ถูกจุด
        
        ตอบเป็น JSON ตาม Schema ที่กำหนด
        `;

        try {
            const result = await generateObject({
                model: model,
                schema: ClassAnalysisSchema,
                prompt: prompt,
            });

            const analysisData = result.object;

            await prisma.assignmentAnalysis.upsert({
                where: {
                    assignment_id: assignmentId
                },
                update: {
                    overall_strengths: analysisData.overallStrengths,
                    overall_weaknesses: analysisData.overallWeaknesses,
                    students_needing_help: analysisData.studentsNeedingHelp,
                    top_performers: analysisData.topPerformers,
                },
                create: {
                    assignment_id: assignmentId,
                    overall_strengths: analysisData.overallStrengths,
                    overall_weaknesses: analysisData.overallWeaknesses,
                    students_needing_help: analysisData.studentsNeedingHelp,
                    top_performers: analysisData.topPerformers
                }
            });

            return analysisData;

        } catch (error) {
            console.error("AI Analysis Error:", error);
            throw new Error("เกิดข้อผิดพลาดในการวิเคราะห์");
        }
    }

    static async getAnalysisResult(assignmentId: string) {
        const result = await prisma.assignmentAnalysis.findUnique({
            where: { assignment_id: assignmentId }
        });
        if (!result) return null;
        return {
            overallStrengths: result.overall_strengths,
            overallWeaknesses: result.overall_weaknesses,
            studentsNeedingHelp: result.students_needing_help,
            topPerformers: result.top_performers
        } as ClassAnalysisResponse;
    }
}
