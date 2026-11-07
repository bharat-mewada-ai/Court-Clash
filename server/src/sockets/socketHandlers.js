import { roomStore } from "../models/roomStore.js";
import { requestJudgeObjection, requestJudgeQuestion, requestTurnReaction } from "../services/aiJudgeBridge.js";

export function registerSocketHandlers(io, stateMachine) {
  io.on("connection", (socket) => {
    // 1. Join Room
    socket.on("room:join", ({ roomId, name, side, judgeMode, constitutionId, judgePersona, turnDuration }) => {
      let room = roomStore.getRoom(roomId);
      if (!room) {
        // Auto-create room if not already initialized
        room = roomStore.createRoom({
          roomId,
          constitutionId: constitutionId || "indian_constitution",
          judgePersona: judgePersona || "Strict",
          judgeMode: judgeMode || "ai",
          creatorName: name || "Counsel",
          creatorSide: side || "petitioner",
          turnDuration: turnDuration || 60
        });
      }

      socket.join(roomId);
      const result = roomStore.joinRoom(roomId, { name, side, socketId: socket.id });

      // Automatically advance to FILING phase when required parties are connected
      const isHumanJudge = room.judgeMode === "human";
      const readyToStart = isHumanJudge
        ? (room.participants.petitioner.connected && room.participants.respondent.connected && room.participants.judge.connected)
        : (room.participants.petitioner.connected && room.participants.respondent.connected);

      if (room.phase === "LOBBY" && readyToStart) {
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

      // Call AI Judge Reaction if in AI Judge mode
      if (room.judgeMode !== "human") {
        try {
          const reaction = await requestTurnReaction({
            namespace_id: room.constitutionId,
            persona: room.judgePersona || "STRICT",
            phase: room.phase,
            petitioner_name: room.participants.petitioner.name,
            petitioner_score: room.participants.petitioner.credibility,
            respondent_name: room.participants.respondent.name,
            respondent_score: room.participants.respondent.credibility,
            event_type: "SUBMISSION",
            event_text: text,
            speaker_role: currentSide,
            transcript: room.caseData.transcript.map((t) => `${t.speaker}: ${t.text}`).slice(-8),
            seconds_left: room.turnSecondsRemaining || 45
          });

          // Apply score deltas
          if (reaction && reaction.score_delta) {
            const pDelta = reaction.score_delta.petitioner || 0;
            const rDelta = reaction.score_delta.respondent || 0;
            room.participants.petitioner.credibility = Math.min(Math.max(room.participants.petitioner.credibility + pDelta, 0), 100);
            room.participants.respondent.credibility = Math.min(Math.max(room.participants.respondent.credibility + rDelta, 0), 100);
          }

          // Add Judge reaction line to transcript
          roomStore.addTranscript(roomId, {
            speaker: `Judge (${room.judgePersona})`,
            side: "judge",
            text: reaction.judge_line,
            type: "commentary",
            metadata: reaction
          });

          io.to(roomId).emit("turn:reaction", {
            reaction,
            speaker: speakerName,
            side: currentSide
          });
        } catch (err) {
          console.warn("[Turn Reaction] Non-fatal reaction error:", err.message);
        }
      }

      // Advance to next turn in the round
      stateMachine.advanceTurn(roomId, false);
    });

    // 4. Raise Objection (Evaluated by Human Judge or AI Judge)
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

      // 4a. If Human Judge mode is active and judge is connected -> pass to human judge
      if (room.judgeMode === "human" && room.participants.judge.connected) {
        room.pendingObjection = {
          objectingSide,
          targetSide,
          reason: reason || "Improper submission",
          targetArgument,
          timestamp: Date.now()
        };

        roomStore.addTranscript(roomId, {
          speaker,
          side: objectingSide,
          text: `OBJECTION! Ground: ${reason}. Awaiting Presiding Judge's ruling.`,
          type: "objection"
        });

        if (room.participants.judge.socketId) {
          io.to(room.participants.judge.socketId).emit("judge:objection-pending", room.pendingObjection);
        }
        stateMachine.broadcastState(roomId);
        return;
      }

      // 4b. Automated AI Judge Objection Evaluation
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

    // 4b. Human Judge Rules on Objection
    socket.on("judge:rule-objection", ({ roomId, ruling, explanation }) => {
      const room = roomStore.getRoom(roomId);
      if (!room || !room.pendingObjection) return;

      const { objectingSide, targetSide, reason } = room.pendingObjection;
      room.pendingObjection = null;

      const isSustained = ruling === "SUSTAINED";
      const petDelta = isSustained ? (objectingSide === "petitioner" ? 5 : -6) : (objectingSide === "petitioner" ? -5 : 2);
      const respDelta = isSustained ? (objectingSide === "respondent" ? 5 : -6) : (objectingSide === "respondent" ? -5 : 2);

      room.participants.petitioner.credibility = Math.min(Math.max(room.participants.petitioner.credibility + petDelta, 20), 100);
      room.participants.respondent.credibility = Math.min(Math.max(room.participants.respondent.credibility + respDelta, 20), 100);

      const fullExplanation = explanation || (isSustained
        ? "Objection SUSTAINED. That line of argument is hereby struck from the judicial record."
        : "Objection OVERRULED. The argument is admissible; counsel may proceed."
      );

      roomStore.addTranscript(roomId, {
        speaker: `Judge (${room.participants.judge.name})`,
        side: "judge",
        text: `RULING ON OBJECTION: ${ruling}! ${fullExplanation}`,
        type: "ruling-on-objection"
      });

      io.to(roomId).emit("judge:ruling-on-objection", {
        objectingSide,
        targetSide,
        reason,
        ruling,
        explanation: fullExplanation,
        credibilityImpact: { petitioner: petDelta, respondent: respDelta },
        struckFromRecord: isSustained
      });

      stateMachine.broadcastState(roomId);
    });

    // 4c. Human Judge Strikes Gavel (Sound & Shake)
    socket.on("judge:strike-gavel", ({ roomId }) => {
      const room = roomStore.getRoom(roomId);
      if (!room) return;

      roomStore.addTranscript(roomId, {
        speaker: `Judge (${room.participants.judge.name})`,
        side: "judge",
        text: "ORDER IN THE COURT! *Bangs Gavel*",
        type: "system"
      });

      io.to(roomId).emit("judge:gavel-struck", {
        judgeName: room.participants.judge.name
      });

      stateMachine.broadcastState(roomId);
    });

    // 4d. Human Judge Interrogates Counsel (In-Trial Question)
    socket.on("judge:submit-question", ({ roomId, question }) => {
      const room = roomStore.getRoom(roomId);
      if (!room || !question) return;

      const currentSide = room.activeTurnSide || "both parties";

      roomStore.addTranscript(roomId, {
        speaker: `Judge (${room.participants.judge.name})`,
        side: "judge",
        text: `JUDGE QUESTIONS ${currentSide.toUpperCase()}: "${question}"`,
        type: "question"
      });

      io.to(roomId).emit("judge:question", {
        target_side: currentSide,
        question,
        referenced_article: "Presiding Bench Inquiry"
      });

      stateMachine.broadcastState(roomId);
    });

    // 4e. Human Judge Delivers Final Verdict
    socket.on("judge:submit-verdict", ({ roomId, verdict, relief, reasoning, applicableArticles }) => {
      const room = roomStore.getRoom(roomId);
      if (!room) return;

      const structuredVerdict = {
        case_title: room.caseData.caseTitle || "Constitutional Dispute",
        judge_persona: `Human Presiding Judge: ${room.participants.judge.name}`,
        facts_summary: room.caseData.facts || "Facts submitted by parties",
        issues: ["Determination of constitutional rights and requested relief"],
        petitioner_arguments: room.caseData.petitionerArguments,
        respondent_arguments: room.caseData.respondentArguments,
        applicable_articles: applicableArticles || [
          { article: "Constitutional Bench", quote: "Principles of natural justice and constitutional supremacy.", why_it_applies: "Foundational bench precedent" }
        ],
        reasoning: reasoning || "Having heard oral arguments from both parties and weighed the evidentiary submissions on record, this Court finds in accordance with constitutional principles.",
        verdict: verdict || "In favor of the Petitioner",
        relief: relief || room.caseData.reliefSought || "Relief awarded as prayed.",
        credibility_scores: {
          petitioner: room.participants.petitioner.credibility,
          respondent: room.participants.respondent.credibility
        },
        disclaimer: "This is an educational simulation, not legal advice."
      };

      room.caseData.verdict = structuredVerdict;
      room.phase = "VERDICT_REVEALED";

      roomStore.addTranscript(roomId, {
        speaker: `Judge (${room.participants.judge.name})`,
        side: "judge",
        text: `FINAL VERDICT DELIVERED: ${structuredVerdict.verdict}. Relief: ${structuredVerdict.relief}`,
        type: "verdict",
        metadata: { verdict: structuredVerdict }
      });

      io.to(roomId).emit("verdict:ready", {
        roomId,
        verdict: structuredVerdict,
        transcript: room.caseData.transcript
      });

      stateMachine.broadcastState(roomId);
    });

    // 4f. Human Judge Requests AI Legal Advisor Citations
    socket.on("judge:request-legal-aid", async ({ roomId }) => {
      const room = roomStore.getRoom(roomId);
      if (!room) return;

      try {
        const query = `${room.caseData.facts} ${room.caseData.petitionerArguments.slice(-2).join(" ")} ${room.caseData.respondentArguments.slice(-2).join(" ")}`.trim();
        const res = await fetch(`http://127.0.0.1:8000/constitution/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            namespace_id: room.constitutionId,
            query: query || "fundamental rights",
            top_k: 4
          })
        });

        if (res.ok) {
          const articles = await res.json();
          socket.emit("judge:legal-aid-ready", { articles });
        }
      } catch (err) {
        console.warn("[Legal Aid] Search failed:", err.message);
      }
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
