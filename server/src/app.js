import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

import { roomStore } from "./models/roomStore.js";
import { RoomStateMachine } from "./sockets/roomStateMachine.js";
import { registerSocketHandlers } from "./sockets/socketHandlers.js";
import { bootstrap } from "./bootstrap/index.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Enable CORS for client
app.use(cors({ origin: "*" }));
app.use(express.json());

// Setup Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Setup state machine and event listeners
const stateMachine = new RoomStateMachine(io);
registerSocketHandlers(io, stateMachine);

// Run Master Bootstrap (Crash Handlers, Database, Swagger Documentation)
await bootstrap(app, server);

// REST API Endpoints
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "Court Clash Game Server",
    activeRooms: roomStore.rooms.size
  });
});

// Create a new room (called from Lobby)
app.post("/api/rooms", (req, res) => {
  const { constitutionId, judgePersona, creatorName, turnDuration } = req.body;
  const room = roomStore.createRoom({
    constitutionId,
    judgePersona,
    creatorName,
    turnDuration: turnDuration || 60
  });

  res.status(201).json({
    success: true,
    roomId: room.id,
    room: roomStore.toClientState(room.id)
  });
});

// Get room state by ID
app.get("/api/rooms/:roomId", (req, res) => {
  const clientState = roomStore.toClientState(req.params.roomId);
  if (!clientState) {
    return res.status(404).json({ error: "Room not found" });
  }
  res.json(clientState);
});

// Constitution Rulebook Endpoints (Phase 6)
import { constitutionStore } from "./models/constitutionStore.js";

// List all rulebooks (built-in and custom)
app.get("/api/constitutions", (req, res) => {
  res.json(constitutionStore.getAll());
});

// Get rulebook details with all articles
app.get("/api/constitutions/:id", (req, res) => {
  const item = constitutionStore.getById(req.params.id);
  if (!item) {
    return res.status(404).json({ error: "Constitution not found" });
  }
  res.json(item);
});

// Create and ingest custom rulebook into vector namespace
app.post("/api/constitutions", async (req, res) => {
  const { name, description, articles, visibility } = req.body;
  if (!name || !articles || !Array.isArray(articles) || articles.length === 0) {
    return res.status(400).json({ error: "Name and at least one article are required." });
  }

  const created = await constitutionStore.create({
    name,
    description,
    articles,
    visibility: visibility || "public"
  });

  res.status(201).json({
    success: true,
    constitution: created
  });
});

// Delete custom rulebook (moderation & management)
app.delete("/api/constitutions/:id", (req, res) => {
  const deleted = constitutionStore.delete(req.params.id);
  if (!deleted) {
    return res.status(400).json({ error: "Cannot delete built-in constitution or rulebook not found." });
  }
  res.json({ success: true, message: `Constitution '${req.params.id}' deleted.` });
});

// Start server if run directly
const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, () => {
    console.log(`[Court Clash Server] Listening on port ${PORT}`);
    console.log(`[Swagger UI] http://localhost:${PORT}/docs`);
  });
}

export { app, server, io, stateMachine, roomStore };
