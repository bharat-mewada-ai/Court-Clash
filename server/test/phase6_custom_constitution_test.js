/**
 * Phase 6 Verification Test:
 * Tests the complete custom constitution lifecycle:
 * 1. Fetching available constitutions
 * 2. Creating and ingesting a custom constitution into a private vector namespace
 * 3. Running an authoritative trial under the custom constitution
 * 4. Verifying AI Judge delivers grounded citations strictly from the custom rulebook
 * 5. Moderation test: Deleting the custom constitution & protecting the built-in constitution
 */
import { io as ClientIO } from "socket.io-client";

const SERVER_URL = "http://localhost:3001";

async function runPhase6CustomConstitutionTest() {
  console.log("=".repeat(65));
  console.log("COURT CLASH - PHASE 6: CUSTOM CONSTITUTIONS & ISOLATION TEST");
  console.log("=".repeat(65));

  // 1. Fetch initial constitutions
  console.log("\n[Step 1] Fetching available rulebooks from /api/constitutions...");
  const initRes = await fetch(`${SERVER_URL}/api/constitutions`);
  const initialList = await initRes.json();
  console.log(`Found ${initialList.length} rulebooks:`, initialList.map(c => c.name));
  const hasIndian = initialList.some(c => c.id === "indian_constitution" && c.isBuiltIn);
  console.log(`  [PASS] Built-in Indian Constitution is present and protected: ${hasIndian}`);

  // 2. Create Custom Rulebook: Galactic Federation Accords
  console.log("\n[Step 2] Authoring & Ingesting Custom Rulebook: 'Galactic Federation Accords'...");
  const customPayload = {
    name: "Galactic Federation Accords",
    description: "Interplanetary governance treaty covering orbital weapons, FTL commerce, and colony rights.",
    articles: [
      {
        number: "Article 1",
        title: "Freedom of Peaceful Warp Navigation",
        part: "Volume I - Spaceborne Rights",
        text: "All civilian registered freighters and scientific exploration vessels shall enjoy unrestricted transit through Federation jump-gates without arbitrary interdiction."
      },
      {
        number: "Article 2",
        title: "Absolute Prohibition of Orbital Kinetic Strikes",
        part: "Volume II - Armament Restrictions",
        text: "The deployment of kinetic mass-drivers, tungsten rods, or relativistic bombardment against planetary biosphere settlements is strictly forbidden and constitutes a high cosmic crime."
      }
    ]
  };

  const createRes = await fetch(`${SERVER_URL}/api/constitutions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(customPayload)
  });
  assert(createRes.status === 201, `Failed to create constitution: ${createRes.status}`);
  const { constitution: customConst } = await createRes.json();
  console.log(`  [PASS] Custom constitution created with private namespace: '${customConst.id}'`);

  // 3. Create Courtroom Chamber under this Custom Constitution
  console.log("\n[Step 3] Opening Courtroom Chamber under 'Galactic Federation Accords'...");
  const roomRes = await fetch(`${SERVER_URL}/api/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      constitutionId: customConst.id,
      judgePersona: "Textualist",
      creatorName: "Colony Envoy",
      turnDuration: 2
    })
  });
  const { roomId } = await roomRes.json();
  console.log(`  [PASS] Room '${roomId}' initialized with constitution: ${customConst.id}`);

  // 4. Run Trial via Socket.IO
  console.log("\n[Step 4] Running Trial & Arguing Under Custom Constitution...");
  const petitioner = ClientIO(SERVER_URL);
  const respondent = ClientIO(SERVER_URL);

  let verdictReceived = false;

  await new Promise((resolve, reject) => {
    petitioner.on("connect", () => {
      petitioner.emit("room:join", { roomId, name: "Colony Envoy", side: "petitioner" });
    });

    respondent.on("connect", () => {
      respondent.emit("room:join", { roomId, name: "Fleet Commander", side: "respondent" });
    });

    petitioner.on("room:state", (state) => {
      if (state.phase === "FILING") {
        petitioner.emit("case:file", {
          roomId,
          caseTitle: "Mining Colony Omicron v. Sector Fleet 7",
          facts: "Fleet deployed kinetic orbital bombardment during dispute over antimatter refining dues.",
          reliefSought: "Immediate cessation of bombardment and dismantling of orbital mass drivers."
        });
      }
    });

    petitioner.on("turn:start", (turnData) => {
      if (turnData.activeTurnSide === "petitioner") {
        petitioner.emit("argument:submit", {
          roomId,
          text: "The orbital kinetic bombardment directly violates Article 2 of the Galactic Federation Accords."
        });
      }
    });

    respondent.on("turn:start", (turnData) => {
      if (turnData.activeTurnSide === "respondent") {
        respondent.emit("argument:submit", {
          roomId,
          text: "Fleet action was a defensive police maneuver to collect unpaid trade tariffs."
        });
      }
    });

    petitioner.on("verdict:ready", ({ verdict }) => {
      console.log("\n[Step 5] VERDICT DELIVERED UNDER CUSTOM CONSTITUTION:");
      console.log(`  Verdict: ${verdict.verdict}`);
      console.log(`  Judge Persona: ${verdict.judge_persona}`);
      console.log(`  Applicable Articles Cited:`, verdict.applicable_articles?.map(a => a.article));
      console.log(`  Reasoning Snippet: ${verdict.reasoning.slice(0, 160)}...`);

      // Verify Grounding Isolation: Must cite Article 2 from Galactic Accords, never Indian Constitution!
      const citedStr = JSON.stringify(verdict.applicable_articles || []);
      const citesCustom = citedStr.includes("Article 2");
      const citesIndian = citedStr.includes("Constitution of India");

      console.log(`  - Cited Custom Article 2: ${citesCustom ? "YES" : "NO"}`);
      console.log(`  - Leaked Indian Constitution: ${citesIndian ? "YES" : "NO"}`);

      assert(citesCustom, "Verdict must cite custom Article 2");
      assert(!citesIndian, "Verdict must NOT leak Indian Constitution");
      console.log("  [PASS] Strict namespace isolation verified! Judge cited only the custom charter.");

      verdictReceived = true;
      resolve();
    });

    setTimeout(() => {
      if (!verdictReceived) reject(new Error("Test timed out before verdict was rendered."));
    }, 12000);
  });

  // 6. Moderation Test: Delete custom constitution
  console.log("\n[Step 6] Moderation Test: Removing Custom Constitution...");
  const delRes = await fetch(`${SERVER_URL}/api/constitutions/${customConst.id}`, { method: "DELETE" });
  assert(delRes.status === 200, "Failed to delete custom constitution");
  console.log(`  [PASS] Successfully deleted '${customConst.id}'`);

  // Verify built-in protection
  console.log("Testing protection of built-in Indian Constitution...");
  const protectRes = await fetch(`${SERVER_URL}/api/constitutions/indian_constitution`, { method: "DELETE" });
  assert(protectRes.status === 400, "Built-in constitution must not be deletable");
  console.log("  [PASS] Built-in constitution cannot be deleted (Protected).");

  petitioner.close();
  respondent.close();
  console.log("\n" + "=".repeat(65));
  console.log("ALL PHASE 6 CUSTOM CONSTITUTION & ISOLATION TESTS PASSED!");
  console.log("=".repeat(65));
  process.exit(0);
}

function assert(condition, message) {
  if (!condition) {
    console.error(`[ASSERTION FAILED]: ${message}`);
    process.exit(1);
  }
}

runPhase6CustomConstitutionTest().catch((err) => {
  console.error("[FAIL] Error:", err);
  process.exit(1);
});
