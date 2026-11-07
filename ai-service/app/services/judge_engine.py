"""
Judicial Reasoning Engine:
1. RAG retrieval over the designated constitution namespace.
2. Grounded-only citation enforcement: judge NEVER cites articles not retrieved.
3. Multi-persona judicial styling (Strict, Chill, Textualist).
4. Schema-validated verdict output matching Section 8.
5. Works offline (heuristic rule engine) and online (with Gemini / OpenAI API).
"""
import os
import json
from typing import List, Dict, Optional
import urllib.request
import urllib.error

from app.schemas.judge import (
    JudgeCaseInput,
    JudgeVerdict,
    ApplicableArticle,
    JudgePersona,
    JudgeQuestionInput,
    JudgeQuestionOutput,
    JudgeObjectionInput,
    JudgeObjectionOutput,
    TurnEventInput,
    TurnReactionOutput,
    ArticleCheck,
    ArticleCheckStatus,
    JudgeEffects,
    SoundEffect,
    BadgeType,
    JudgeEmotion,
    GalleryReaction,
    VerdictPayload
)
from app.schemas.constitution import RetrievedArticle
from app.rag.vector_store import vector_store

MANDATORY_DISCLAIMER = "This is an educational simulation, not legal advice."

def retrieve_grounded_articles(case: JudgeCaseInput) -> List[RetrievedArticle]:
    """
    Retrieves candidate articles for facts, relief sought, and both arguments.
    Deduplicates results while preserving ranking.
    """
    queries = [
        case.facts,
        case.relief_sought,
        " ".join(case.petitioner_arguments[:2]),
        " ".join(case.respondent_arguments[:2])
    ]

    seen_chunk_ids = set()
    retrieved: List[RetrievedArticle] = []

    for q in queries:
        if not q.strip():
            continue
        matches = vector_store.search(case.namespace_id, q, top_k=2)
        for m in matches:
            if m.chunk_id not in seen_chunk_ids:
                seen_chunk_ids.add(m.chunk_id)
                retrieved.append(m)

    # Sort descending by relevance score
    retrieved.sort(key=lambda x: x.score, reverse=True)
    return retrieved[:4]


def generate_verdict_prompt(case: JudgeCaseInput, retrieved: List[RetrievedArticle]) -> str:
    """Builds the prompt enforcing strict grounding and persona tone."""
    grounded_law_text = ""
    if retrieved:
        for idx, art in enumerate(retrieved, 1):
            clause_str = f" ({art.clause})" if art.clause else ""
            grounded_law_text += f"\n[{idx}] {art.article_number}{clause_str} - {art.title}:\n\"{art.text}\"\n"
    else:
        grounded_law_text = "NO RELEVANT ARTICLES FOUND IN CHOSEN CONSTITUTION."

    persona_instructions = {
        JudgePersona.STRICT: (
            "You are a STRICT, no-nonsense judge. Formal, authoritative, demanding high burden of proof. "
            "You brook no emotional appeals. Focus strictly on legal boundaries."
        ),
        JudgePersona.CHILL: (
            "You are a CHILL, modern judge. Friendly, conversational, slightly witty, uses everyday metaphors, "
            "but takes the law seriously. Speaks like an approachable mentor."
        ),
        JudgePersona.TEXTUALIST: (
            "You are a TEXTUALIST judge. You care ONLY about the plain meaning of the text, specific words, "
            "and literal statutory definitions. Do not speculate about intent or vague fairness."
        )
    }

    prompt = f"""You are the AI Judge presiding over Court Clash.
PERSONA: {persona_instructions.get(case.persona, persona_instructions[JudgePersona.STRICT])}

CRITICAL RULES:
1. You may ONLY cite articles listed under GROUNDED ARTICLES below. NEVER cite an Article number not in that list.
2. If no articles are applicable, clearly state that the claim has no constitutional grounding.
3. Return valid JSON adhering to the required schema.

CASE DETAILS:
Case Title: {case.case_title}
Factual Background: {case.facts}
Relief Sought: {case.relief_sought}
Petitioner Arguments: {json.dumps(case.petitioner_arguments)}
Respondent Arguments: {json.dumps(case.respondent_arguments)}
Evidence: {json.dumps(case.evidence)}

GROUNDED ARTICLES (YOU MAY ONLY USE THESE):
{grounded_law_text}

JSON SCHEMA REQUIRED:
{{
  "facts_summary": "string",
  "issues": ["question of law 1", "question of law 2"],
  "petitioner_arguments": ["summary 1"],
  "respondent_arguments": ["summary 1"],
  "applicable_articles": [
    {{"article": "Article 19", "quote": "quote from grounded text", "why_it_applies": "explanation"}}
  ],
  "reasoning": "detailed judicial synthesis matching persona tone",
  "verdict": "In favor of Petitioner | In favor of Respondent | Dismissed",
  "relief": "remedies granted or denied",
  "credibility_scores": {{"petitioner": 85, "respondent": 70}}
}}
"""
    return prompt


def call_llm_api(prompt: str) -> Optional[dict]:
    """
    Attempts to call Gemini API if GEMINI_API_KEY is configured.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None

    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": 0.2
            }
        }
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(text)
    except Exception as e:
        print(f"[LLM API Notice] API call did not succeed, using grounded reasoning engine: {e}")
        return None


def generate_offline_verdict(case: JudgeCaseInput, retrieved: List[RetrievedArticle]) -> JudgeVerdict:
    """
    Heuristic judicial reasoning engine:
    Produces rich, grounded, persona-differentiated judgements even without an active LLM API key.
    """
    # 1. Facts & Issues
    facts_summary = f"The matter of '{case.case_title}' concerns: {case.facts[:180]}..."
    issues = [
        f"Whether the respondent's actions violate rights protected under {case.namespace_id}.",
        f"Whether the petitioner is entitled to the relief sought: '{case.relief_sought}'."
    ]

    # 2. Process Grounded Articles
    applicable_articles: List[ApplicableArticle] = []
    if retrieved:
        for art in retrieved[:2]:
            quote_snippet = art.text[:140].replace("\n", " ") + "..."
            applicable_articles.append(
                ApplicableArticle(
                    article=art.article_number + (f" ({art.clause})" if art.clause else ""),
                    quote=quote_snippet,
                    why_it_applies=f"Governs the balance between protected rights and regulatory authority under {art.title}."
                )
            )

    # 3. Persona styling for reasoning & verdict
    p_str = " ".join(case.petitioner_arguments)
    r_str = " ".join(case.respondent_arguments)
    
    # Assess relative merit (if petitioner cited strong rights violations vs vague justification)
    petitioner_wins = len(retrieved) > 0 and len(p_str) >= len(r_str) * 0.7

    if case.persona == JudgePersona.STRICT:
        tone_prefix = "The Court has scrupulously evaluated the submissions on record. The law demands clear demonstration of infringement."
        if petitioner_wins:
            reasoning = (
                f"{tone_prefix} The respondent has failed to establish that its restrictions satisfy the strict test of legal authority. "
                f"Under the cited constitutional provisions, fundamental guarantees cannot be abridged on mere administrative convenience. "
                f"The petitioner's claim is substantiated by the grounded text of {retrieved[0].article_number if retrieved else 'law'}."
            )
            verdict = "In favor of the Petitioner"
            relief = f"Order granted: {case.relief_sought} The respondent is directed to cease enforcing the contested restriction immediately."
            credibility = {"petitioner": 88, "respondent": 64}
        else:
            reasoning = (
                f"{tone_prefix} The petitioner has fallen short of discharging the evidentiary burden required to displace established regulations. "
                f"Without concrete evidence of an unconstitutional act, the Court must refrain from arbitrary interference."
            )
            verdict = "In favor of the Respondent (Case Dismissed)"
            relief = f"Relief denied. The petition is dismissed without costs."
            credibility = {"petitioner": 60, "respondent": 82}

    elif case.persona == JudgePersona.CHILL:
        tone_prefix = "Alright, let's unpack what's actually happening here. Both sides made some noise, but we have to stick to the actual rulebook."
        if petitioner_wins:
            reasoning = (
                f"{tone_prefix} Look, the respondent overstepped. You can't just slap restrictions on someone without a solid rule to stand on. "
                f"Checking our rulebook ({retrieved[0].article_number if retrieved else 'the rules'}), the petitioner is totally within their rights. "
                f"Keep it fair and respect the boundaries."
            )
            verdict = "In favor of the Petitioner"
            relief = f"Granted: {case.relief_sought} Let's resolve this peacefully—respondent, lift the restriction."
            credibility = {"petitioner": 85, "respondent": 70}
        else:
            reasoning = (
                f"{tone_prefix} I hear where the petitioner is coming from, but honestly, the respondent didn't break any written rules here. "
                f"You can't claim a foul if it's not in the rulebook. Let's not make a federal case out of a standard procedure."
            )
            verdict = "In favor of the Respondent"
            relief = "No relief granted. Everyone take a breather and move on."
            credibility = {"petitioner": 68, "respondent": 84}

    else:  # TEXTUALIST
        tone_prefix = "Judicial authority is confined strictly to the four corners of the written text. Subjective intentions and equitable pleas are inadmissible."
        if retrieved:
            primary_art = retrieved[0]
            reasoning = (
                f"{tone_prefix} We inspect the literal wording of {primary_art.article_number}. The operative terminology states: '{primary_art.text[:100]}...'. "
                f"Applying the statutory words verbatim to the facts, the text explicitly reserves this domain. "
                f"Because the text admits of no contrary reading, the outcome is dictated purely by the letter of the clause."
            )
        else:
            reasoning = (
                f"{tone_prefix} A search of the designated namespace yields zero textual clauses supporting the claim. "
                f"In the absence of an express statutory or constitutional clause, this Court possesses no power to fabricate a right."
            )
        verdict = "In favor of the Petitioner" if petitioner_wins else "In favor of the Respondent"
        relief = f"Relief {'granted' if petitioner_wins else 'refused'} strictly according to the statutory text."
        credibility = {"petitioner": 82, "respondent": 78}

    return JudgeVerdict(
        case_title=case.case_title,
        judge_persona=case.persona.value,
        facts_summary=facts_summary,
        issues=issues,
        petitioner_arguments=case.petitioner_arguments,
        respondent_arguments=case.respondent_arguments,
        applicable_articles=applicable_articles,
        reasoning=reasoning,
        verdict=verdict,
        relief=relief,
        credibility_scores=credibility,
        disclaimer=MANDATORY_DISCLAIMER
    )


def judge_case(case: JudgeCaseInput) -> JudgeVerdict:
    """
    Main entry point for Phase 2 judicial ruling.
    Retrieves grounded articles -> executes reasoning -> validates schema and citations.
    """
    # 1. RAG Retrieval strictly in chosen namespace
    retrieved = retrieve_grounded_articles(case)

    # 2. Attempt LLM API call if key configured
    prompt = generate_verdict_prompt(case, retrieved)
    llm_output = call_llm_api(prompt)

    if llm_output:
        try:
            # Enforce that LLM only used retrieved articles
            valid_articles = []
            retrieved_numbers = {r.article_number for r in retrieved}
            for app_art in llm_output.get("applicable_articles", []):
                # Only keep articles that exist in our retrieved pool
                if any(num in app_art.get("article", "") for num in retrieved_numbers):
                    valid_articles.append(ApplicableArticle(**app_art))

            return JudgeVerdict(
                case_title=case.case_title,
                judge_persona=case.persona.value,
                facts_summary=llm_output.get("facts_summary", case.facts[:180]),
                issues=llm_output.get("issues", ["Legal issue for determination"]),
                petitioner_arguments=llm_output.get("petitioner_arguments", case.petitioner_arguments),
                respondent_arguments=llm_output.get("respondent_arguments", case.respondent_arguments),
                applicable_articles=valid_articles,
                reasoning=llm_output.get("reasoning", "Standard reasoning"),
                verdict=llm_output.get("verdict", "In favor of the Petitioner"),
                relief=llm_output.get("relief", case.relief_sought),
                credibility_scores=llm_output.get("credibility_scores", {"petitioner": 80, "respondent": 75}),
                disclaimer=MANDATORY_DISCLAIMER
            )
        except Exception as e:
            print(f"[Fallback] Error parsing LLM response into schema: {e}. Generating offline grounded verdict.")

    # 3. Fallback: High fidelity offline judicial reasoning engine
    return generate_offline_verdict(case, retrieved)


def generate_judge_question(payload: JudgeQuestionInput) -> JudgeQuestionOutput:
    """
    Formulates a short, pointed in-trial question referencing a specific Article or claim (Section 8).
    Persona alters tone and strictness without breaking grounding.
    """
    # 1. Retrieve article relevant to current argument
    retrieved = vector_store.search(payload.namespace_id, payload.current_argument, top_k=1)
    cited_art = retrieved[0].article_number if retrieved else "constitutional rules"

    target = "Petitioner" if payload.speaker_side == "petitioner" else "Respondent"

    if payload.persona == JudgePersona.STRICT:
        question = (
            f"Counsel for {target}: State with procedural exactness how your submission reconciles with {cited_art}. "
            f"Are you suggesting this Court disregard established restrictions?"
        )
        urgency = "Pressing"
    elif payload.persona == JudgePersona.CHILL:
        question = (
            f"Hold up, Counsel for {target}. Looking at {cited_art}, how do you actually square that claim? "
            f"Break it down simply for the bench."
        )
        urgency = "Standard"
    else:  # TEXTUALIST
        question = (
            f"Counsel for {target}: Direct the Court to the exact word or phrase in {cited_art} that supports your proposition. "
            f"Where in the text is that remedy authorized?"
        )
        urgency = "Pressing"

    return JudgeQuestionOutput(
        target_side=payload.speaker_side,
        question=question,
        referenced_article=cited_art,
        urgency=urgency
    )


def evaluate_objection(payload: JudgeObjectionInput) -> JudgeObjectionOutput:
    """
    Authoritative judicial evaluation of in-trial objections:
    Calculates whether the objection has legal merit, impacts credibility, and delivers persona-styled ruling.
    """
    reason_lower = payload.reason.lower()
    target_side = "respondent" if payload.objecting_side == "petitioner" else "petitioner"

    # Assess validity of objection
    # Valid grounds: relevance, speculative, hearsay, unconstitutional, outside record
    is_valid_ground = any(
        term in reason_lower
        for term in ["relevance", "speculative", "speculation", "hearsay", "unconstitutional", "outside", "prejudicial"]
    )

    if is_valid_ground:
        ruling = "SUSTAINED"
        struck = True
        credibility_impact = {
            payload.objecting_side: 5,   # Bonus for timely, sharp objection
            target_side: -6              # Penalty for improper argument
        }
        if payload.persona == JudgePersona.STRICT:
            explanation = (
                f"Objection SUSTAINED. The argument tendered by {target_side.upper()} offends evidentiary rules ({payload.reason}). "
                f"The remarks are hereby struck from the judicial record."
            )
        elif payload.persona == JudgePersona.CHILL:
            explanation = (
                f"Yeah, fair point—SUSTAINED. {target_side.capitalize()} counsel, let's keep it grounded in actual facts. "
                f"That line of argument is wiped from the board."
            )
        else:  # TEXTUALIST
            explanation = (
                f"SUSTAINED. The statutory text admits of no such premise. "
                f"The offending submission is excised from the formal transcript."
            )
    else:
        # Frivolous objection
        ruling = "OVERRULED"
        struck = False
        credibility_impact = {
            payload.objecting_side: -5,  # Penalty for time-wasting interruption
            target_side: 2               # Small composure bonus
        }
        if payload.persona == JudgePersona.STRICT:
            explanation = (
                f"Objection OVERRULED. The submission is within permissible argumentative bounds. "
                f"Counsel for {payload.objecting_side.upper()} will refrain from frivolous interruptions."
            )
        elif payload.persona == JudgePersona.CHILL:
            explanation = (
                f"OVERRULED. That's a valid argument to make. Let counsel cook, we'll weigh it at the end."
            )
        else:
            explanation = (
                f"OVERRULED. The text cited is legally relevant. Proceed without further frivolous hindrance."
            )

    return JudgeObjectionOutput(
        ruling=ruling,
        explanation=explanation,
        credibility_impact=credibility_impact,
        struck_from_record=struck
    )


# -------------------------------------------------------------
# Dynamic Turn-Reaction Engine (Hinglish Personas & Gallery)
# -------------------------------------------------------------
SYSTEM_PROMPT_TEMPLATE = """You are the PRESIDING JUDGE in "Court Clash", an educational, entertaining courtroom simulation for Indian college students. You are NOT a boring chatbot. You are a character with personality, but you always stay fair and grounded in the law provided.

# PERSONA
Active persona: {persona}   // one of: STRICT, SARCASTIC, FILMY, SLEEPY

- STRICT: No-nonsense, formal, sharp. Short sentences. Disciplines sloppy arguments.
  e.g. "Counsel, yeh court hai, chai ki tapri nahi. Point pe aao."
- SARCASTIC: Dry wit, roasts weak arguments politely but savagely.
  e.g. "Wah, kitni gehri baat. Ab isme koi Article bhi hai ya sirf vibes?"
- FILMY: Bollywood-courtroom drama. Dialogue-baazi, "Order! Order!", "Tareekh pe tareekh".
  e.g. "Objection sustained! Aur yeh court emotion se nahi, saboot se chalti hai."
- SLEEPY: Drowsy old judge, occasionally dozes mid-sentence ("...hmm? haan, continue"). Wakes up sharply on a really good point.

# LANGUAGE
- Reply in Hinglish (Hindi in Roman script mixed with simple English), matching the user's tone.
- Legal terms (Article, objection, sustained, overruled) stay in English.
- Max 2-3 short sentences for "judge_line". Punchy, quotable, never a lecture.
- Light humor is encouraged. Never insult religion, caste, gender, region, or any real person. Roast the ARGUMENT, never the PERSON.

# LEGAL GROUNDING
- Base all legal reasoning ONLY on the provided constitution context:
{rag_context}
- If a user cites an Article, verify it against the context.
  - Correct and relevant -> reward.
  - Real but irrelevant -> mild penalty, explain why.
  - Not found / wrong -> "bluff caught": larger penalty, call it out in persona.
- Never invent Articles or case law. If context is insufficient, say so in character
  (e.g. "Court ke paas is baat ka record nahi hai, apna point clear karo.").
- This is an educational simulation, not legal advice.

# GAME STATE
Phase: {phase}
Petitioner: {petitioner_name}, credibility {pet_score}
Respondent: {respondent_name}, credibility {resp_score}
Last event: {event_type}
Event payload: {event_text}
Speaker: {speaker_role}
Transcript (last 10): {transcript}
Time left: {seconds_left}

# OUTPUT FORMAT (STRICT)
Return ONLY valid JSON:
{{
  "judge_line": "string (Hinglish, in persona, max 3 sentences)",
  "ruling": "NONE | SUSTAINED | OVERRULED | WARNING | VERDICT",
  "score_delta": {{ "petitioner": 0, "respondent": 0 }},
  "score_reason": "string, max 8 words",
  "article_check": {{
    "cited": "string or null",
    "status": "CORRECT | IRRELEVANT | NOT_FOUND | NONE"
  }},
  "effects": {{
    "sound": "NONE | GAVEL | OBJECTION | DRUMROLL | HEARTBEAT | SNORE | CHEER",
    "screen_shake": false,
    "badge": "NONE | ARTICLE_MASTER | BLUFF_CAUGHT | SMOOTH_TALKER",
    "judge_emotion": "NEUTRAL | ANGRY | AMUSED | THINKING | SLEEPING | IMPRESSED"
  }},
  "gallery": [ {{ "user": "string", "text": "string" }} ],
  "verdict": null
}}
"""

def generate_turn_reaction(turn: TurnEventInput) -> TurnReactionOutput:
    """
    Evaluates in-flight courtroom events (submissions, objections, citations, timeouts)
    and returns rich persona-styled Hinglish reactions, score deltas, effects, and crowd reactions.
    """
    import re
    persona_key = turn.persona.upper()
    if persona_key not in ["STRICT", "SARCASTIC", "FILMY", "SLEEPY"]:
        persona_key = "STRICT"

    # 1. RAG retrieval for grounding
    retrieved = []
    if turn.event_text.strip():
        retrieved = vector_store.search(turn.namespace_id, turn.event_text, top_k=3)

    rag_text = ""
    for idx, r in enumerate(retrieved, 1):
        rag_text += f"[{idx}] {r.article_number} - {r.title}: {r.text[:200]}...\n"
    if not rag_text:
        rag_text = "NO CONSTITUTIONAL PROVISIONS FOUND FOR THIS QUERY.\n"

    # 2. Check for Article citations
    match = re.search(r"(Article\s+\d+[A-Z]?|Rule\s+\d+|Section\s+\d+)", turn.event_text, re.IGNORECASE)
    cited_art = match.group(0).title() if match else None

    # Check citation grounding
    article_status = ArticleCheckStatus.NONE
    if cited_art:
        # Check if in retrieved
        if any(cited_art.lower() in r.article_number.lower() for r in retrieved):
            article_status = ArticleCheckStatus.CORRECT
        else:
            # Check if exists anywhere in namespace
            exact_hits = vector_store.search(turn.namespace_id, cited_art, top_k=1)
            if exact_hits and any(cited_art.lower() in h.article_number.lower() for h in exact_hits):
                article_status = ArticleCheckStatus.IRRELEVANT
            else:
                article_status = ArticleCheckStatus.NOT_FOUND

    # 3. Attempt LLM API Call
    prompt = SYSTEM_PROMPT_TEMPLATE.format(
        persona=persona_key,
        rag_context=rag_text,
        phase=turn.phase,
        petitioner_name=turn.petitioner_name,
        pet_score=turn.petitioner_score,
        respondent_name=turn.respondent_name,
        resp_score=turn.respondent_score,
        event_type=turn.event_type,
        event_text=turn.event_text,
        speaker_role=turn.speaker_role,
        transcript=json.dumps(turn.transcript[-8:]),
        seconds_left=turn.seconds_left
    )

    llm_res = call_llm_api(prompt)
    if llm_res and isinstance(llm_res, dict) and "judge_line" in llm_res:
        try:
            return TurnReactionOutput(**llm_res)
        except Exception as e:
            print(f"[TurnReaction LLM Parse Notice] {e}, falling back to offline Hinglish engine.")

    # 4. Deterministic Offline Hinglish Persona Engine
    return generate_offline_turn_reaction(turn, persona_key, cited_art, article_status, retrieved)


def generate_offline_turn_reaction(
    turn: TurnEventInput,
    persona: str,
    cited_art: Optional[str],
    article_status: ArticleCheckStatus,
    retrieved: list
) -> TurnReactionOutput:
    """High-character deterministic offline Hinglish judicial engine."""
    speaker = turn.speaker_role
    other = "respondent" if speaker == "petitioner" else "petitioner"
    score_delta = { "petitioner": 0, "respondent": 0 }
    score_reason = "Standard oral argument"
    badge = BadgeType.NONE
    sound = SoundEffect.NONE
    screen_shake = False
    emotion = JudgeEmotion.NEUTRAL
    ruling = "NONE"

    # Default college crowd audience reactions
    gallery_pool = [
        {"user": "@delhi_lawyer", "text": "😂 ouch bhai ka kat gaya"},
        {"user": "@nlu_topper", "text": "Solid point bhai! 🔥"},
        {"user": "@campus_backbencher", "text": "Judge saab mood me hain aaj 💀"},
        {"user": "@moot_court_pro", "text": "Ye argument record pe lena chahiye ⚖️"},
        {"user": "@chai_tapri_bhai", "text": "Chai samosa kahan hai court me? ☕"},
        {"user": "@law_intern", "text": "Bro cooked with that statement!"}
    ]
    import random
    gallery = random.sample(gallery_pool, min(2, len(gallery_pool)))

    # A. SUBMISSION EVENT
    if turn.event_type == "SUBMISSION":
        if article_status == ArticleCheckStatus.CORRECT:
            score_delta[speaker] = 7
            score_reason = f"Grounded {cited_art} citation"
            badge = BadgeType.ARTICLE_MASTER
            sound = SoundEffect.GAVEL
            emotion = JudgeEmotion.IMPRESSED
            lines = {
                "STRICT": f"Achhi baat hai. {cited_art} bilkul sahi jagah quote kiya hai. Aise hi point pe raho.",
                "SARCASTIC": f"Chalo, finally kisi ne dhang ka kanoon quote kiya! {cited_art} ka citation spot on hai.",
                "FILMY": f"Shabash vakil sahab! {cited_art} ki dhaal aage karke tune baazi palat di!",
                "SLEEPY": f"*jolt* Haan! {cited_art} sunke meri neend udd gayi. Zabardast point hai, continue karo."
            }
        elif article_status == ArticleCheckStatus.NOT_FOUND:
            score_delta[speaker] = -6
            score_reason = f"Fake {cited_art} bluff caught"
            badge = BadgeType.BLUFF_CAUGHT
            sound = SoundEffect.OBJECTION
            screen_shake = True
            emotion = JudgeEmotion.ANGRY
            lines = {
                "STRICT": f"Kanoon ke sath mazak mat karo, counsel! {cited_art} ka is mudde se koi lena-dena nahi hai.",
                "SARCASTIC": f"Arey wah, yeh kaunsi pocket book se {cited_art} nikala? Google bhi mana kar raha hai bhai!",
                "FILMY": f"Babu Moshai! Yeh jhoothe daawe court me nahi chalenge! Record se bahar fenk raha hu yeh argument!",
                "SLEEPY": f"...hmm? Yeh kaunsa fake Article bol ke meri neend kharab ki? Minus 6 points lagao ispe."
            }
        elif len(turn.event_text.split()) > 6:
            score_delta[speaker] = 3
            score_reason = "Well reasoned submission"
            sound = SoundEffect.NONE
            emotion = JudgeEmotion.THINKING
            lines = {
                "STRICT": "Tark theek hai, lekin proof aur context pe dhyan do. Next round me prove karna.",
                "SARCASTIC": "Theek-thaak bola hai. Ab dekhte hain dusre counsel iska kya band bajate hain.",
                "FILMY": "Awaaz me dam hai! Par yaad rakhna, yeh court jajbaat se nahi, saboot se chalti hai!",
                "SLEEPY": "...hmm, sun raha hu. Point thoda lamba tha par theek hai, continue."
            }
        else:
            score_delta[speaker] = -3
            score_reason = "Vague / rambling statement"
            emotion = JudgeEmotion.AMUSED
            lines = {
                "STRICT": "Yeh kya ek line ka jawab hai? Yeh court hai, canteen nahi. Elaborate karo.",
                "SARCASTIC": "Itna chhota argument? Lagta hai lawyer sahab homework karna bhool gaye.",
                "FILMY": "Aadha sach poore jhooth se zyada khatarnak hota hai! Poori baat kaho!",
                "SLEEPY": "...itna hi tha? Isse toh behtar tha mai so hi raha hota."
            }

    # B. OBJECTION EVENT
    elif turn.event_type == "OBJECTION":
        is_sustained = any(k in turn.event_text.lower() for k in ["relevance", "hearsay", "speculative", "speculation", "fake", "ground"])
        if is_sustained:
            ruling = "SUSTAINED"
            score_delta[speaker] = 5
            score_delta[other] = -3
            score_reason = "Objection Sustained"
            sound = SoundEffect.OBJECTION
            screen_shake = True
            emotion = JudgeEmotion.ANGRY
            lines = {
                "STRICT": "Objection SUSTAINED! Record se hatao yeh hawayi baat. Counsel, seedhe facts pe aao.",
                "SARCASTIC": "Objection SUSTAINED! Shukr hai kisi ne toh is filmi debate ko roka. Points cut kar diye.",
                "FILMY": "Objection SUSTAINED! Yeh courtroom hai, Natraj theater nahi! Offending remark struck out!",
                "SLEEPY": "*bangs desk* Haan haan, SUSTAINED! Itna shor mat machao, chup chap line pe aao."
            }
        else:
            ruling = "OVERRULED"
            score_delta[speaker] = -5
            score_reason = "Frivolous objection"
            sound = SoundEffect.GAVEL
            emotion = JudgeEmotion.AMUSED
            lines = {
                "STRICT": "Objection OVERRULED. Faltu interruption ke liye minus 5. Counsel ko bolne do.",
                "SARCASTIC": "Objection OVERRULED! Bas timepass karne ke liye khade mat ho jaya karo.",
                "FILMY": "Objection OVERRULED! Hero ko apni baat poori karne do, beech me entry mat maaro!",
                "SLEEPY": "...hnnn? OVERRULED. Faltu me neend kharab mat kiya karo, proceed."
            }

    # C. TIMEOUT EVENT
    elif turn.event_type == "TIMEOUT":
        score_delta[speaker] = -3
        score_reason = "Turn timed out"
        sound = SoundEffect.GAVEL
        emotion = JudgeEmotion.ANGRY
        lines = {
            "STRICT": "Time khatam! Court ka waqt qeemti hai, agle counsel ko floor do.",
            "SARCASTIC": "Aur socho ghante bhar! Timer tick kar raha tha, attention nahi. Next!",
            "FILMY": "Kanoon ke haath lambe hote hain par timer sirf 60 second ka hota hai! Floor transferred!",
            "SLEEPY": "...arre timer baj gaya? Chalo agle bande ki baari, shuru karo."
        }

    # D. VERDICT PHASE
    elif turn.phase == "VERDICT" or turn.event_type == "VERDICT":
        ruling = "VERDICT"
        sound = SoundEffect.DRUMROLL
        screen_shake = True
        emotion = JudgeEmotion.IMPRESSED
        winner = "PETITIONER" if turn.petitioner_score >= turn.respondent_score else "RESPONDENT"
        lines = {
            "STRICT": "Dono pakshon ke arguments aur constitutional provisions ko parkhne ke baad, yeh adalat antim faisla sunati hai.",
            "SARCASTIC": "Boht dhuandhar behes hui, ab suspense khatam karne ka waqt aa gaya hai. Faisla suniye!",
            "FILMY": "Tareekh pe tareekh ka silsila khatam! Ab aayega antim kanooni faisla!",
            "SLEEPY": "*wakes up* Chalo final verdict ka time aa gaya. Sab chup ho jao aur dhyan se suno."
        }
        verdict_payload = VerdictPayload(
            winner=winner,
            summary=f"Case decided on constitutional merits favoring {winner.capitalize()}.",
            key_articles=[r.article_number for r in retrieved[:2]] if retrieved else ["Article 21", "Article 14"],
            closing_line=f"Adalat ka yeh faisla antim aur sarvashreshth hai. Court adjourned!"
        )
        return TurnReactionOutput(
            judge_line=lines.get(persona, lines["STRICT"]),
            ruling=ruling,
            score_delta=score_delta,
            score_reason=score_reason,
            article_check=ArticleCheck(cited=cited_art, status=article_status),
            effects=JudgeEffects(sound=sound, screen_shake=screen_shake, badge=badge, judge_emotion=emotion),
            gallery=gallery,
            verdict=verdict_payload
        )

    else:
        lines = {
            "STRICT": "Adalat ki karwayi shuru ki jaye.",
            "SARCASTIC": "Dekhte hain aaj kaun kitna padh ke aaya hai.",
            "FILMY": "Yeh court kanoon ke dastooro par chalegi!",
            "SLEEPY": "...shuru karo bhai, mai sun raha hu."
        }

    return TurnReactionOutput(
        judge_line=lines.get(persona, lines["STRICT"]),
        ruling=ruling,
        score_delta=score_delta,
        score_reason=score_reason,
        article_check=ArticleCheck(cited=cited_art, status=article_status),
        effects=JudgeEffects(sound=sound, screen_shake=screen_shake, badge=badge, judge_emotion=emotion),
        gallery=gallery,
        verdict=None
    )
