import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import http from "http";

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "PUT"],
  },
});

const userMap = new Map();

io.on("connection", (socket) => {
  socket.on("join_room", ({ room, username }) => {
    socket.join(room);
    userMap.set(socket.id, { room, username });

    const joinMessage = {
      id: Math.random(),
      room,
      author: "System",
      message: `"${username}" joined the chat`,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    io.to(room).emit("receive_message", joinMessage);

    console.log(`${username} joined room ${room}`);
  });

  socket.on("send_message", (data) => {
    socket.to(data.room).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    const user = userMap.get(socket.id);
    if (user) {
      const { room, username } = user;

      const leaveMessage = {
        id: Math.random(),
        room,
        author: "System",
        message: `"${username}" left the chat`,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      io.to(room).emit("receive_message", leaveMessage);
      console.log(`${username} left room ${room}`);
      userMap.delete(socket.id);
    }
  });
});

server.listen(1000);
