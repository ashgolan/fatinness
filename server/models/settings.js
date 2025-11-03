import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema({
  maintenanceMode: {
    type: Boolean,
    default: false,
  },
});

export default mongoose.model("Settings", SettingsSchema);
