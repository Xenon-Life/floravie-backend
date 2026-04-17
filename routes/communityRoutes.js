const express = require("express");
const authenticateJWT = require("../middleware/authenticateJWT");
const communityController = require("../controllers/communityController");

const router = express.Router();

// No-auth sanity check (browser or devtools)
router.get("/health", (_req, res) => res.json({ ok: true, name: "community" }));

// Public read (specific routes before /posts/:id so /posts/:id/conversations is never swallowed)
router.get("/posts", communityController.listPosts);
router.get(
  "/posts/:postId/conversations",
  authenticateJWT,
  communityController.listConversationsForPost
);
router.get("/posts/:id", communityController.getPost);

// Authenticated write + private chat setup
router.post("/posts", authenticateJWT, communityController.createPost);
router.post(
  "/conversations",
  authenticateJWT,
  communityController.startConversation
);
router.get(
  "/conversations/:conversationId",
  authenticateJWT,
  communityController.getConversation
);
router.get(
  "/messages/:conversationId",
  authenticateJWT,
  communityController.getMessages
);

module.exports = router;

