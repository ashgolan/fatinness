import twilio from "twilio";

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

/**
 * 🔹 إرسال رسالة واتساب عبر Twilio
 * @param {string} phone رقم الهاتف مع كود الدولة
 * @param {string} message النص المرسل
 */
export async function sendWhatsAppMessage(phone, message) {
  try {
    const to = `whatsapp:${phone.replace(/\s+/g, "")}`;
    const from = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;

    const response = await client.messages.create({
      from,
      to,
      body: message,
    });

    console.log(`✅ WhatsApp message sent to ${phone}`);
    return response;
  } catch (err) {
    console.error(`❌ Failed to send WhatsApp message to ${phone}:`, err.message);
  }
}
