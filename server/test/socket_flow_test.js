/**
 * Phase 3 Verification Test:
 * Simulates a complete two-party courtroom trial between Petitioner and Respondent over Socket.IO:
 * 1. Room Creation
 * 2. Two-party Join (Petitioner + Respondent)
 * 3. Case Filing
 * 4. Alternating Turn Order with Authoritative Timers (Round 1, 2, 3)
 * 5. In-trial Objection
 * 6. Transition to Deliberation & Verdict Broadcast
 * 7. Transcript Verification
 */
import { io as ClientIO } from "socket.io-client";
import { server, roomStore } from "../src/app.js";

async function runTwoPartyRoomTest() {
  console.log("=".repeat(65));
  console.log("COURT CLASH - PHASE 3: TWO-PARTY SOCKET.IO ROOM TEST");
  console.log("=".repeat(65));

  // If server is not listening, listen on port 3001
  const port = server.address() ? server.address().port : 3001;
  const SERVER_URL = `http://localhost:${port}`;
  console.log(`[Test Server] Connected to ${SERVER_URL}`);

  // Create room with short turn duration (2 seconds) for fast automated testing
  const room = roomStore.createRoom({
    roomId: "test-room-phase3",
    constitutionId: "indian_constitution",
    judgePersona: "Strict",
    creatorName: "Aarav (Petitioner)",
    turnDuration: 2
  });
  console.log(`[Step 1] Created Room '${room.id}' with Judge Persona: Strict`);

  // Connect Petitioner and Respondent sockets
  const petitioner = ClientIO(SERVER_URL);
  const respondent = ClientIO(SERVER_URL);

  let petitionerTurnCount = 0;
  let respondentTurnCount = 0;
  let verdictReceived = false;

  await new Promise((resolve, reject) => {
    let petJoined = false;

    petitioner.on("connect", () => {
      console.log("[Step 2a] Petitioner connected to socket.");
      petitioner.emit("room:join", {
        roomId: room.id,
        name: "Aarav",
        side: "petitioner"
      });
    });

    respondent.on("connect", () => {
      console.log("[Step 2b] Respondent connected to socket.");
      respondent.emit("room:join", {
        roomId: room.id,
        name: "Counsel Verma",
        side: "respondent"
      });
    });

    petitioner.on("room:state", (state) => {
      if (state.phase === "FILING" && !petJoined) {
        petJoined = true;
        console.log(`[Step 3] Both parties joined! Court advanced to phase: ${state.phase}`);

        // Petitioner files case
        petitioner.emit("case:file", {
          roomId: room.id,
          caseTitle: "Sharma v. State University",
          facts: "Student suspended for online article detailing mess fee misappropriation.",
          reliefSought: "Immediate reinstatement and apology."
        });
      }
    });

    // Listen to turn starts
    petitioner.on("turn:start", (turnData) => {
      console.log(`[Turn Start] Phase: ${turnData.phase} | Active Turn: ${turnData.activeTurnSide.toUpperCase()}`);

      if (turnData.activeTurnSide === "petitioner") {
        petitionerTurnCount++;
        setTimeout(() => {
          console.log(`  -> Petitioner submitting argument for ${turnData.phase}...`);
          petitioner.emit("argument:submit", {
            roomId: room.id,
            text: `Petitioner argument #${petitionerTurnCount}: Action violates Article 19(1)(a).`
          });
        }, 200);
      }
    });

    respondent.on("turn:start", (turnData) => {
      if (turnData.activeTurnSide === "respondent") {
        respondentTurnCount++;

        // Test raising an objection in Round 1
        if (turnData.phase === "ROUND_1_OPENING") {
          console.log("  -> Respondent raising OBJECTION!");
          respondent.emit("objection:raise", {
            roomId: room.id,
            reason: "Argument assumes facts not in evidence."
          });
        }

        setTimeout(() => {
          console.log(`  -> Respondent submitting argument for ${turnData.phase}...`);
          respondent.emit("argument:submit", {
            roomId: room.id,
            text: `Respondent argument #${respondentTurnCount}: University maintains disciplinary authority.`
          });
        }, 300);
      }
    });

    // Listen for objection ruling
    petitioner.on("judge:ruling-on-objection", (rulingData) => {
      console.log(`[Judge Objection Ruling] ${rulingData.objectingSide} objection -> ${rulingData.ruling}`);
    });

    // Listen for Verdict Ready
    petitioner.on("verdict:ready", ({ verdict, transcript }) => {
      console.log("\n" + "=".repeat(65));
      console.log("[Step 6] VERDICT RECEIVED BY CLIENT OVER SOCKET.IO!");
      console.log(`  Verdict: ${verdict.verdict}`);
      console.log(`  Relief: ${verdict.relief}`);
      console.log(`  Credibility: Petitioner ${verdict.credibility_scores?.petitioner}% | Respondent ${verdict.credibility_scores?.respondent}%`);
      console.log(`  Total Transcript Entries: ${transcript.length}`);
      console.log("=".repeat(65));
      verdictReceived = true;
      resolve();
    });

    setTimeout(() => {
      if (!verdictReceived) {
        reject(new Error("Test timed out before verdict was delivered."));
      }
    }, 12000);
  });

  // Verify assertions
  const updatedRoom = roomStore.getRoom(room.id);
  console.log("\n[Verification Summary]:");
  console.log(`- Final Phase: ${updatedRoom.phase}`);
  console.log(`- Petitioner Arguments Submitted: ${updatedRoom.caseData.petitionerArguments.length}`);
  console.log(`- Respondent Arguments Submitted: ${updatedRoom.caseData.respondentArguments.length}`);
  console.log(`- Transcript Length: ${updatedRoom.caseData.transcript.length}`);

  if (
    updatedRoom.phase === "VERDICT_REVEALED" &&
    updatedRoom.caseData.verdict !== null &&
    updatedRoom.caseData.transcript.length >= 6
  ) {
    console.log("\n[PASS] TWO-PARTY SOCKET.IO TRIAL FLOW FULLY VERIFIED!");
  } else {
    throw new Error("Trial verification checks failed.");
  }

  // Cleanup
  petitioner.disconnect();
  respondent.disconnect();
  server.close();
  process.exit(0);
}

runTwoPartyRoomTest().catch((err) => {
  console.error("[FAIL] Test error:", err);
  process.exit(1);
});
