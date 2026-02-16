const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

const ADMIN_CODE = "huntercanrizzu"; // change this to your secret admin code

let users = {}; // stores socket.id -> username

io.on("connection", (socket) => {

    // When user joins a room
    socket.on("join room", ({ username, room }) => {
        socket.username = username;
        socket.room = room;

        socket.join(room);

        users[socket.id] = username;

        // Send updated user list to that room only
        io.to(room).emit("user list", getRoomUsers(room));

        // If they joined admin room, give admin powers
        if (room === ADMIN_CODE) {
            socket.emit("admin");
        }
    });

    // When a message is sent
    socket.on("chat message", (text) => {
        if (!socket.room || !socket.username) return;

        const messageData = {
            user: socket.username,
            text: text,
            time: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            })
        };

        io.to(socket.room).emit("chat message", messageData);
    });

    // Admin kicking someone
    socket.on("kick user", (id) => {
        if (socket.room === ADMIN_CODE) {
            const targetSocket = io.sockets.sockets.get(id);
            if (targetSocket) {
                targetSocket.emit("kicked");
                targetSocket.disconnect();
            }
        }
    });

    // When user disconnects
    socket.on("disconnect", () => {
        const room = socket.room;
        delete users[socket.id];

        if (room) {
            io.to(room).emit("user list", getRoomUsers(room));
        }
    });

});

// Helper function to get only users in a room
function getRoomUsers(room) {
    const roomSockets = io.sockets.adapter.rooms.get(room);
    let roomUsers = {};

    if (roomSockets) {
        roomSockets.forEach(id => {
            if (users[id]) {
                roomUsers[id] = users[id];
            }
        });
    }

    return roomUsers;
}

const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
    console.log("Sigma Class server running on port " + PORT);
});
