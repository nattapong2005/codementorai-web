import nodemailer from 'nodemailer';
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS  
    }
});

export class EmailService {

    private static async sendMail(to: string, subject: string, htmlContent: string) {
        try {
            await transporter.sendMail({
                from: `"CodeMentor Notification" <${process.env.EMAIL_USER}>`,
                to,
                subject,
                html: htmlContent,
            });
            console.log(`ส่งอีเมลไปยัง ${to}`);
        } catch (error) {
            console.error('Error sending email:', error);
        }
    }

    static async notifyNewAssignment(studentEmails: string[], assignmentTitle: string, description: string, dueDate: Date) {
        const subject = `งานใหม่: ${assignmentTitle}`;
        const html = `
            <h3>มีงานใหม่เข้ามาครับ!</h3>
            <p>งาน: <strong>${assignmentTitle}</strong></p>
            <p>รายละเอียด: <strong>${description}</strong></p>
            <p>กำหนดส่ง: ${dueDate.toLocaleDateString('th-TH')}</p>
            <p>อย่าลืมเข้าไปดูรายละเอียดนะครับ</p>
        `;
        for (const email of studentEmails) {
            await this.sendMail(email, subject, html);
        }
    }

    static async notifySubmission(teacherEmail: string, studentName: string, assignmentTitle: string) {
        const subject = `มีการส่งงาน: ${assignmentTitle} โดย ${studentName}`;
        const html = `
            <p>นักเรียน <strong>${studentName}</strong> ได้ส่งงาน <strong>${assignmentTitle}</strong> แล้ว</p>
            <p>สามารถเข้าไปตรวจได้ที่ระบบครับ</p>
        `;
        await this.sendMail(teacherEmail, subject, html);
    }

    // 3. แจ้งเตือนนักเรียน: เมื่อตรวจงานเสร็จ
    static async notifyGraded(studentEmail: string, assignmentTitle: string, score: number) {
        const subject = `🎉 ตรวจงานแล้ว: ${assignmentTitle}`;
        const html = `
            <h3>ผลการตรวจงานมาแล้วครับ</h3>
            <p>งาน: ${assignmentTitle}</p>
            <p>คะแนนที่ได้: <strong>${score}</strong></p>
            <p>ดู Feedback เต็มๆ ได้ในเว็บไซต์</p>
        `;
        await this.sendMail(studentEmail, subject, html);
    }

    // 4. แจ้งเตือน: งานใกล้ครบกำหนด (ใช้กับ Cron Job)
    static async notifyUpcomingDeadline(studentEmail: string, assignmentTitle: string, timeLeft: string) {
        const subject = `⏳ เตือนความจำ: ${assignmentTitle} ครบกำหนดพรุ่งนี้`;
        const html = `
            <p>อย่าลืมส่งงาน <strong>${assignmentTitle}</strong> นะครับ</p>
            <p>เหลือเวลาอีกประมาณ: ${timeLeft}</p>
        `;
        await this.sendMail(studentEmail, subject, html);
    }
}