/**
 * Seed dummy clinic locations into MongoDB.
 * Run: node seed-clinics.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Clinic = require("./models/clinic");
const clinicsSeed = require("./data/clinicsSeed");

const uri = process.env.MongoUri || "mongodb://127.0.0.1:27017/floravie_db";

async function seed() {
  await mongoose.connect(uri);
  console.log("Connected for clinic seed...");

  await Clinic.deleteMany({});
  const created = await Clinic.insertMany(clinicsSeed);
  console.log(`Seeded ${created.length} clinics.`);

  await mongoose.disconnect();
  console.log("Done.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
