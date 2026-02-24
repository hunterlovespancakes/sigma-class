const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// 🛡 Security Headers
app.use(helmet());

// 🛑 Rate Limiting (100 requests per 15 min per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 10000;
let users = {};

const blockedWords = [
  "discord","snapchat","tiktok","instagram",
  "badword","hack","bypass","proxy"
];

function filterMessage(msg) {
  blockedWords.forEach(word => {
    const regex = new RegExp(word, "gi");
    msg = msg.replace(regex, "***");
  });
  return msg;
}

io.on("connection", (socket) => {

  socket.on("joinRoom", ({ username, room }) => {
    users[socket.id] = { username, room };
    socket.join(room);

    updateUserList(room);
  });

  socket.on("chatMessage", (msg) => {
    const user = users[socket.id];
    if (!user) return;

    msg = filterMessage(msg);

    io.to(user.room).emit("chatMessage", {
      user: user.username,
      message: msg
    });
  });

  socket.on("disconnect", () => {
    const user = users[socket.id];
    if (user) {
      delete users[socket.id];
      updateUserList(user.room);
    }
  });

  function updateUserList(room) {
    const roomUsers = Object.values(users)
      .filter(u => u.room === room)
      .map(u => u.username);

    io.to(room).emit("updateUsers", roomUsers);
  }

});

server.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});

