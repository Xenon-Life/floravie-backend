require("dotenv").config();
const mongoose = require("mongoose");

const Users = require("./models/users");
const MoodTracker = require("./models/moodTracker");
const SymptomsTracker = require("./models/symptomsTracker");
const CycleTracker = require("./models/cycleTracker");

async function run() {
  const uri = (process.env.MongoUri || "").trim();
  if (!uri) {
    throw new Error("MongoUri is missing in .env");
  }

  await mongoose.connect(uri);

  // Use fixed ObjectIds so the tracker docs can reference a real user.
  const userId = new mongoose.Types.ObjectId("660c00000000000000000001");
  const doctorId = new mongoose.Types.ObjectId("660c00000000000000000002");

  await Users.deleteMany({ _id: { $in: [userId, doctorId] } });
  await MoodTracker.deleteMany({ postedBy: userId });
  await SymptomsTracker.deleteMany({ postedBy: userId });
  await CycleTracker.deleteMany({ postedBy: userId });

  await Users.create([
    {
      _id: userId,
      username: "Test User",
      email: "test.user@floravie.local",
      password: "123456",
      age: "25",
      number: "1234567890",
      role: "user",
      isFirstTimeUser: true,
      createdAt: new Date("2026-04-02T00:00:00.000Z"),
    },
    {
      _id: doctorId,
      username: "Dr. Sana Khan",
      email: "dr.sana@floravie.local",
      password: "123456",
      age: "34",
      number: "03001234567",
      role: "doctor",
      country: "Pakistan",
      practice: "OB/GYN",
      isFirstTimeUser: false,
      createdAt: new Date("2026-04-02T00:00:00.000Z"),
    },
  ]);

  await MoodTracker.create({
    postedBy: userId,
    moodStatus: [
      {
        id: "1",
        moodType: "Happy",
        moodImgUrl: "https://example.com/emoji/happy.png",
        timestamp: new Date("2026-04-02T08:00:00.000Z"),
      },
      {
        id: "3",
        moodType: "Tired",
        moodImgUrl: "https://example.com/emoji/tired.png",
        timestamp: new Date("2026-04-02T20:00:00.000Z"),
      },
    ],
    createdAt: new Date("2026-04-02T00:00:00.000Z"),
  });

  await SymptomsTracker.create({
    postedBy: userId,
    symptoms: [
      {
        id: 101,
        name: "Cramps",
        emojiUrl: "https://example.com/emoji/cramps.png",
        stars: 3,
        timestamp: new Date("2026-04-02T09:30:00.000Z"),
      },
      {
        id: 102,
        name: "Headache",
        emojiUrl: "https://example.com/emoji/headache.png",
        stars: 2,
        timestamp: new Date("2026-04-02T14:10:00.000Z"),
      },
    ],
    flow: [
      {
        id: 201,
        name: "Medium",
        stars: 2,
        timestamp: new Date("2026-04-02T09:30:00.000Z"),
      },
    ],
    discharge: [
      {
        id: 301,
        name: "Normal",
        stars: 0,
        timestamp: new Date("2026-04-02T09:30:00.000Z"),
      },
    ],
    reports: ["Mild cramps in the morning", "Hydrated and rested"],
    createdAt: new Date("2026-04-02T00:00:00.000Z"),
  });

  await CycleTracker.create({
    postedBy: userId,
    averageCycleLength: 28,
    averagePeriodLength: 5,
    cycleHistory: [
      {
        date: "2026-03-30",
        symptom: "Cramps",
        trackerType: "Period",
        timestamp: new Date("2026-03-30T09:00:00.000Z"),
      },
      {
        date: "2026-03-31",
        symptom: "Headache",
        trackerType: "Period",
        timestamp: new Date("2026-03-31T09:00:00.000Z"),
      },
      {
        date: "2026-04-01",
        symptom: "Low energy",
        trackerType: "Period",
        timestamp: new Date("2026-04-01T09:00:00.000Z"),
      },
    ],
    createdAt: new Date("2026-04-02T00:00:00.000Z"),
  });

  console.log("Seeded: users, moodtrackers, symptomstrackers, cycletrackers");
  await mongoose.disconnect();
}

run().catch(async (e) => {
  console.error(e);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});

