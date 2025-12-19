// server/debug/time.debug.js
import { DateTime } from "luxon";
import mongoose from "mongoose";

console.log("=======================================");
console.log("🕒 TIME DEBUG – SERVER");
console.log("=======================================");

// ----------------------------------------
// 1) Node / OS
// ----------------------------------------
console.log("\n🔹 Node & OS");
console.log("Node version:", process.version);
console.log("Server TZ env:", process.env.TZ || "❌ not set");
console.log("Intl timezone:", Intl.DateTimeFormat().resolvedOptions().timeZone);

// ----------------------------------------
// 2) Native JS Date
// ----------------------------------------
const now = new Date();
console.log("\n🔹 Native Date");
console.log("Date():", now.toString());
console.log("Date ISO:", now.toISOString());
console.log("Date getTimezoneOffset (min):", now.getTimezoneOffset());

// ----------------------------------------
// 3) Luxon
// ----------------------------------------
console.log("\n🔹 Luxon");

const luxonLocal = DateTime.local();
const luxonUTC = DateTime.utc();

console.log("Luxon local:", luxonLocal.toISO());
console.log("Luxon local zone:", luxonLocal.zoneName);
console.log("Luxon UTC:", luxonUTC.toISO());

const luxonJerusalem = DateTime.now().setZone("Asia/Jerusalem");
console.log("Luxon Asia/Jerusalem:", luxonJerusalem.toISO());

// ----------------------------------------
// 4) Comparison test
// ----------------------------------------
console.log("\n🔹 Comparison test (same moment)");

console.log("JS Date ISO:", now.toISOString());
console.log("Luxon from JS Date:", DateTime.fromJSDate(now).toISO());
console.log(
  "Luxon from JS Date (Jerusalem):",
  DateTime.fromJSDate(now).setZone("Asia/Jerusalem").toISO()
);

// ----------------------------------------
// 5) MongoDB (optional)
// ----------------------------------------
async function mongoTest() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const testDate = new Date();
    const TestSchema = new mongoose.Schema(
      { testDate: Date },
      { timestamps: true }
    );

    const Test = mongoose.model("TimeTest", TestSchema);

    const doc = await Test.create({ testDate });

    const fromDb = await Test.findById(doc._id);

    console.log("\n🔹 MongoDB");
    console.log("Saved Date:", testDate.toISOString());
    console.log("DB testDate:", fromDb.testDate.toISOString());
    console.log("DB createdAt:", fromDb.createdAt.toISOString());
    console.log("DB updatedAt:", fromDb.updatedAt.toISOString());

    await Test.deleteMany({});
    await mongoose.disconnect();
  } catch (err) {
    console.log("\n⚠️ MongoDB test skipped");
    console.log(err.message);
  }
}

await mongoTest();

console.log("\n✅ TIME DEBUG FINISHED");
console.log("=======================================");
