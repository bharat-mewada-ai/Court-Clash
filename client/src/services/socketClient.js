import { io } from "socket.io-client";

const SOCKET_SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_SERVER_URL, {
        transports: ["websocket", "polling"],
        reconnectionAttempts: 5
      });

      this.socket.on("connect", () => {
        console.log("[SocketService] Connected to Court Clash Server:", this.socket.id);
      });

      this.socket.on("disconnect", () => {
        console.log("[SocketService] Disconnected from server.");
      });
    }
    return this.socket;
  }

  getSocket() {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }

  joinRoom(roomId, name, side) {
    this.getSocket().emit("room:join", { roomId, name, side });
  }

  fileCase(roomId, casePayload) {
    this.getSocket().emit("case:file", { roomId, ...casePayload });
  }

  submitArgument(roomId, text) {
    this.getSocket().emit("argument:submit", { roomId, text });
  }

  raiseObjection(roomId, reason) {
    this.getSocket().emit("objection:raise", { roomId, reason });
  }

  addEvidence(roomId, description) {
    this.getSocket().emit("evidence:add", { roomId, description });
  }

  citeArticle(roomId, articleNumber, title) {
    this.getSocket().emit("article:cite", { roomId, articleNumber, title });
  }
}

export const socketService = new SocketService();
