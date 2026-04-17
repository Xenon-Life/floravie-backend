const MoodTracker = require("../models/moodTracker");

exports.saveMood = async (req, res) => {
  const { userId, selectedLogMood } = req.body;

  console.log("USER ID ::::", userId);
  console.log("ARRAY ::::", selectedLogMood);

  try {
    const recordExists = await MoodTracker.findOne({ postedBy: userId });

    if (recordExists) {
      // If a record exists, append the new moods to the existing ones
      recordExists.moodStatus.push(
        ...selectedLogMood.map((mood) => ({
          id: mood.id.toString(),
          moodType: mood.name,
          moodImgUrl: mood.emojiUrl,
          timestamp: new Date(), // Add timestamp
        }))
      );

      await recordExists.save();
      return res.status(200).json({ message: "Mood updated successfully!" });
    } else {
      // If no record exists, create a new one
      const newMoodEntry = new MoodTracker({
        moodStatus: selectedLogMood.map((mood) => ({
          id: mood.id.toString(),
          moodType: mood.name,
          moodImgUrl: mood.emojiUrl,
          timestamp: new Date(), // Add timestamp
        })),
        postedBy: userId,
      });
      await newMoodEntry.save();
      return res
        .status(200)
        .json({ message: "Mood tracker created successfully!" });
    }
  } catch (error) {
    console.error("Error saving mood:", error);
    return res.status(500).send("Internal Server Error");
  }
};

exports.getMood = async (req, res) => {
  const { userId } = req.params;
  console.log("ID:", userId);
  try {
    const moodData = await MoodTracker.findOne({ postedBy: userId });
    if (moodData) {
      console.log("moodData", moodData);
      return res.status(200).json({ moodData });
    } else {
      return res.status(200).json({ moodData: [] });
    }
  } catch (error) {
    console.error("Error getting mood data:", error);
    return res.status(500).send("Internal Server Error");
  }
};
