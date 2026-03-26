import { z } from 'zod';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';

const CodeQualitySchema = z.object({
    dimension: z.string().describe("ด้านที่ประเมิน (Indentation, Naming Convention, Comments)"),
    description: z.string().describe("คำอธิบายผลการประเมิน"),
    isAppropriate: z.boolean().describe("เหมาะสมหรือไม่ (true/false)"),
});

const BaseAnalysisSchema = z.object({
    score: z.number().describe("คะแนนที่ได้ (ประเมินจาก Correctness, Logic, Quality)"),
    feedback: z.string().describe("คำแนะนำ (ถ้าเป็นโหมด NONE ให้ส่งค่าว่าง)"),
    mistake_tags: z.array(z.string()).describe("Tag ข้อผิดพลาดหลัก (เช่น SyntaxError, LogicError, Typos)"),
    foundSyntaxError: z.boolean().describe("พบ Error ทางไวยากรณ์จนรันไม่ได้หรือไม่"),
    codeQuality: z.array(CodeQualitySchema).describe("ผลการประเมินคุณภาพโค้ด 3 ด้าน"),
});

const NoneResponseSchema = BaseAnalysisSchema;

const HintResponseSchema = BaseAnalysisSchema.extend({
    logicHint: z.string().describe("คำใบ้สั้นๆ เกี่ยวกับตรรกะที่ผิดพลาด (ห้ามเฉลยโค้ด)"),
});

const ConceptResponseSchema = BaseAnalysisSchema.extend({
    conceptExplanation: z.string().describe("อธิบายหลักการที่เข้าใจผิด หรือทฤษฎีที่เกี่ยวข้อง (1-2 ประโยค)"),
});

const AnswerResponseSchema = BaseAnalysisSchema.extend({
    logicError: z.string().describe("ระบุข้อผิดพลาดทางตรรกะที่พบ"),
    correctedCode: z.string().describe("โค้ดที่ได้รับการแก้ไขให้ถูกต้องแล้ว"),
    explanation: z.string().describe("คำอธิบายการแก้ไขอย่างละเอียด"),
});


export type AIAnalysisResponse = 
    | z.infer<typeof NoneResponseSchema>
    | z.infer<typeof HintResponseSchema>
    | z.infer<typeof ConceptResponseSchema>
    | z.infer<typeof AnswerResponseSchema>;

export type NoneResponse = z.infer<typeof NoneResponseSchema>;
export type HintResponse = z.infer<typeof HintResponseSchema>;
export type ConceptResponse = z.infer<typeof ConceptResponseSchema>;
export type AnswerResponse = z.infer<typeof AnswerResponseSchema>;


export const analyzeCodeWithAI = async (
    code: string,
    assignmentTitle: string,
    assignmentDescription: string,
    feedbackLevel: string, 
    fullScore: number
): Promise<AIAnalysisResponse> => {

    const model = google('gemini-flash-latest');

    try {
        let schema;
        let modeInstruction = "";

        switch (feedbackLevel) {
            case "NONE":
                schema = NoneResponseSchema;
                modeInstruction = "โหมด 'ไม่แสดง Feedback' (NONE): ไม่ต้องให้คำแนะนำใดๆ ในฟิลด์ 'feedback' ให้ส่งคืนเป็น string ว่าง (\"\") เท่านั้น ให้เน้นตรวจคะแนน (score) และคุณภาพโค้ด (codeQuality)";
                break;
            case "HINT":
                schema = HintResponseSchema;
                modeInstruction = "โหมด 'คำใบ้' (HINT): ในฟิลด์ 'logicHint' ให้ใบ้สั้นๆ ว่าควรแก้ตรงไหน ห้ามเฉลยโค้ดเด็ดขาด";
                break;
            case "CONCEPT":
                schema = ConceptResponseSchema;
                modeInstruction = "โหมด 'แนวคิด' (CONCEPT): ในฟิลด์ 'conceptExplanation' ให้อธิบายหลักการที่ผู้เรียนเข้าใจผิด (เน้นทฤษฎี)";
                break;
            case "ANSWER":
                schema = AnswerResponseSchema;
                modeInstruction = "โหมด 'เฉลย' (ANSWER): ให้ระบุจุดผิดใน 'logicError', แก้โค้ดใน 'correctedCode' และอธิบายใน 'explanation' แต่ถ้าไม่มีผิดพลาดใดๆ ให้ส่งคืนเป็น string ว่าง (\"\")";
                break;
            default:
                schema = HintResponseSchema;
                modeInstruction = "วิเคราะห์ความถูกต้องของโค้ดและให้คำแนะนำเพื่อปรับปรุง";
                break;
        }

        const systemPrompt = `
        คุณคือ "อาจารย์สอนเขียนโค้ด Python" ที่ใจดี เน้นอธิบายสั้นๆ เข้าใจง่าย เป็นกันเอง
        [ข้อมูลโจทย์]
        หัวข้อ: "${assignmentTitle}"
        คำอธิบาย: "${assignmentDescription}"
        คะแนนเต็ม: ${fullScore} คะแนน
        [เกณฑ์การให้คะแนน (Score)]
        คำนวณคะแนนจากคะแนนเต็ม ${fullScore} โดยพิจารณา:
        1. ความถูกต้อง (Correctness) 60%: ทำงานได้ตามโจทย์ ผลลัพธ์ถูก
        2. ลอจิก (Logic) 20%: วิธีแก้ปัญหาเหมาะสม ไม่ซับซ้อนเกิน
        3. คุณภาพโค้ด (Code Quality) 20%: การตั้งชื่อตัวแปร, ย่อหน้า, คอมเมนต์
        *หากมี Syntax Error จนรันไม่ได้ ให้คะแนน 0 ทันที*
        *หากโค้ดที่ส่งมาไม่เกี่ยวข้องกับโจทย์ ให้คะแนน 0 ทันที*
        [คำสั่งเพิ่มเติม]
        - ${modeInstruction}
        `;

        const result = await generateObject({
            model: model,
            schema: schema,
            system: systemPrompt,
            prompt: `นี่คือโค้ดของนักเรียน:\n\`\`\`python\n${code}\n\`\`\``,
        });

        const data = result.object;

        return {
            ...data,
            score: Math.min(data.score, fullScore)
        } as AIAnalysisResponse;

    } catch (error) {
        console.error("Gemini AI Error:", error);
        return {
            score: 0,
            feedback: "ระบบ AI ขัดข้องชั่วคราว",
            mistake_tags: ["SystemError"],
            foundSyntaxError: false,
            codeQuality: []
        } as NoneResponse;
    }
};