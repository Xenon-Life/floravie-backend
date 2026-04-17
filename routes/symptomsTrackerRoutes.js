const express = require("express");
const authenticateJWT = require("../middleware/authenticateJWT");
const symptomsTrackerController = require("../controllers/symptomsTrackerController");
const router = express.Router();

router.post("/save", authenticateJWT, symptomsTrackerController.saveSymptoms);
router.get("/get/:userId", authenticateJWT, symptomsTrackerController.getSymptoms);
module.exports = router;
