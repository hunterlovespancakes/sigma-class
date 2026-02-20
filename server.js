const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 10000;

io.on("connection", (socket) => {
  console.log("User connected");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});
