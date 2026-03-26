// src/test-email.ts
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: "nat.likeshop@gmail.com",
        pass: "bcdwnobpjcxgkdcl"
    }
});

async function testSend() {
    try {
        console.log("⏳ กำลังทดสอบส่งเมล...");
        const info = await transporter.sendMail({
            from: `"Test System" <${process.env.EMAIL_USER}>`,
            to: "azzzx30089@gmail.com", // เปลี่ยนเป็นอีเมลส่วนตัวของคุณเพื่อรับผล
            subject: "Test Email from CodeMentor",
            text: "ถ้าได้รับเมลนี้ แสดงว่า Nodemailer เชื่อมต่อสำเร็จ!",
            html: "<b>ถ้าได้รับเมลนี้ แสดงว่า Nodemailer เชื่อมต่อสำเร็จ!</b>"
        });
        console.log("✅ ส่งสำเร็จ! Message ID:", info.messageId);
    } catch (error) {
        console.error("❌ ส่งไม่ผ่าน:", error);
    }
}

testSend();