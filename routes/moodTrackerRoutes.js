const express = require("express");
const authenticateJWT = require("../middleware/authenticateJWT");
const moodTrackerController = require("../controllers/moodTrackerController");
const router = express.Router();

router.post("/save", authenticateJWT, moodTrackerController.saveMood);
router.get("/get/:userId", authenticateJWT, moodTrackerController.getMood);
module.exports = router;
