import { AI_SERVICE_URL } from "../config/constants.js";

/**
 * Communication bridge between Node.js Socket server and Python FastAPI AI Judge service.
 */
export async function requestJudgeRuling(casePayload) {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/judge/ruling`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(casePayload)
    });

    if (!response.ok) {
      throw new Error(`AI service responded with HTTP ${response.status}`);
    }

    const verdict = await response.json();
    return verdict;
  } catch (err) {
    console.warn(`[AI Judge Bridge] Warning: AI service call failed (${err.message}). Using local grounded verdict fallback.`);
    
    // Deterministic fallback matching Section 8
    return {
      case_title: casePayload.case_title,
      judge_persona: casePayload.persona || "Strict",
      facts_summary: casePayload.facts.slice(0, 160) + "...",
      issues: [
        "Whether the contested measures violate constitutional standards of fairness.",
        "Whether the petitioner is entitled to the specific relief sought."
      ],
      petitioner_arguments: casePayload.petitioner_arguments || [],
      respondent_arguments: casePayload.respondent_arguments || [],
      applicable_articles: [
        {
          article: "Article 19",
          quote: "All citizens shall have the right to freedom of speech and expression...",
          why_it_applies: "Constitutional protection of expressive liberties subject only to reasonable restrictions."
        }
      ],
      reasoning: "The Court has weighed the arguments submitted across all three rounds. The petitioner substantiated their claim with grounded constitutional backing, whereas the respondent failed to justify the necessity of the abridgement.",
      verdict: "In favor of the Petitioner",
      relief: casePayload.relief_sought || "Relief granted as prayed.",
      credibility_scores: { petitioner: 86, respondent: 72 },
      disclaimer: "This is an educational simulation, not legal advice."
    };
  }
}

export async function searchArticles(namespaceId, query) {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/constitution/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ namespace_id: namespaceId, query, top_k: 2 })
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn(`[AI Judge Bridge] Search error: ${err.message}`);
  }
  return [];
}

export async function requestJudgeQuestion(questionPayload) {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/judge/question`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(questionPayload)
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn(`[AI Judge Bridge] Question error: ${err.message}`);
  }

  // Fallback
  return {
    target_side: questionPayload.speaker_side,
    question: `Counsel for ${questionPayload.speaker_side.toUpperCase()}: Reconcile your submission with constitutional standards. How do you defend against arbitrary infringement?`,
    referenced_article: "Constitutional principles",
    urgency: "Standard"
  };
}

export async function requestJudgeObjection(objectionPayload) {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/judge/objection`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(objectionPayload)
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn(`[AI Judge Bridge] Objection evaluation error: ${err.message}`);
  }

  // Fallback
  const isValid = objectionPayload.reason.toLowerCase().includes("relevance") || objectionPayload.reason.toLowerCase().includes("speculat");
  return {
    ruling: isValid ? "SUSTAINED" : "OVERRULED",
    explanation: isValid
      ? `Objection sustained. Argument violates evidentiary scope (${objectionPayload.reason}).`
      : `Objection overruled. Counsel will allow opponent to complete their argument.`,
    credibility_impact: isValid
      ? { [objectionPayload.objecting_side]: 5, [objectionPayload.objecting_side === "petitioner" ? "respondent" : "petitioner"]: -5 }
      : { [objectionPayload.objecting_side]: -5, [objectionPayload.objecting_side === "petitioner" ? "respondent" : "petitioner"]: 2 },
    struck_from_record: isValid
  };
}

