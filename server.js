const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let rooms = {}; 
// Structure:
// rooms = {
//   roomName: {
//     users: { socketId: username },
//     admin: socketId
//   }
// }

io.on("connection", (socket) => {

  socket.on("join room", ({ username, room }) => {

    socket.join(room);
    socket.username = username;
    socket.room = room;

    if (!rooms[room]) {
      rooms[room] = {
        users: {},
        admin: socket.id
      };
    }

    rooms[room].users[socket.id] = username;

    // Tell first person they are admin
    if (rooms[room].admin === socket.id) {
      socket.emit("admin");
    }

    // Send updated user list
    io.to(room).emit("user list", rooms[room].users);
  });


 
socket.on("chat message", (msg) => {

  const now = new Date();
  const time = now.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  io.to(socket.room).emit("chat message", {
    name: socket.username,
    message: msg,
    time: time
  });

});




  socket.on("kick user", (id) => {

    if (!socket.room) return;

    const room = socket.room;

    if (rooms[room] && rooms[room].admin === socket.id) {
      io.to(id).emit("kicked");
      io.sockets.sockets.get(id)?.disconnect();
    }

  });


  socket.on("disconnect", () => {

    const room = socket.room;
    if (!room || !rooms[room]) return;

    delete rooms[room].users[socket.id];

    // If admin leaves, make someone else admin
    if (rooms[room].admin === socket.id) {
      const users = Object.keys(rooms[room].users);
      if (users.length > 0) {
        rooms[room].admin = users[0];
        io.to(users[0]).emit("admin");
      }
    }

    io.to(room).emit("user list", rooms[room].users);

    // If room empty, delete it
    if (Object.keys(rooms[room].users).length === 0) {
      delete rooms[room];
    }

  });

});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

