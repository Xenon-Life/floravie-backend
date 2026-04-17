require("dotenv").config();
const mongoose = require("mongoose");
const Users = require("./models/users");

async function run() {
  const uri = (process.env.MongoUri || "mongodb://127.0.0.1:27017/floravie_db").trim();
  await mongoose.connect(uri);

  await Users.create([
    {
      username: "Test User",
      email: "test@example.com",
      password: "123456",
      age: "25",
      number: "1234567890",
      role: "user",
    },
  ]);

  console.log("Seeded users");
  await mongoose.disconnect();
}

run().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect();
  process.exit(1);
});