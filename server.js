const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

const ADMIN_CODE = "huntercanrizzu";
let users = {};

io.on("connection", (socket) => {

    socket.on("join room", (data) => {
        const { username, room } = data;

        socket.username = username;
        socket.room = room;

        socket.join(room);

        users[socket.id] = username;

        io.to(room).emit("user list", users);

        if (room === ADMIN_CODE) {
            socket.emit("admin");
        }
    });

    socket.on("chat message", (msg) => {
        io.to(socket.room).emit("chat message", msg);
    });

    socket.on("kick user", (id) => {
        if (socket.room === ADMIN_CODE) {
            io.to(id).emit("kicked");
            io.sockets.sockets.get(id)?.disconnect();
        }
    });

    socket.on("disconnect", () => {
        delete users[socket.id];
        io.emit("user list", users);
    });

});

const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});

