const SymptomsTracker = require("../models/symptomsTracker");

exports.saveSymptoms = async (req, res) => {
  const { userId, symptoms, flow, discharge } = req.body;

  console.log("Received symptoms:", symptoms);
  console.log("User ID:", userId);

  try {
    // Find an existing record for the user
    const recordExists = await SymptomsTracker.findOne({ postedBy: userId });

    if (recordExists) {
      // If a record exists, update it
      recordExists.symptoms.push(
        ...symptoms.map((symptom) => ({
          id: symptom.id,
          name: symptom.name,
          emojiUrl: symptom.emojiUrl,
          stars: symptom.stars,
        }))
      );
      recordExists.flow.push(
        ...flow.map((f) => ({
          id: f.id,
          name: f.name,
          emojiUrl: f.emojiUrl,
          stars: f.stars,
        }))
      );
      recordExists.discharge.push(
        ...discharge.map((d) => ({
          id: d.id,
          name: d.name,
          emojiUrl: d.emojiUrl,
          stars: d.stars,
        }))
      );
      await recordExists.save();
      return res
        .status(200)
        .json({ message: "Symptoms updated successfully!" });
    } else {
      // If no record exists, create a new one
      const newSymptomsEntry = new SymptomsTracker({
        symptoms: symptoms.map((symptom) => ({
          id: symptom.id,
          name: symptom.name,
          emojiUrl: symptom.emojiUrl,
          stars: symptom.stars,
        })),
        flow: flow.map((f) => ({
          id: f.id,
          name: f.name,
          emojiUrl: f.emojiUrl,
          stars: f.stars,
        })),
        discharge: discharge.map((d) => ({
          id: d.id,
          name: d.name,
          emojiUrl: d.emojiUrl,
          stars: d.stars,
        })),
        postedBy: userId,
      });
      await newSymptomsEntry.save();
      return res
        .status(200)
        .json({ message: "Symptoms tracker created successfully!" });
    }
  } catch (error) {
    console.error("Error saving symptoms:", error);
    return res.status(500).send("Internal Server Error");
  }
};
exports.getSymptoms = async (req, res) => {
  const { userId } = req.params;
  try {
    const symptomsData = await SymptomsTracker.findOne({ postedBy: userId });
    if (symptomsData) {
      return res.status(200).json({
        symptoms: symptomsData.symptoms.map((symptom) => ({
          ...symptom._doc,
          createdAt: symptomsData.createdAt, // Add createdAt
        })),
      });
    } else {
      return res.status(200).json({ symptoms: [] });
    }
  } catch (error) {
    console.error("Error getting mood data:", error);
    return res.status(500).send("Internal Server Error");
  }
};
