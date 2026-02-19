const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 8080;

// Serve public folder
app.use(express.static(path.join(__dirname, "public")));

// ===== SETTINGS =====

const ADMIN_NAME = "Mr.Matthews"; // change if needed

const allowedRooms = ["math", "science", "reading", "history"];

const bannedWords = ["discord", "snapchat", "badword"];

let users = {};
let messageLog = [];

// ===== WORD FILTER =====
function filterMessage(msg) {
  let clean = msg;
  bannedWords.forEach(word => {
    const regex = new RegExp(word, "gi");
    clean = clean.replace(regex, "***");
  });
  return clean;
}

// ===== SOCKET CONNECTION =====
io.on("connection", (socket) => {

  console.log("New user connected:", socket.id);

  // Join Room
  socket.on("joinRoom", ({ username, room }) => {

    if (!username || username.length < 3) return;
    if (!allowedRooms.includes(room)) return;

    users[socket.id] = {
      username,
      room,
      isAdmin: username === ADMIN_NAME
    };

    socket.join(room);

    if (username === ADMIN_NAME) {
      io.to(room).emit("chatMessage", {
        user: "SYSTEM",
        message: `${ADMIN_NAME} (Moderator) is now online.`
      });
    }

    console.log(username + " joined " + room);
  });

  // Chat Message
  socket.on("chatMessage", (data) => {

    const user = users[socket.id];
    if (!user) return;

    let message = filterMessage(data.message);

    const messageData = {
      user: user.username,
      message: message,
      room: user.room,
      time: new Date().toLocaleTimeString()
    };

    messageLog.push(messageData);

    io.to(user.room).emit("chatMessage", messageData);
  });

  // Report Message
  socket.on("reportMessage", (id) => {

    const user = users[socket.id];
    if (!user) return;

    console.log("Message reported by:", user.username, "Message ID:", id);

    // Notify admin if online
    Object.keys(users).forEach(id => {
      if (users[id].isAdmin) {
        io.to(id).emit("chatMessage", {
          user: "SYSTEM",
          message: "A message has been reported."
        });
      }
    });

  });

  // Disconnect
  socket.on("disconnect", () => {

    cons
