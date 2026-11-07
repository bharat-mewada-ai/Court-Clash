export const ROUND_PHASES = [
  "ROUND_1_OPENING",
  "ROUND_2_REBUTTAL",
  "ROUND_3_CLOSING"
];

export const PHASE_CONFIG = {
  LOBBY: { label: "Lobby", next: "FILING" },
  FILING: { label: "Filing Phase", next: "ROUND_1_OPENING" },
  ROUND_1_OPENING: { label: "Round 1: Opening Arguments", next: "ROUND_2_REBUTTAL" },
  ROUND_2_REBUTTAL: { label: "Round 2: Rebuttal", next: "ROUND_3_CLOSING" },
  ROUND_3_CLOSING: { label: "Round 3: Closing Arguments", next: "DELIBERATION" },
  DELIBERATION: { label: "Judge Deliberation", next: "VERDICT_REVEALED" },
  VERDICT_REVEALED: { label: "Verdict Delivered", next: null }
};

export const DEFAULT_TURN_DURATION_SECONDS = 60; // 60 seconds per turn in live court
export const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";
