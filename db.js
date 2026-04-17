const mongoose = require("mongoose");
module.exports = () => {
  const uri = process.env.MongoUri;
  if (!uri) {
    console.warn("[db] MongoUri is missing. Database connection is skipped.");
    return;
  }

  mongoose
    .connect(uri)
    .then(() => {
      console.log("Connected to Floravie database");
    })
    .catch((error) => {
      console.error(`Error connecting ${error}`);
    });
};
