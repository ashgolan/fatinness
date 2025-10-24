import nodemailer from "nodemailer";

/**
 * ✉️ إعداد المرسل
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * ✉️ إرسال بريد إلكتروني
 */
export async function sendEmail(to, subject, text, html) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Fateness Studio" <noreply@studio.com>`,
      to,
      subject,
      text,
      html,
    });
    console.log(`📧 تم إرسال بريد إلى ${to}`);
  } catch (err) {
    console.error("❌ خطأ أثناء إرسال البريد:", err);
  }
}
