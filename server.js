const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const PORT = process.env.PORT || 3000;

// ⚠️ Serve public folder
app.use(express.static("public"));

// 🔐 Store team codes and users
const teams = {};

// 🟢 Socket connection logic
io.on("connection", (socket) => {
  console.log("🧠 New client connected:", socket.id);

  socket.on("join", (code) => {
    socket.join(code);

    if (!teams[code]) teams[code] = [];
    if (!teams[code].includes(socket.id)) {
      teams[code].push(socket.id);
    }

    // Notify room how many are online
    io.to(code).emit("online", teams[code].length);
  });

  socket.on("send", ({ code, msg }) => {
    io.to(code).emit("receive", msg);
  });

  socket.on("disconnecting", () => {
    for (const room of socket.rooms) {
      if (teams[room]) {
        teams[room] = teams[room].filter((id) => id !== socket.id);
        io.to(room).emit("online", teams[room].length);
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// 🚀 Start server
http.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

