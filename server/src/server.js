// the server operator file
console.log("server flow start");

require("dotenv").config();
console.log("server end calling .env");

const http = require("http");
const app = require("./app");
const dpConnection = require("./config/db");
const { initSocket } = require("./socket/socketManager");

const PORT = process.env.PORT || 6000;

const startServer = async () => {
  // 1. Database first — if it fails, shut the server down
  await dpConnection();
  console.log("database connected");

  // 2. Build the HTTP server + attach Socket.IO BEFORE any realtime service
  const httpServer = http.createServer(app);
  initSocket(httpServer);
  console.log("socket.io initialized and ready");

  // 3. NOW start services that depend on Socket.IO (they use getIO())
  const {
    startAutoApproveScheduler,
  } = require("./services/notificationService");
  startAutoApproveScheduler();
  console.log(
    "auto-approve scheduler started (7-min window for break requests)",
  );

  // 4. Listen last
  httpServer.listen(PORT, () => {
    console.log(`server is running on port: ${PORT}`);
    console.log(`socket.io is attached and ready`);
  });
};

console.log("server end by calling itself()");
startServer();
