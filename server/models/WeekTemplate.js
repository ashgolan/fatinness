import mongoose from "mongoose";

const WeekTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slots: [
    {
      dateOffset: Number,
      startTime: String,
      endTime: String,
      capacity: Number,
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

// ✅ أنشئ الموديل الفعلي
const WeekTemplate = mongoose.model("WeekTemplate", WeekTemplateSchema);

export default WeekTemplate;
