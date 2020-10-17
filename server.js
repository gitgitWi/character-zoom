import express from "express";
import http from "http";
import cors from "cors";
import socket from "socket.io";
import { ExpressPeerServer } from "peer";
import room from "./routes";

const app = express();
const server = http.Server(app);
const io = socket(server);
const peerServer = ExpressPeerServer(server, {
    debug: true,
});

app.use(cors());
app.use("/peerjs", peerServer);
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use("/", room);

io.on("connection", (socket) => {
    socket.on("join-room", (roomId, userId) => {
        socket.join(roomId);
        socket.to(roomId).broadcast.emit("user-connected", userId);
        socket.on("message", (message) => {
            io.to(roomId).emit("createMessage", message);
        });

        socket.on("disconnect", () => {
            socket.to(roomId).broadcast.emit("user-disconnected", userId);
        });
    });
});

const PORT = process.env.PORT || 3030;
server.listen(PORT, () => {
    console.log(`Server Listening on ${PORT}`);
});
