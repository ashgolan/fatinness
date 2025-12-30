import Agenda from "agenda";

export const agenda = new Agenda({
  db: {
    address: process.env.MONGO_URI,
    collection: "agendaJobs",
  },
  processEvery: "1 minute",
});

agenda.on("ready", () => {
  console.log("📆 Agenda connected to MongoDB");
});

agenda.on("error", (err) => {
  console.error("❌ Agenda error:", err);
});
