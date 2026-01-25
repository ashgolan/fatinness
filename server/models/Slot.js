import mongoose from "mongoose";

const SlotSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    default: "", // اختياري
  },
  date: { type: Date, required: true },
  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true },
  capacity: { type: Number, default: 20 },
  isBlocked: { type: Boolean, default: false },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },

  deletedAt: {
    type: Date,
    default: null,
  },

  templateId: { type: mongoose.Schema.Types.ObjectId, ref: "WeekTemplate" },
  createdAt: { type: Date, default: Date.now },
});

SlotSchema.index({ startAt: 1, endAt: 1 }, { unique: true });

const Slot = mongoose.model("Slot", SlotSchema);

export default Slot;
