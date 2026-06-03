const CommunityPost = require("../models/communityPost");
const Conversation = require("../models/conversation");
const Message = require("../models/message");

const toObjectIdString = (v) => (v ? String(v) : "");

/** One shared group room per community post (all participants). */
const buildGroupConversationId = (postId) =>
  `group_${toObjectIdString(postId)}`;

const ensureParticipant = async (conversationId, userId) => {
  const convo = await Conversation.findOne({ conversationId }).select(
    "participants conversationId"
  );
  if (!convo) return null;
  const uid = toObjectIdString(userId);
  const allowed = (convo.participants || []).some((p) => toObjectIdString(p) === uid);
  return allowed ? convo : null;
};

exports.createPost = async (req, res) => {
  try {
    const { title, body } = req.body || {};
    if (!title || !body) {
      return res.status(400).json({ message: "title and body are required" });
    }

    const post = await CommunityPost.create({
      title,
      body,
      createdBy: req.user._id,
    });

    return res.status(201).json({ post });
  } catch (error) {
    console.error("createPost error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.listPosts = async (_req, res) => {
  try {
    const posts = await CommunityPost.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .select("_id title body createdAt");

    return res.status(200).json({ posts });
  } catch (error) {
    console.error("listPosts error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getPost = async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id).select(
      "_id title body createdAt createdBy"
    );
    if (!post) return res.status(404).json({ message: "Post not found" });

    return res.status(200).json({ post });
  } catch (error) {
    console.error("getPost error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.startConversation = async (req, res) => {
  try {
    const { postId } = req.body || {};
    if (!postId) {
      return res.status(400).json({ message: "postId is required" });
    }

    const post = await CommunityPost.findById(postId).select("_id createdBy");
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user._id;
    const authorId = post.createdBy;
    const conversationId = buildGroupConversationId(post._id);

    // Cannot use $setOnInsert and $addToSet on the same field (participants) — MongoDB conflict.
    const convo = await Conversation.findOneAndUpdate(
      { conversationId },
      {
        $setOnInsert: {
          conversationId,
          type: "group",
          post: post._id,
        },
        $addToSet: {
          participants: { $each: [userId, authorId] },
        },
      },
      { upsert: true, new: true }
    ).select("conversationId participants post createdAt type");

    if (!convo) {
      return res.status(500).json({ message: "Could not create group chat." });
    }

    return res.status(200).json({
      conversationId: convo.conversationId,
      participantCount: (convo.participants || []).length,
      type: convo.type || "group",
    });
  } catch (error) {
    console.error("startConversation error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const convo = await ensureParticipant(conversationId, req.user._id);
    if (!convo) return res.status(403).json({ message: "Forbidden" });

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .limit(500)
      .select("_id conversationId sender body createdAt");

    return res.status(200).json({ messages });
  } catch (error) {
    console.error("getMessages error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const convo = await Conversation.findOne({ conversationId }).select(
      "conversationId participants post createdAt type"
    );
    if (!convo) return res.status(404).json({ message: "Conversation not found" });

    const allowed = await ensureParticipant(conversationId, req.user._id);
    if (!allowed) return res.status(403).json({ message: "Forbidden" });

    return res.status(200).json({
      conversation: {
        conversationId: convo.conversationId,
        type: convo.type || "group",
        post: convo.post,
        createdAt: convo.createdAt,
        participantCount: (convo.participants || []).length,
        participants: (convo.participants || []).map((p) => String(p)),
      },
    });
  } catch (error) {
    console.error("getConversation error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Group chat for a post — any logged-in user can see room status and join via POST /conversations.
 */
exports.listConversationsForPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await CommunityPost.findById(postId).select("_id createdBy");
    if (!post) {
      return res.status(404).json({
        message:
          "Post not found for this id. Import seed communityposts or list ids via GET /api/community/posts.",
      });
    }

    const uid = toObjectIdString(req.user._id);
    const conversationId = buildGroupConversationId(post._id);
    const convo = await Conversation.findOne({ conversationId }).select(
      "conversationId participants createdAt type"
    );

    const participants = (convo?.participants || []).map((p) => String(p));
    const isParticipant = participants.some((p) => p === uid);

    return res.status(200).json({
      groupChat: {
        conversationId,
        exists: !!convo,
        type: convo?.type || "group",
        participantCount: participants.length,
        isParticipant,
        createdAt: convo?.createdAt || null,
      },
      // Legacy 1:1 rooms (pre-group migration) — still openable by id if needed.
      legacyConversations: [],
    });
  } catch (error) {
    console.error("listConversationsForPost error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

