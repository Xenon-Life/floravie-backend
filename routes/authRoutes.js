const express = require("express");
const authController = require("../controllers/authController");
const authenticateJWT = require("../middleware/authenticateJWT");
const router = express.Router();

router.post("/sign-up", authController.signup);

router.post("/sign-in", authController.signin);
router.post("/forgotPassword", authController.forgotPassword);
router.post("/resetPassword", authController.resetPassword);
router.get("/is-first-time-user/:id", authController.getFirstTimeUserStatus);

router.post("/save-onboarding", authenticateJWT, authController.onboarding);

router.post("/validate-token", authenticateJWT, (req, res) => {
  res.status(200).json({ message: "Token is valid", user: req.user });
});
router.get("/allusers", authController.allusers);
router.put("/user/:id", authController.updateUser);
router.delete("/user/:id", authController.deleteUser);
router.get("/user/:id", authController.getUser);

module.exports = router;
