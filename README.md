# Court Clash ⚖️

A virtual courtroom simulation game where two parties argue legal disputes in front of an AI Judge grounded strictly by constitutional RAG retrieval.

---

## 🏛️ Architecture Overview
Court Clash consists of 3 microservices:
1. **`ai-service/`** (Python / FastAPI): Handles semantic chunking, multi-namespace vector retrieval, and AI Judge reasoning/verdicts.
   - Swagger / OpenAPI Docs: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`
2. **`server/`** (Node.js / Express / Socket.IO): Authoritative game engine for rooms, turn orders, timers, credibility scoring, and persistence.
   - Swagger / OpenAPI Docs: `http://localhost:3001/docs` (or `/api-docs`)
   - Master Bootstrap: [`server/src/bootstrap/`](file:///c:/Users/ASUS/Desktop/Bharat/Court%20Clash/server/src/bootstrap/) (`database.js`, `crashHandlers.js`, `swagger.js`, `index.js`)
3. **`client/`** (React + Vite): Retro game-like courtroom UI (Fredoka font, rounded cards, live bench, objections, and dramatic verdict reveal).
   - Local Web App: `http://localhost:5173`

---

## 🛠️ Server Bootstrap Architecture (`server/src/bootstrap/`)
The backend is structured with an enterprise bootstrap pipeline:
1. **`crashHandlers.js`**: Global guards for `uncaughtException`, `unhandledRejection`, and graceful termination on `SIGINT` / `SIGTERM`.
2. **`database.js`**: Connects to MongoDB via Mongoose with an automatic, zero-setup in-memory fallback so tests and local runs never crash if MongoDB is offline.
3. **`swagger.js`**: Interactive OpenAPI 3.0 documentation served at `/docs` and `/api-docs` using `swagger-ui-express`.
4. **`index.js`**: Master bootstrap entry coordinating crash protection, database state, and API documentation before starting the server.

---

## 🚀 Phase 1: Ingestion & Vector Retrieval (Completed)

In Phase 1, we established the fundamental ground rule of the courtroom: **The AI judge can never cite an Article that was not retrieved from the chosen constitution.**

### Key Engineering Decisions:
1. **Semantic Article Chunker (`ai-service/app/rag/chunker.py`)**:
   Instead of chunking by fixed token counts (which cuts sentences in half), we chunk by **Article** and **Clause** (e.g., `Article 19 Clause (1)`), preserving article title and full citation provenance.
2. **Multi-Namespace Vector Store (`ai-service/app/rag/vector_store.py`)**:
   Each constitution lives in an isolated namespace. A trial searching the `indian_constitution` namespace can never cross-pollinate into a custom constitution, and vice versa.
3. **Guardrail Against Hallucination**:
   If an argument cites concepts not present in the constitution (e.g. quantum physics), retrieval returns zero matches rather than hallucinating fake Articles.

### Running Phase 1 Tests Locally:
From the root directory:
```bash
# 1. Run semantic ingestion & retrieval tests
python ai-service/test_phase1_ingestion.py

# 2. Run API endpoint tests
python ai-service/test_api_endpoints.py
```

---

## ⚖️ Phase 2: Single-turn Judge (Completed)

In Phase 2, we built the judicial reasoning engine ([`judge_engine.py`](file:///c:/Users/ASUS/Desktop/Bharat/Court%20Clash/ai-service/app/services/judge_engine.py)) and the `/judge/ruling` endpoint in FastAPI.

### Key Engineering Decisions:
1. **Section 8 Judge Contract ([`judge.py`](file:///c:/Users/ASUS/Desktop/Bharat/Court%20Clash/ai-service/app/schemas/judge.py))**:
   Every ruling is validated using Pydantic against the exact contract:
   - `facts_summary`
   - `issues`
   - `petitioner_arguments` & `respondent_arguments`
   - `applicable_articles` (each containing `article`, `quote`, and `why_it_applies` extracted strictly from retrieved chunks)
   - `reasoning`
   - `verdict` & `relief`
   - `disclaimer`: `"This is an educational simulation, not legal advice."`
2. **Three Distinct Judge Personas**:
   - **Strict**: Formal, rigorous burden of proof, uncompromising tone.
   - **Chill**: Conversational, accessible, witty, modern metaphors.
   - **Textualist**: Literal statutory interpretation confined strictly to the plain words of the clause.
3. **Dual-Mode Execution**:
   - Seamlessly calls Gemini API (`gemini-1.5-flash`) with structured JSON mode when `GEMINI_API_KEY` is present.
   - Includes a deterministic, offline legal synthesis engine so local development and automated tests run instantly with zero API dependencies.

### Running Phase 2 Tests Locally:
```bash
python ai-service/test_phase2_judge.py
```

---

## 👥 Phase 3: Two-party Rooms & Authoritative State Machine (Completed)

In Phase 3, we built the Node.js / Express / Socket.IO authoritative game server ([`server/src/app.js`](file:///c:/Users/ASUS/Desktop/Bharat/Court%20Clash/server/src/app.js)).

### Key Engineering Decisions:
1. **Server as Single Source of Truth**:
   Turn order, round transitions, and timers are managed strictly by the server's [`RoomStateMachine`](file:///c:/Users/ASUS/Desktop/Bharat/Court%20Clash/server/src/sockets/roomStateMachine.js) to prevent client-side desync or tampering.
2. **Authoritative Timers & Round Transitions**:
   - `LOBBY` -> `FILING` -> `ROUND_1_OPENING` -> `ROUND_2_REBUTTAL` -> `ROUND_3_CLOSING` -> `DELIBERATION` -> `VERDICT_REVEALED`.
   - The server emits `turn:tick` every second and automatically transfers the floor if a party runs out of time.
3. **Full Transcript Logging**:
   Every join, case filing, oral argument, objection, judge question, and verdict is recorded with timestamps and speaker attribution.
4. **AI Service Bridge ([`aiJudgeBridge.js`](file:///c:/Users/ASUS/Desktop/Bharat/Court%20Clash/server/src/services/aiJudgeBridge.js))**:
   Connects the Socket.IO server to the FastAPI AI Judge service to retrieve grounded verdicts during deliberation.

### Running Phase 3 Tests Locally:
```bash
cd server
npm test
```

---

## 🎨 Phase 4: Courtroom UI & Design System (Completed)

In Phase 4, we built the full interactive React frontend ([`client/src/App.jsx`](file:///c:/Users/ASUS/Desktop/Bharat/Court%20Clash/client/src/App.jsx)) matching the Section 5 specifications:

### Design Tokens & Layout Implementation:
- **Palette**: Dark Mode (`#1B1740`), Cards (`#2A2566`), Chip tracks (`#3A3380`), Muted text (`#C9C6F0`).
- **Accents**: Gold (`#FFC53D`) for Judge & Primary actions, Coral (`#FF5D73`) for Petitioner & Objections, Mint (`#3DDBB0`) for Respondent & Articles.
- **Typography**: Fredoka Google Font (400 to 700) with rounded corners (14–20px) and touch targets >= 44px.
- **No Emoji Icons**: All icons rendered using crisp inline SVG components ([`Icons.jsx`](file:///c:/Users/ASUS/Desktop/Bharat/Court%20Clash/client/src/components/shared/Icons.jsx)).

### Screens Built:
1. **Lobby ([`Lobby.jsx`](file:///c:/Users/ASUS/Desktop/Bharat/Court%20Clash/client/src/screens/Lobby.jsx))**:
   - Rulebook cards (Indian Constitution, University Code, Gaming Charter).
   - Presiding Judge Persona picker (Strict, Chill, Textualist).
   - Turn duration configuration & copyable courtroom invite link.
   - Primary "Open Court & Begin Session" action button.
2. **Live Courtroom 3-Column Layout ([`LiveCourtroom.jsx`](file:///c:/Users/ASUS/Desktop/Bharat/Court%20Clash/client/src/screens/LiveCourtroom.jsx))**:
   - **TopBar**: Title, Round chip, Active Floor chip, and authoritative countdown Timer.
   - **Left Column**: PetitionerCard (Coral `#FF5D73`, credibility bar, latest submission bubble).
   - **Center Column**: Bench (Gold `#FFC53D`, judge avatar, speech bubble, articles in play, auto-scrolling live transcript).
   - **Right Column**: RespondentCard (Mint `#3DDBB0`, credibility bar, latest submission bubble).
   - **Bottom Bar**: ArgumentBar with input, `Objection!`, `Cite Article`, and `Submit argument` buttons.
3. **Verdict Screen ([`VerdictScreen.jsx`](file:///c:/Users/ASUS/Desktop/Bharat/Court%20Clash/client/src/screens/VerdictScreen.jsx))**:
   - Gavel strike animation & celebratory confetti.
   - Full Section 8 structured ruling card with grounded citations.
   - One-click case transcript download (`.txt`).
4. **Constitution Editor ([`ConstitutionEditor.jsx`](file:///c:/Users/ASUS/Desktop/Bharat/Court%20Clash/client/src/screens/ConstitutionEditor.jsx))**:
   - Interactive rulebook builder allowing users to author custom articles and ingest them into private RAG namespaces.

### Running Client Locally:
```bash
cd client
npm run dev
# Open http://localhost:5173
```

---

## ⚡ Phase 5: In-Trial Objections & Judge Interactivity (Completed)

In Phase 5, we brought the courtroom to life with dynamic mid-trial interactions:

### Key Engineering Features:
1. **AI Objection Evaluation Engine ([`judge_engine.py`](file:///c:/Users/ASUS/Desktop/Bharat/Court%20Clash/ai-service/app/services/judge_engine.py))**:
   - Analyzes objection grounds (*Relevance*, *Speculation*, *Hearsay*, *Prejudicial*) against the target argument.
   - **`SUSTAINED`**: Renders persona-styled legal ruling, strikes improper claims from the record, and rewards the objecting party (+5 credibility) while penalizing the target party (-6 credibility).
   - **`OVERRULED`**: Allows argument to proceed and penalizes frivolous interruptions (-5 credibility).
2. **In-Trial Judge Questions (`POST /judge/question`)**:
   - The AI Judge formulates short, pointed, one-at-a-time inquiries citing specific constitutional articles (e.g. Article 19(2) limitations) to pressure the speaking counsel.
3. **Interactive Objection Modal ([`ArgumentBar.jsx`](file:///c:/Users/ASUS/Desktop/Bharat/Court%20Clash/client/src/components/courtroom/ArgumentBar.jsx))**:
   - Counsel can pick standard evidentiary grounds or type specific custom objections.
4. **Live Ruling Banner & Real-Time Credibility Shifts ([`LiveCourtroom.jsx`](file:///c:/Users/ASUS/Desktop/Bharat/Court%20Clash/client/src/screens/LiveCourtroom.jsx))**:
   - Renders a prominent animated banner on objection rulings and dynamically updates the credibility progress bars.

### Running Phase 5 Tests Locally:
```bash
# 1. Test AI Judge Question & Objection Logic (Python)
python ai-service/test_phase5_interactivity.py

# 2. Test Real-time Objection Socket Flow & Credibility Shifts (Node)
node server/test/phase5_objections_test.js
```

---

## 📜 Phase 6: Custom Constitutions & Namespace Isolation (Completed)

In Phase 6, we implemented full support for user-authored constitutions and private vector namespace retrieval:

### Key Engineering Features:
1. **Dynamic Constitution API ([`constitutionStore.js`](file:///c:/Users/ASUS/Desktop/Bharat/Court%20Clash/server/src/models/constitutionStore.js))**:
   - `GET /api/constitutions`: Fetches all public, built-in, and custom constitutions.
   - `POST /api/constitutions`: Ingests and semantically chunks custom articles into an isolated RAG namespace in `ai-service`.
   - `DELETE /api/constitutions/:id`: Allows removing custom rulebooks (with built-in Indian Constitution permanently protected).
2. **Interactive Rulebook Authoring ([`ConstitutionEditor.jsx`](file:///c:/Users/ASUS/Desktop/Bharat/Court%20Clash/client/src/screens/ConstitutionEditor.jsx))**:
   - Includes quick one-click starter templates (*Campus Disciplinary Charter*, *Competitive Esports & Guild Charter*, *Royal Kingdom Accords*).
   - Allows drafting custom articles with title, part, and clauses.
3. **Dynamic Rulebook Picker ([`Lobby.jsx`](file:///c:/Users/ASUS/Desktop/Bharat/Court%20Clash/client/src/screens/Lobby.jsx))**:
   - Dynamically loads custom constitutions from the server.
   - Custom rulebooks are tagged with a Mint badge and feature a delete option for room owners.
4. **Strict Namespace Isolation Verified**:
   - Trials running under a custom constitution only retrieve and cite custom articles. Cross-namespace leakage between the Indian Constitution and custom rulebooks is strictly prevented.

### Running Phase 6 Tests Locally:
```bash
node server/test/phase6_custom_constitution_test.js
```

---

## ✨ Phase 7: Polish & Experience Enhancements (Completed)

In Phase 7, we brought game-feel, accessibility, and utility polish across the stack:

### Key Engineering Features:
1. **Full Official Constitution of India (507 Articles & 1,383 Semantic Clauses)**:
   - Completely populated from the official legislative corpus: covers Preamble, Part I through Part XXII, all fundamental rights (Articles 12–35), Directive Principles (Articles 36–51), Fundamental Duties (Article 51A), Union & State Executive, Judiciary (Supreme Court & High Courts), Emergency Provisions (Articles 352–360), and Constitutional Amendments (Article 368).
2. **Supreme Court Landmark Precedents Dataset (`indian_case_law`)**:
   - Ingested landmark constitutional rulings (*Kesavananda Bharati*, *Maneka Gandhi*, *Puttaswamy Privacy*, *Navtej Johar 377*, *Shreya Singhal 66A*, *Vishaka*, *Indira Sawhney*, *Minerva Mills*, *Shayara Bano*, *S.R. Bommai*, *Olga Tellis*).
3. **Procedural Sound Effects (`client/src/services/soundEffects.js`)**:
   - Zero external audio assets or heavy MP3 downloads: utilizes the browser's native **Web Audio API** (`AudioContext`, `BiquadFilterNode`, `OscillatorNode`, `GainNode`).
   - Synthesizes realistic judicial audio:
     - **Gavel Strike**: Realistic dual-oscillator wooden thud with low-pass resonance.
     - **Objection Stinger**: Sudden sharp minor dissonant chord for objection alerts.
     - **Turn Chime**: Friendly pentatonic chime indicating turn switch.
     - **Verdict Fanfare**: Ascending triumphant arpeggio upon final ruling reveal.
   - Built-in mute/unmute audio control with state persistence in `TopBar.jsx`.
2. **Dramatic Verdict Reveal**:
   - Animated gavel drop animation with screen shake and confetti burst upon judicial delivery.
3. **Printable Case Transcript & Official PDF Export**:
   - Comprehensive `@media print` CSS rules in `index.css`.
   - "Print / Save as PDF" button on the Verdict screen that formats the judicial ruling into an official court transcript layout (white background, high-contrast serif/sans typography, official seal header, disclaimers, and signature lines).
4. **Mobile Responsive Courtroom Layout**:
   - Media queries (`@media (max-width: 900px)`) allowing the 3-column 1200px courtroom to fluidly stack vertically on phones and tablets: Petitioner Card &rarr; Judicial Bench &rarr; Respondent Card &rarr; Argument Bar.
   - Minimum 44px touch targets on mobile inputs and action buttons.

---

## 🚀 How to Run the Entire Application

To launch Court Clash locally, open three terminal windows:

### Terminal 1: AI Service (Python FastAPI)
```bash
cd ai-service
# Optional: Set Gemini API key for live LLM mode, or leave unset for built-in offline engine
# export GEMINI_API_KEY="your-key"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- Swagger Docs: `http://localhost:8000/docs`

### Terminal 2: Game Backend (Node.js / Express / Socket.IO)
```bash
cd server
npm start
```
- Swagger Docs: `http://localhost:3001/docs`

### Terminal 3: Courtroom Frontend (React / Vite)
```bash
cd client
npm run dev
```
- Open `http://localhost:5173` in your browser!

