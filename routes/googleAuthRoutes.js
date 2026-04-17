const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const router = express.Router();
const isGoogleAuthEnabled =
  !!process.env.GOOGLE_CLIENT_ID &&
  !!process.env.GOOGLE_CLIENT_SECRET &&
  !!process.env.BACKEND_URL;

if (!isGoogleAuthEnabled) {
  const disabledHandler = (req, res) => {
    res.status(503).json({
      message: "Google authentication is not configured on the server.",
    });
  };

  router.get("/google", disabledHandler);
  router.get("/google/callback", disabledHandler);
} else {

// Route to initiate Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Route to handle the Google OAuth callback
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }), // Ensure session is false for JWT
  (req, res) => {
    // Generate JWT after Google OAuth success
    const payload = {
      _id: req.user._id,
      username: req.user.username,
      isFirstTimeUser: req.user.isFirstTimeUser,
    };
    const token = jwt.sign(payload, process.env.SECRETKEY, { expiresIn: "1h" });

    // Redirect to frontend with token in query parameter
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);
// Route to logout (optional)
router.get("/logout", (req, res) => {
  // Clear JWT from frontend storage on logout
  res.redirect(`${process.env.FRONTEND_URL}`);
});

}



module.exports = router;
