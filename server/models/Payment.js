import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
  provider: String,
  providerPaymentId: String,
  amount: Number,
  status: {
    type: String,
    enum: ["pending", "succeeded", "failed"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});
const Payment = mongoose.model("Payment", PaymentSchema);
export default Payment;
