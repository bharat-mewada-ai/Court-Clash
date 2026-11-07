import { roomStore } from "../models/roomStore.js";
import { requestJudgeRuling } from "../services/aiJudgeBridge.js";

export class RoomStateMachine {
  constructor(io) {
    this.io = io;
  }

  startFilingPhase(roomId) {
    const room = roomStore.getRoom(roomId);
    if (!room) return;

    room.phase = "FILING";
    room.turnIndex = 0;
    room.activeTurnSide = "petitioner";

    this.stopTimer(room);
    this.broadcastState(roomId);
  }

  startTrialRound(roomId, targetPhase = "ROUND_1_OPENING") {
    const room = roomStore.getRoom(roomId);
    if (!room) return;

    room.phase = targetPhase;
    room.turnIndex = (room.turnIndex || 0) + 1;
    room.activeTurnSide = "petitioner"; // Petitioner always opens each round

    this.startTurnTimer(roomId);
    this.broadcastTurnStart(roomId);
    this.broadcastState(roomId);
  }

  advanceTurn(roomId, timeout = false) {
    const room = roomStore.getRoom(roomId);
    if (!room) return;

    this.stopTimer(room);

    if (timeout) {
      roomStore.addTranscript(roomId, {
        speaker: "Court Clerk",
        side: "system",
        text: `Time expired for ${room.activeTurnSide.toUpperCase()} argument. Floor transferred.`,
        type: "system"
      });
    }

    // Turn order: Petitioner -> Respondent
    if (room.activeTurnSide === "petitioner") {
      room.activeTurnSide = "respondent";
      room.turnIndex += 1;
      this.startTurnTimer(roomId);
      this.broadcastTurnStart(roomId);
      this.broadcastState(roomId);
    } else {
      // Respondent finished their turn -> advance to next phase
      if (room.phase === "ROUND_1_OPENING") {
        this.startTrialRound(roomId, "ROUND_2_REBUTTAL");
      } else if (room.phase === "ROUND_2_REBUTTAL") {
        this.startTrialRound(roomId, "ROUND_3_CLOSING");
      } else if (room.phase === "ROUND_3_CLOSING") {
        this.startDeliberation(roomId);
      }
    }
  }

  startTurnTimer(roomId) {
    const room = roomStore.getRoom(roomId);
    if (!room) return;

    this.stopTimer(room);
    room.turnSecondsRemaining = room.turnDuration;
    room.timerEndsAt = Date.now() + room.turnDuration * 1000;

    room.timerInterval = setInterval(() => {
      room.turnSecondsRemaining -= 1;

      this.io.to(roomId).emit("turn:tick", {
        roomId,
        phase: room.phase,
        activeTurnSide: room.activeTurnSide,
        turnIndex: room.turnIndex,
        secondsRemaining: room.turnSecondsRemaining
      });

      if (room.turnSecondsRemaining <= 0) {
        this.advanceTurn(roomId, true);
      }
    }, 1000);
  }

  stopTimer(room) {
    if (room.timerInterval) {
      clearInterval(room.timerInterval);
      room.timerInterval = null;
    }
  }

  async startDeliberation(roomId) {
    const room = roomStore.getRoom(roomId);
    if (!room) return;

    this.stopTimer(room);
    room.phase = "DELIBERATION";
    room.activeTurnSide = null;

    roomStore.addTranscript(roomId, {
      speaker: "Bailiff",
      side: "system",
      text: "All arguments concluded. The AI Judge is examining the constitutional record and deliberating...",
      type: "system"
    });

    this.broadcastState(roomId);

    // Call AI service to generate verdict
    const payload = {
      namespace_id: room.constitutionId,
      persona: room.judgePersona,
      case_title: room.caseData.caseTitle || "Constitutional Dispute",
      facts: room.caseData.facts,
      relief_sought: room.caseData.reliefSought,
      petitioner_arguments: room.caseData.petitionerArguments,
      respondent_arguments: room.caseData.respondentArguments,
      evidence: room.caseData.evidence
    };

    const verdict = await requestJudgeRuling(payload);

    room.caseData.verdict = verdict;
    room.phase = "VERDICT_REVEALED";

    // Update participants' credibility scores from verdict
    if (verdict.credibility_scores) {
      room.participants.petitioner.credibility = verdict.credibility_scores.petitioner || 85;
      room.participants.respondent.credibility = verdict.credibility_scores.respondent || 75;
    }

    roomStore.addTranscript(roomId, {
      speaker: `Judge (${room.judgePersona})`,
      side: "judge",
      text: `VERDICT DELIVERED: ${verdict.verdict}. Relief: ${verdict.relief}`,
      type: "verdict",
      metadata: { verdict }
    });

    this.io.to(roomId).emit("verdict:ready", {
      roomId,
      verdict,
      transcript: room.caseData.transcript
    });

    this.broadcastState(roomId);
  }

  broadcastTurnStart(roomId) {
    const room = roomStore.getRoom(roomId);
    if (!room) return;

    this.io.to(roomId).emit("turn:start", {
      roomId,
      phase: room.phase,
      turnIndex: room.turnIndex,
      activeTurnSide: room.activeTurnSide,
      secondsRemaining: room.turnSecondsRemaining,
      speakerName: room.participants[room.activeTurnSide]?.name || room.activeTurnSide
    });
  }

  broadcastState(roomId) {
    const clientState = roomStore.toClientState(roomId);
    if (clientState) {
      this.io.to(roomId).emit("room:state", clientState);
    }
  }
}
