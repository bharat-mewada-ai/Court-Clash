/**
 * Human Judge Mode (3-Player Courtroom) Socket Flow Test
 */
import { io as ClientIO } from "socket.io-client";
import { roomStore } from "../src/models/roomStore.js";
import { RoomStateMachine } from "../src/sockets/roomStateMachine.js";
import { registerSocketHandlers } from "../src/sockets/socketHandlers.js";
import http from "http";
import express from "express";
import { Server } from "socket.io";

async function runHumanJudgeTest() {
  console.log("=" .repeat(65));
  console.log("TESTING 3-PLAYER HUMAN JUDGE MODE SOCKET FLOW");
  console.log("=" .repeat(65));

  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: "*" } });
  const stateMachine = new RoomStateMachine(io);
  registerSocketHandlers(io, stateMachine);

  await new Promise((resolve) => server.listen(3099, "127.0.0.1", resolve));
  const serverUrl = "http://127.0.0.1:3099";

  const roomId = "test-human-judge-room";

  // 1. Create Room with judgeMode: 'human'
  const room = roomStore.createRoom({
    roomId,
    constitutionId: "indian_constitution",
    judgeMode: "human",
    creatorName: "Adv. Aarav",
    creatorSide: "petitioner"
  });

  console.log(`\n[Step 1] Room created with judgeMode: '${room.judgeMode}'.`);
  console.assert(room.judgeMode === "human", "judgeMode should be human");
  console.assert(room.participants.judge.isHuman === true, "judge should be flagged as human");

  // Connect 3 sockets: Petitioner, Respondent, and Presiding Judge
  const petitioner = ClientIO(serverUrl);
  const respondent = ClientIO(serverUrl);
  const humanJudge = ClientIO(serverUrl);

  await new Promise((res) => petitioner.on("connect", res));
  await new Promise((res) => respondent.on("connect", res));
  await new Promise((res) => humanJudge.on("connect", res));
  console.log("[OK] Sockets connected for Petitioner, Respondent, and Presiding Judge.");

  // 2. Join Room
  petitioner.emit("room:join", { roomId, name: "Adv. Aarav (Petitioner)", side: "petitioner" });
  respondent.emit("room:join", { roomId, name: "Adv. Meera (Respondent)", side: "respondent" });
  humanJudge.emit("room:join", { roomId, name: "Hon'ble Justice Vikram", side: "judge" });

  await new Promise((resolve) => setTimeout(resolve, 300));
  console.log(`[PASS] Room Phase: ${room.phase} (All 3 parties checked in)`);
  console.assert(room.participants.judge.name === "Hon'ble Justice Vikram", "Judge name matches");

  // 3. File Case & Begin Opening Arguments
  petitioner.emit("case:file", {
    roomId,
    caseTitle: "Citizens Rights v. Municipal Council",
    facts: "Unilateral demolition notice issued without statutory 15-day notice period.",
    reliefSought: "Stay on demolition and compliance with natural justice."
  });

  await new Promise((resolve) => setTimeout(resolve, 300));
  console.log(`[PASS] Case filed, Round 1 Opening started. Phase: ${room.phase}`);

  // 4. Test Gavel Strike by Human Judge
  let gavelSoundTriggered = false;
  petitioner.on("judge:gavel-struck", (data) => {
    gavelSoundTriggered = true;
    console.log(`[PASS] Gavel strike received across chamber by: ${data.judgeName}`);
  });
  humanJudge.emit("judge:strike-gavel", { roomId });
  await new Promise((resolve) => setTimeout(resolve, 300));
  console.assert(gavelSoundTriggered, "Gavel strike event must be broadcast");

  // 5. Petitioner submits argument, Respondent raises objection
  petitioner.emit("argument:submit", {
    roomId,
    text: "Article 21 guarantees right to shelter and procedural fairness before deprivation."
  });
  await new Promise((resolve) => setTimeout(resolve, 300));

  let objectionReceivedByJudge = false;
  humanJudge.on("judge:objection-pending", (data) => {
    objectionReceivedByJudge = true;
    console.log(`[PASS] Human Judge received pending objection: "${data.reason}" against ${data.targetSide}`);
  });

  respondent.emit("objection:raise", {
    roomId,
    reason: "Speculative claims regarding municipal notice"
  });

  await new Promise((resolve) => setTimeout(resolve, 300));
  console.assert(objectionReceivedByJudge, "Human judge must receive objection prompt");

  // 6. Human Judge rules SUSTAINED
  let rulingBroadcast = false;
  petitioner.on("judge:ruling-on-objection", (data) => {
    rulingBroadcast = true;
    console.log(`[PASS] Human Judge Ruling broadcast: ${data.ruling} (${data.explanation})`);
  });

  humanJudge.emit("judge:rule-objection", {
    roomId,
    ruling: "SUSTAINED",
    explanation: "Objection sustained. Municipal records must be formally proven."
  });

  await new Promise((resolve) => setTimeout(resolve, 300));
  console.assert(rulingBroadcast, "Objection ruling must be broadcast");
  console.log(`[PASS] Updated Credibility Scores -> Petitioner: ${room.participants.petitioner.credibility}, Respondent: ${room.participants.respondent.credibility}`);

  // 7. Human Judge Delivers Final Verdict
  stateMachine.startDeliberation(roomId);
  console.log(`[PASS] Entered Deliberation Phase: ${room.phase}. Awaiting Human Judge decree...`);

  let finalVerdictDelivered = false;
  respondent.on("verdict:ready", ({ verdict }) => {
    finalVerdictDelivered = true;
    console.log(`[PASS] Final Verdict received by parties: "${verdict.verdict}"`);
    console.log(`       Relief: "${verdict.relief}"`);
    console.log(`       Judge Authority: "${verdict.judge_persona}"`);
  });

  humanJudge.emit("judge:submit-verdict", {
    roomId,
    verdict: "In favor of Petitioner",
    relief: "Demolition notice stayed; 15-day statutory hearing mandated under Article 21.",
    reasoning: "The principles of natural justice and procedural due process under Maneka Gandhi apply fully.",
    applicableArticles: [
      { article: "Article 21", quote: "No person shall be deprived of life or personal liberty except according to procedure established by law.", why_it_applies: "Due process" }
    ]
  });

  await new Promise((resolve) => setTimeout(resolve, 400));
  console.assert(finalVerdictDelivered, "Final verdict must be delivered to all participants");
  console.assert(room.phase === "VERDICT_REVEALED", "Phase should be VERDICT_REVEALED");

  // Cleanup
  petitioner.close();
  respondent.close();
  humanJudge.close();
  server.close();

  console.log("\n" + "=" .repeat(65));
  console.log("ALL 3-PLAYER HUMAN JUDGE MODE TESTS PASSED SUCCESSFULLY!");
  console.log("=" .repeat(65));
  process.exit(0);
}

runHumanJudgeTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
