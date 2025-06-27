// import Message from '../models/Message.mjs';
import Chats from "../schema/chat.js";
import mongoose from "mongoose";
// Send a message from user to mechanic
import path from "path";
export const sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, message, role } = req.body;
    const image = req.file?.path.replace(/\\/g, "/");

    // Validate senderId and receiverId
    if (!receiverId || !mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ message: "Invalid or missing receiverId" });
    }
    if (!senderId || !mongoose.Types.ObjectId.isValid(senderId)) {
      return res.status(400).json({ message: "Invalid or missing senderId" });
    }

    // Validate required fields
    if (!message) {
      return res.status(400).json({ success: false, error: "Message is required" });
    }

    // Create and save message
    const newMessage = new Chats({
      senderId,
      receiverId,
      message,
      image,
      role
    });
    await newMessage.save();

    // Generate consistent room ID (sorted IDs)
    const roomId = [senderId, receiverId].sort().join("-");

    // Emit message to room
    if (req.io) {
      req.io.to(`room-${roomId}`).emit("receive-message", {
        senderId,
        receiverId,
        message,
        image,
        role,
        timestamp: newMessage.createdAt,
      });
    } else {
      console.warn("Socket.io instance not attached to request.");
    }

    // Respond to sender
    res.status(201).json({ success: true, data: newMessage });

  } catch (error) {
    console.error("❌ Error sending message:", error.message);
    res.status(500).json({ success: false, error: "Failed to send message" });
  }
};

export const getChatHistory = async (req, res) => {
  const { userId, userId2, page = 1, limit = 20 } = req.query;
  if (!userId || !userId2) {  
    return res.status(400).json({ success: false, error: 'User IDs are required' });
  }
  const skip = (parseInt(page) - 1) * parseInt(limit);
  try {
    const messages = await Chats.find({
      $or: [
        { senderId: userId, receiverId: userId2 },
        { senderId: userId2, receiverId: userId }
      ]
    })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalMessages = await Chats.countDocuments({
      $or: [
        { senderId: userId, receiverId: userId2 },
        { senderId: userId2, receiverId: userId }
      ]
    });

    res.status(200).json({
      success: true,
      data: messages,
      pagination: {
        total: totalMessages,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalMessages / limit)
      }
    });
  } catch (error) {
    console.error("❌ Error fetching chat history:", error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
};

