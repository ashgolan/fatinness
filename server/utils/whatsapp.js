import twilio from "twilio";

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

/**
 * 💬 إرسال رسالة واتساب
 */
export async function sendWhatsAppMessage(phone, message) {
  try {
    await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${phone}`,
      body: message,
    });
    console.log(`💬 تم إرسال رسالة واتساب إلى ${phone}`);
  } catch (err) {
    console.error("❌ خطأ أثناء إرسال واتساب:", err);
  }
}
