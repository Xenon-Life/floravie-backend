const CycleTracker = require("../models/cycleTracker");

exports.saveCycle = async (req, res) => {
  const { userId, customData } = req.body;

  try {
    const recordExists = await CycleTracker.findOne({ postedBy: userId });
    if (recordExists) {
      // Filter out entries that already exist in the database
      const newEntries = customData.filter((cycleData) => {
        return !recordExists.cycleHistory.some(
          (existingEntry) =>
            existingEntry.date === cycleData.date &&
            existingEntry.trackerType === cycleData.trackerType
        );
      });

      // If there are new entries, add them to the cycleHistory
      if (newEntries.length > 0) {
        recordExists.cycleHistory.push(
          ...newEntries.map((cycleData) => ({
            date: cycleData.date,
            symptom: cycleData.symptom,
            trackerType: cycleData.trackerType,
          }))
        );
        await recordExists.save();
        return res
          .status(200)
          .json({ message: "Cycle Tracker updated successfully!" });
      } else {
        return res.status(200).json({ message: "No new data to update." });
      }
    } else {
      const newCycleEntry = new CycleTracker({
        cycleHistory: customData.map((cycleData) => ({
          date: cycleData.date,
          symptom: cycleData.symptom,
          trackerType: cycleData.trackerType,
        })),
        postedBy: userId,
      });
      await newCycleEntry.save();
      return res
        .status(200)
        .json({ message: "Cycle Tracker created successfully!" });
    }
  } catch (error) {
    console.error("Error saving symptoms:", error);
    return res.status(500).send("Internal Server Error");
  }
};

exports.getCycle = async (req, res) => {
  const { userId } = req.params;
  console.log("ID:", userId);
  try {
    const data = await CycleTracker.findOne({ postedBy: userId });
    if (data) {
    console.log("data", data);
      return res
        .status(200)
        .json({
          data: data.cycleHistory,
          averageCycleLength: data.averageCycleLength,
          averagePeriodLength: data.averagePeriodLength,
        });
    } else {
      return res.status(200).json({ data: [] });
    }
  } catch (error) {
    console.error("Error getting mood data:", error);
    return res.status(500).send("Internal Server Error");
  }
};
