import { roomStore } from "../models/roomStore.js";
import { requestJudgeObjection, requestJudgeQuestion } from "../services/aiJudgeBridge.js";

export function registerSocketHandlers(io, stateMachine) {
  io.on("connection", (socket) => {
    // 1. Join Room
    socket.on("room:join", ({ roomId, name, side }) => {
      const room = roomStore.getRoom(roomId);
      if (!room) {
        socket.emit("room:error", { message: `Room '${roomId}' not found.` });
        return;
      }

      socket.join(roomId);
      const result = roomStore.joinRoom(roomId, { name, side, socketId: socket.id });

      // Automatically advance to FILING phase if both parties are present and in LOBBY
      if (
        room.phase === "LOBBY" &&
        room.participants.petitioner.connected &&
        room.participants.respondent.connected
      ) {
        stateMachine.startFilingPhase(roomId);
      } else {
        stateMachine.broadcastState(roomId);
      }
    });

    // 2. File Case (Petitioner/Respondent filing)
    socket.on("case:file", ({ roomId, caseTitle, facts, reliefSought, reply }) => {
      const room = roomStore.getRoom(roomId);
      if (!room) return;

      if (caseTitle) room.caseData.caseTitle = caseTitle;
      if (facts) room.caseData.facts = facts;
      if (reliefSought) room.caseData.reliefSought = reliefSought;
      if (reply) room.caseData.reply = reply;

      roomStore.addTranscript(roomId, {
        speaker: "Petitioner",
        side: "petitioner",
        text: `CASE FILED: "${room.caseData.caseTitle}". Relief: ${room.caseData.reliefSought}`,
        type: "system"
      });

      // Advance to Opening Arguments
      stateMachine.startTrialRound(roomId, "ROUND_1_OPENING");
    });

    // 3. Submit Argument (Turn-enforced)
    socket.on("argument:submit", async ({ roomId, text }) => {
      const room = roomStore.getRoom(roomId);
      if (!room) return;

      // Verify the active turn
      const currentSide = room.activeTurnSide;
      const speakerName = room.participants[currentSide]?.name || currentSide;

      // Save argument
      if (currentSide === "petitioner") {
        room.caseData.petitionerArguments.push(text);
      } else {
        room.caseData.respondentArguments.push(text);
      }

      // Add to transcript
      roomStore.addTranscript(roomId, {
        speaker: speakerName,
        side: currentSide,
        text,
        type: "argument",
        metadata: { phase: room.phase, turnIndex: room.turnIndex }
      });

      // Advance to next turn in the round
      stateMachine.advanceTurn(roomId, false);
    });

    // 4. Raise Objection (Evaluated by AI Judge with Credibility Adjustments)
    socket.on("objection:raise", async ({ roomId, reason }) => {
      const room = roomStore.getRoom(roomId);
      if (!room) return;

      // Identify which side objected
      let objectingSide = "petitioner";
      if (socket.id === room.participants.respondent.socketId) {
        objectingSide = "respondent";
      }
      const targetSide = objectingSide === "petitioner" ? "respondent" : "petitioner";
      const speaker = room.participants[objectingSide]?.name || objectingSide;

      // Identify target argument
      const targetArgs = targetSide === "petitioner" ? room.caseData.petitionerArguments : room.caseData.respondentArguments;
      const targetArgument = targetArgs.slice(-1)[0] || "Oral submission in court";

      // Call AI Judge Objection Evaluation
      const rulingResult = await requestJudgeObjection({
        namespace_id: room.constitutionId,
        persona: room.judgePersona,
        objecting_side: objectingSide,
        target_argument: targetArgument,
        reason: reason || "Irrelevant and speculative argument outside constitutional bounds."
      });

      // Apply credibility impacts
      if (rulingResult.credibility_impact) {
        const petDelta = rulingResult.credibility_impact.petitioner || 0;
        const respDelta = rulingResult.credibility_impact.respondent || 0;

        room.participants.petitioner.credibility = Math.min(Math.max(room.participants.petitioner.credibility + petDelta, 20), 100);
        room.participants.respondent.credibility = Math.min(Math.max(room.participants.respondent.credibility + respDelta, 20), 100);
      }

      roomStore.addTranscript(roomId, {
        speaker,
        side: objectingSide,
        text: `OBJECTION! Ground: ${reason}`,
        type: "objection"
      });

      roomStore.addTranscript(roomId, {
        speaker: `Judge (${room.judgePersona})`,
        side: "judge",
        text: `RULING ON OBJECTION: ${rulingResult.ruling}. ${rulingResult.explanation}`,
        type: "ruling-on-objection",
        metadata: rulingResult
      });

      io.to(roomId).emit("judge:ruling-on-objection", {
        objectingSide,
        targetSide,
        reason,
        ruling: rulingResult.ruling,
        explanation: rulingResult.explanation,
        credibilityImpact: rulingResult.credibility_impact,
        struckFromRecord: rulingResult.struck_from_record
      });

      stateMachine.broadcastState(roomId);
    });

    // 5. Add Evidence
    socket.on("evidence:add", ({ roomId, description }) => {
      const room = roomStore.getRoom(roomId);
      if (!room) return;

      room.caseData.evidence.push(description);
      roomStore.addTranscript(roomId, {
        speaker: "Court Clerk",
        side: "system",
        text: `Exhibit entered into evidence: "${description}"`,
        type: "system"
      });

      stateMachine.broadcastState(roomId);
    });

    // 6. Cite Article
    socket.on("article:cite", ({ roomId, articleNumber, title }) => {
      const room = roomStore.getRoom(roomId);
      if (!room) return;

      const chip = { articleNumber, title: title || articleNumber };
      if (!room.caseData.articlesInPlay.some(a => a.articleNumber === articleNumber)) {
        room.caseData.articlesInPlay.push(chip);
      }

      roomStore.addTranscript(roomId, {
        speaker: room.activeTurnSide === "petitioner" ? room.participants.petitioner.name : room.participants.respondent.name,
        side: room.activeTurnSide,
        text: `Cited ${articleNumber} in oral arguments.`,
        type: "citation"
      });

      stateMachine.broadcastState(roomId);
    });

    // 7. Handle Disconnect
    socket.on("disconnect", () => {
      const disconnectInfo = roomStore.handleDisconnect(socket.id);
      if (disconnectInfo) {
        stateMachine.broadcastState(disconnectInfo.roomId);
      }
    });
  });
}
