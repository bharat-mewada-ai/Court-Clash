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
    JudgeObjectionOutput
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
