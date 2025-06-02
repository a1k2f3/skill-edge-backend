const onlineUsers = new Map();

export default function setupSocket(io) {
  io.on("connection", (socket) => {
    console.log("🔌 New client connected:", socket.id);

    // Register user
    socket.on("register-user", (user) => {
      onlineUsers.set(socket.id, user);
      console.log("✅ Registered user:", user);
    });

    // User status online
    socket.on("user-online", ({ id, email }) => {
      onlineUsers.set(socket.id, { id, email });
      socket.broadcast.emit("user-status", { id, status: "online" });
    });

    // Follow user
    socket.on("follow-user", (targetUserId) => {
      socket.join(`follow-${targetUserId}`);
      console.log(`📡 ${socket.id} joined follow-${targetUserId}`);
    });

    // Join private room for user-mechanic
    socket.on("join-room", ({ userId, mechanicId }) => {
      const room = [userId, mechanicId].sort().join("-"); // ensures same room name both ways
      socket.join(`room-${room}`);
      console.log(`${socket.id} joined room room-${room}`);
    });

    // Chat message
    socket.on("chat-message", ({ senderId, receiverId, message }) => {
      const room = [senderId, receiverId].sort().join("-"); // consistent room naming
      io.to(`room-${room}`).emit("receive-message", { senderId, message });
      console.log(`📨 Message from ${senderId} to ${receiverId}: ${message}`);
    });

    // WebRTC Call Events
    socket.on("call-user", ({ to, offer }) => {
      socket.to(to).emit("incoming-call", { from: socket.id, offer });
    });

    socket.on("answer-call", ({ to, answer }) => {
      socket.to(to).emit("call-answered", { from: socket.id, answer });
    });

    socket.on("ice-candidate", ({ to, candidate }) => {
      socket.to(to).emit("ice-candidate", { from: socket.id, candidate });
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      const user = onlineUsers.get(socket.id);
      if (user) {
        socket.broadcast.emit("user-status", { id: user.id, status: "offline" });
        onlineUsers.delete(socket.id);
        console.log(`❌ Disconnected: ${socket.id} (User: ${user.id})`);
      } else {
        console.log(`❌ Disconnected: ${socket.id}`);
      }
    });
  });
}

export { onlineUsers };
