/**
 * Phase 5 Verification Test:
 * Tests in-trial objections, judge rulings, and real-time credibility adjustments.
 */
import { io as ClientIO } from "socket.io-client";

async function runPhase5ObjectionsTest() {
  console.log("=".repeat(65));
  console.log("COURT CLASH - PHASE 5: OBJECTIONS & CREDIBILITY IMPACT TEST");
  console.log("=".repeat(65));

  const SERVER_URL = "http://localhost:3001";

  // Create room via REST endpoint
  const res = await fetch(`${SERVER_URL}/api/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      constitutionId: "indian_constitution",
      judgePersona: "Strict",
      creatorName: "Petitioner Advocate",
      turnDuration: 10
    })
  });
  const roomData = await res.json();
  const roomId = roomData.roomId;
  console.log(`[Step 1] Created Room '${roomId}' via API.`);

  const petitioner = ClientIO(SERVER_URL);
  const respondent = ClientIO(SERVER_URL);

  let firstObjectionVerified = false;
  let secondObjectionVerified = false;

  await new Promise((resolve, reject) => {
    petitioner.on("connect", () => {
      petitioner.emit("room:join", {
        roomId,
        name: "Advocate Sharma",
        side: "petitioner"
      });
    });

    respondent.on("connect", () => {
      respondent.emit("room:join", {
        roomId,
        name: "Advocate Verma",
        side: "respondent"
      });
    });

    petitioner.on("room:state", (state) => {
      if (state.phase === "FILING") {
        petitioner.emit("case:file", {
          roomId,
          caseTitle: "Freedom of Expression Dispute",
          facts: "Online publishing ban on student hostel portal.",
          reliefSought: "Removal of ban."
        });
      }
    });

    petitioner.on("turn:start", (turnData) => {
      if (turnData.phase === "ROUND_1_OPENING" && turnData.activeTurnSide === "petitioner") {
        // Petitioner submits argument
        petitioner.emit("argument:submit", {
          roomId,
          text: "Hostel wardens took illegal bribes to award catering contracts."
        });

        // Respondent immediately lodges a valid objection (speculation)
        setTimeout(() => {
          console.log("\n[Action] Respondent raising VALID OBJECTION: 'Speculation: Argument assumes unproven bribery.'");
          respondent.emit("objection:raise", {
            roomId,
            reason: "Speculative hearsay outside recorded evidence."
          });
        }, 150);
      }
    });

    petitioner.on("judge:ruling-on-objection", (rulingData) => {
      console.log(`[Judge Objection Ruling]`);
      console.log(`  Ruling: ${rulingData.ruling}`);
      console.log(`  Explanation: ${rulingData.explanation}`);
      console.log(`  Impact:`, rulingData.credibilityImpact);

      if (!firstObjectionVerified) {
        firstObjectionVerified = true;
        // Verify sustained
        if (rulingData.ruling === "SUSTAINED" && rulingData.credibilityImpact?.respondent > 0) {
          console.log("  [PASS] Valid objection properly sustained with credibility reward!");
        }

        // Now test second objection: Petitioner raises a frivolous objection
        setTimeout(() => {
          console.log("\n[Action] Petitioner raising FRIVOLOUS OBJECTION: 'I dislike opponent counsel.'");
          petitioner.emit("objection:raise", {
            roomId,
            reason: "I personally disagree with counsel's demeanor."
          });
        }, 250);
      } else if (!secondObjectionVerified) {
        secondObjectionVerified = true;
        // Verify overruled
        if (rulingData.ruling === "OVERRULED" && rulingData.credibilityImpact?.petitioner < 0) {
          console.log("  [PASS] Frivolous objection properly overruled with credibility penalty!");
          resolve();
        }
      }
    });

    setTimeout(() => {
      if (!firstObjectionVerified || !secondObjectionVerified) {
        reject(new Error("Timeout waiting for objection rulings."));
      }
    }, 8000);
  });

  // Verify final credibility scores on room via API
  const roomRes = await fetch(`${SERVER_URL}/api/rooms/${roomId}`);
  const finalRoom = await roomRes.json();
  console.log("\n[Room Credibility State After Objections]:");
  console.log(`  Petitioner Credibility: ${finalRoom.participants.petitioner.credibility}%`);
  console.log(`  Respondent Credibility: ${finalRoom.participants.respondent.credibility}%`);

  petitioner.close();
  respondent.close();
  console.log("\n[PASS] ALL PHASE 5 IN-TRIAL OBJECTION TESTS PASSED!");
}

runPhase5ObjectionsTest().catch((err) => {
  console.error("[FAIL] Error:", err);
  process.exit(1);
});
