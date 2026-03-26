import cron from 'node-cron';
import prisma from "../database/db";

// ตั้งเวลาให้รัน "ทุกวัน ตอน 8 โมงเช้า" (0 8 * * *)
export const startReminderJob = () => {
    console.log("Starting cron job...");
    cron.schedule('0 8 * * *', async () => {
        console.log('Running Daily Deadline Check...');

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1); // วันพรุ่งนี้
        
        const startOfDay = new Date(tomorrow.setHours(0,0,0,0));
        const endOfDay = new Date(tomorrow.setHours(23,59,59,999));

        try {
            // ค้นหางานที่จะครบกำหนด "ในวันพรุ่งนี้"
            const upcomingAssignments = await prisma.assignment.findMany({
                where: {
                    due_date: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                },
                include: {
                    // สมมติว่า assignment เชื่อมกับ students ผ่าน course หรือ enrollment
                    // ตัวอย่าง: ดึงนักเรียนที่ยังไม่ได้ส่งงาน (status != COMPLETED)
                }
            });

            for (const assignment of upcomingAssignments) {
                // ตัวอย่าง: ดึง user ทั้งหมด แล้วกรองคนที่ยังไม่ส่ง (Logic ขึ้นอยู่กับ DB Schema คุณ)
                // สมมติว่าได้รายชื่อ studentEmailsToNotify มาแล้ว
                
                // EmailService.notifyUpcomingDeadline(email, assignment.title, "1 วัน");
            }

        } catch (error) {
            console.error('Cron Job Error:', error);
        }
    });
};