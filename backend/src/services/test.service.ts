import cron from 'node-cron';
import prisma from "../database/db";
import { EmailService } from '../services/email.service';

export const testCron = () => {
    console.log("🚀 Cron Job Service started...");

    // [TEST MODE] รันทุกนาทีเพื่อทดสอบ (อย่าลืมแก้เป็น '0 8 * * *' เมื่อใช้จริง)
    cron.schedule('* * * * *', async () => {
        console.log('⏰ [Cron] Checking for assignments due tomorrow...');

        // 1. คำนวณเวลา "วันพรุ่งนี้"
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const startOfDay = new Date(tomorrow.setHours(0, 0, 0, 0));
        const endOfDay = new Date(tomorrow.setHours(23, 59, 59, 999));

        try {
            // 2. หางานที่ครบกำหนดพรุ่งนี้
            const upcomingAssignments = await prisma.assignment.findMany({
                where: {
                    due_date: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                }
            });

            console.log(`🔎 Found ${upcomingAssignments.length} assignments due tomorrow.`);

            for (const assignment of upcomingAssignments) {
                // 3.1 ดึงนักเรียน "ทั้งหมด" ในคลาส
                const allEnrollments = await prisma.enrollment.findMany({
                    where: { class_id: assignment.class_id },
                    include: { student: { select: { user_id: true, email: true } } }
                });

                // 3.2 ดึงนักเรียนที่ "ส่งงานแล้ว" เฉพาะงานนี้
                const submittedWork = await prisma.submission.findMany({
                    where: { 
                        assignment_id: assignment.assignment_id 
                    },
                    select: { student_id: true } // เอามาแค่ ID ก็พอ
                });

                // สร้าง Set ของ ID คนที่ส่งแล้ว เพื่อให้เช็คข้อมูลได้เร็ว
                const submittedStudentIds = new Set(submittedWork.map(s => s.student_id));

                // 3.3 กรองหา "คนที่ยังไม่ส่ง" (Pending Students)
                // คือคนที่มีใน Enrollment แต่ "ไม่มี" ใน submittedStudentIds
                const pendingStudents = allEnrollments.filter(enrollment => {
                    // ต้องเช็ค enrollment.student_id (หรือ enrollment.student.user_id ตาม schema คุณ)
                    return enrollment.student && !submittedStudentIds.has(enrollment.student_id);
                });

                const pendingEmails = pendingStudents
                    .map(e => e.student?.email)
                    .filter((email): email is string => !!email);

                // 4. ส่งแจ้งเตือนเฉพาะคนที่ยังไม่ส่ง
                if (pendingEmails.length > 0) {
                    console.log(`📨 Alerting ${pendingEmails.length} students who haven't submitted "${assignment.title}" yet.`);
                    
                    // วนลูปส่งรายคน (หรือจะปรับ Service ให้รับ Array ก็ได้)
                    for (const email of pendingEmails) {
                        await EmailService.notifyUpcomingDeadline(
                            email, 
                            assignment.title, 
                            "1 วัน"
                        );
                    }
                } else {
                    console.log(`✅ Everyone has submitted "${assignment.title}". No alerts needed.`);
                }
            }

        } catch (error) {
            console.error('❌ Cron Job Error:', error);
        }
    });
};