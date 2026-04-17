const CommunityPost = require("../models/communityPost");
const Conversation = require("../models/conversation");
const Message = require("../models/message");

const toObjectIdString = (v) => (v ? String(v) : "");

/**
 * One private thread per (post + pair of users). Same two users on different posts = different rooms.
 */
const buildConversationId = (postId, userAId, userBId) => {
  const a = toObjectIdString(userAId);
  const b = toObjectIdString(userBId);
  const pair = [a, b].sort().join("_");
  return `${toObjectIdString(postId)}_${pair}`;
};

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

    const userAId = req.user._id; // requester
    const userBId = post.createdBy; // post author

    if (toObjectIdString(userAId) === toObjectIdString(userBId)) {
      return res.status(400).json({ message: "You cannot chat with yourself." });
    }

    const conversationId = buildConversationId(post._id, userAId, userBId);

    const convo = await Conversation.findOneAndUpdate(
      { conversationId },
      {
        $setOnInsert: {
          conversationId,
          participants: [userAId, userBId],
          post: post._id,
        },
      },
      { new: true, upsert: true }
    ).select("conversationId participants post createdAt");

    return res.status(200).json({ conversationId: convo.conversationId });
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
    const convo = await ensureParticipant(conversationId, req.user._id);
    if (!convo) return res.status(403).json({ message: "Forbidden" });
    return res.status(200).json({ conversation: convo });
  } catch (error) {
    console.error("getConversation error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * For the post author: list private chats on this post where they are a participant.
 * So when someone else clicks "Chat Privately" on your post, you can open the same room here.
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
    if (toObjectIdString(post.createdBy) !== uid) {
      return res.status(403).json({ message: "Only the post author can list chats here." });
    }

    const convos = await Conversation.find({ post: post._id }).select(
      "conversationId participants createdAt"
    );

    const mine = convos.filter((c) =>
      (c.participants || []).some((p) => toObjectIdString(p) === uid)
    );

    const out = mine.map((c) => {
      const other = (c.participants || []).find((p) => toObjectIdString(p) !== uid);
      return {
        conversationId: c.conversationId,
        createdAt: c.createdAt,
        otherParticipantId: other ? String(other) : null,
      };
    });

    return res.status(200).json({ conversations: out });
  } catch (error) {
    console.error("listConversationsForPost error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

