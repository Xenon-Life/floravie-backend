const express = require("express");
const authenticateJWT = require("../middleware/authenticateJWT");
const cycleTrackerController = require("../controllers/cycleTrackerController");
const router = express.Router();

router.post("/save", authenticateJWT, cycleTrackerController.saveCycle);
router.get("/get/:userId", authenticateJWT, cycleTrackerController.getCycle);


module.exports = router;
