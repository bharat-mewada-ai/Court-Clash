import { v4 as uuidv4 } from "uuid";
import { DEFAULT_TURN_DURATION_SECONDS } from "../config/constants.js";

class RoomStore {
  constructor() {
    this.rooms = new Map();
  }

  createRoom({
    roomId = uuidv4().slice(0, 8),
    constitutionId = "indian_constitution",
    judgePersona = "Strict",
    creatorName = "Petitioner",
    turnDuration = DEFAULT_TURN_DURATION_SECONDS
  }) {
    const room = {
      id: roomId,
      constitutionId,
      judgePersona,
      phase: "LOBBY", // LOBBY, FILING, ROUND_1_OPENING, ROUND_2_REBUTTAL, ROUND_3_CLOSING, DELIBERATION, VERDICT_REVEALED
      turnIndex: 0,
      activeTurnSide: "petitioner", // 'petitioner' or 'respondent'
      turnDuration,
      turnSecondsRemaining: turnDuration,
      timerEndsAt: null,
      timerInterval: null,
      participants: {
        petitioner: {
          id: uuidv4(),
          name: creatorName,
          socketId: null,
          credibility: 85,
          connected: false
        },
        respondent: {
          id: null,
          name: "Awaiting Respondent...",
          socketId: null,
          credibility: 85,
          connected: false
        }
      },
      caseData: {
        caseTitle: "Pending Case Filing",
        facts: "",
        reliefSought: "",
        reply: "",
        evidence: [],
        articlesInPlay: [],
        petitionerArguments: [],
        respondentArguments: [],
        transcript: [],
        verdict: null
      },
      createdAt: new Date().toISOString()
    };

    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId) {
    return this.rooms.get(roomId) || null;
  }

  joinRoom(roomId, { name, side, socketId }) {
    const room = this.rooms.get(roomId);
    if (!room) return { error: "Room not found" };

    // Auto-assign side if not chosen or if slot is open
    let assignedSide = side;
    if (!assignedSide) {
      if (!room.participants.petitioner.socketId) {
        assignedSide = "petitioner";
      } else if (!room.participants.respondent.socketId) {
        assignedSide = "respondent";
      } else {
        assignedSide = "spectator";
      }
    }

    if (assignedSide === "petitioner") {
      room.participants.petitioner.name = name || room.participants.petitioner.name;
      room.participants.petitioner.socketId = socketId;
      room.participants.petitioner.connected = true;
    } else if (assignedSide === "respondent") {
      room.participants.respondent.id = room.participants.respondent.id || uuidv4();
      room.participants.respondent.name = name || "Respondent";
      room.participants.respondent.socketId = socketId;
      room.participants.respondent.connected = true;
    }

    // Add entry to transcript
    this.addTranscript(roomId, {
      speaker: "System",
      side: "system",
      text: `${name || assignedSide} joined the courtroom as ${assignedSide.toUpperCase()}.`,
      type: "system"
    });

    return { room, assignedSide };
  }

  handleDisconnect(socketId) {
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.participants.petitioner.socketId === socketId) {
        room.participants.petitioner.connected = false;
        return { roomId, side: "petitioner" };
      }
      if (room.participants.respondent.socketId === socketId) {
        room.participants.respondent.connected = false;
        return { roomId, side: "respondent" };
      }
    }
    return null;
  }

  addTranscript(roomId, { speaker, side, text, type = "argument", metadata = {} }) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const entry = {
      id: uuidv4(),
      speaker,
      side,
      text,
      type, // 'argument', 'objection', 'question', 'citation', 'verdict', 'system'
      timestamp: new Date().toISOString(),
      metadata
    };

    room.caseData.transcript.push(entry);
    return entry;
  }

  toClientState(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    // Return sanitized view for client state
    return {
      roomId: room.id,
      constitutionId: room.constitutionId,
      judgePersona: room.judgePersona,
      phase: room.phase,
      turnIndex: room.turnIndex,
      activeTurnSide: room.activeTurnSide,
      turnSecondsRemaining: room.turnSecondsRemaining,
      participants: {
        petitioner: {
          name: room.participants.petitioner.name,
          credibility: room.participants.petitioner.credibility,
          connected: room.participants.petitioner.connected
        },
        respondent: {
          name: room.participants.respondent.name,
          credibility: room.participants.respondent.credibility,
          connected: room.participants.respondent.connected
        }
      },
      caseData: {
        caseTitle: room.caseData.caseTitle,
        facts: room.caseData.facts,
        reliefSought: room.caseData.reliefSought,
        reply: room.caseData.reply,
        evidence: room.caseData.evidence,
        articlesInPlay: room.caseData.articlesInPlay,
        transcript: room.caseData.transcript,
        verdict: room.caseData.verdict
      }
    };
  }
}

export const roomStore = new RoomStore();
