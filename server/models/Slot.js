import mongoose from "mongoose";

const SlotSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  capacity: { type: Number, default: 20 },
  isBlocked: { type: Boolean, default: false },
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: "WeekTemplate" },
  createdAt: { type: Date, default: Date.now },
});

SlotSchema.index({ date: 1, startTime: 1 }, { unique: true });

const Slot = mongoose.model("Slot", SlotSchema);

export default Slot;
