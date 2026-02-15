const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

io.on("connection", (socket) => {

    socket.on("join room", (room) => {
        socket.join(room);
        socket.room = room;
    });

    socket.on("chat message", (data) => {
        io.to(socket.room).emit("chat message", data);
    });

});

const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
