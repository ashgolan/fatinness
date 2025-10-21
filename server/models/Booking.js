import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  slot: { type: mongoose.Schema.Types.ObjectId, ref: "Slot", required: true },
  status: {
    type: String,
    enum: ["booked", "cancelled", "completed"],
    default: "booked",
  },
  createdAt: { type: Date, default: Date.now },
  paymentRef: String,
  reminderSent: { type: Boolean, default: false },
  calendarEventId: String, // id في Google Calendar إن وُجد
});

// 🟢 إضافة فهرس
BookingSchema.index({ user: 1, createdAt: 1 });

// 🟢 إنشاء النموذج
const Booking = mongoose.model("Booking", BookingSchema);

// 🟢 التصدير الصحيح
export default Booking;
