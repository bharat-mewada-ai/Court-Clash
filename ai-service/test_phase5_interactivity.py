"""
Phase 5 AI Service Tests:
Verifies in-trial Judge Questions and Objection Rulings.
"""
import sys
import os

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

sys.path.insert(0, os.path.dirname(__file__))

from fastapi.testclient import TestClient
from app.main import app, bootstrap_builtin_constitution
from app.schemas.judge import (
    JudgePersona,
    JudgeQuestionInput,
    JudgeQuestionOutput,
    JudgeObjectionInput,
    JudgeObjectionOutput
)

client = TestClient(app)

def run_phase5_tests():
    print("=" * 65)
    print("COURT CLASH - PHASE 5: OBJECTIONS & JUDGE QUESTIONS TESTS")
    print("=" * 65)

    bootstrap_builtin_constitution()

    # --- Test 1: In-trial Judge Question Generation ---
    print("\n[Test 1] Testing In-trial Judge Question Generation:")
    q_input = JudgeQuestionInput(
        namespace_id="indian_constitution",
        persona=JudgePersona.STRICT,
        case_title="Free Speech Controversy",
        facts="University ban on student publications",
        current_argument="We argue freedom of speech has zero permissible boundaries on a university campus.",
        speaker_side="petitioner",
        turn_phase="ROUND_2_REBUTTAL"
    )

    res = client.post("/judge/question", json=q_input.model_dump())
    assert res.status_code == 200, f"Judge question failed: {res.text}"
    q_data = JudgeQuestionOutput(**res.json())

    print(f"  Target: {q_data.target_side.upper()}")
    print(f"  Question: \"{q_data.question}\"")
    print(f"  Referenced: {q_data.referenced_article}")
    assert "Article 19" in str(q_data.referenced_article) or "Article" in str(q_data.question)
    print("  [PASS] Judge question successfully referenced grounded article.")

    # Test Personas on Questions
    for persona in [JudgePersona.CHILL, JudgePersona.TEXTUALIST]:
        q_copy = q_input.model_copy(update={"persona": persona})
        r = client.post("/judge/question", json=q_copy.model_dump())
        out = JudgeQuestionOutput(**r.json())
        print(f"  [{persona.value} Question]: \"{out.question}\"")

    # --- Test 2: Valid Objection -> SUSTAINED ---
    print("\n[Test 2] Testing Valid Objection (Grounds: Speculation & Relevance):")
    valid_obj = JudgeObjectionInput(
        namespace_id="indian_constitution",
        persona=JudgePersona.STRICT,
        objecting_side="respondent",
        target_argument="The dean was obviously bribed by private hostel vendors without any evidence.",
        reason="Speculative and prejudicial hearsay outside the recorded facts."
    )

    res = client.post("/judge/objection", json=valid_obj.model_dump())
    assert res.status_code == 200, f"Objection evaluation failed: {res.text}"
    obj_out = JudgeObjectionOutput(**res.json())

    print(f"  Ruling: {obj_out.ruling}")
    print(f"  Explanation: {obj_out.explanation}")
    print(f"  Credibility Impact: {obj_out.credibility_impact}")
    print(f"  Struck from record: {obj_out.struck_from_record}")

    assert obj_out.ruling == "SUSTAINED"
    assert obj_out.struck_from_record is True
    assert obj_out.credibility_impact["respondent"] > 0
    assert obj_out.credibility_impact["petitioner"] < 0
    print("  [PASS] Valid objection properly sustained with credibility penalties.")

    # --- Test 3: Frivolous Objection -> OVERRULED ---
    print("\n[Test 3] Testing Frivolous Objection (Grounds: Personal dislike):")
    frivolous_obj = JudgeObjectionInput(
        namespace_id="indian_constitution",
        persona=JudgePersona.STRICT,
        objecting_side="petitioner",
        target_argument="Under Article 19(2), reasonable restrictions protect campus order.",
        reason="I don't like the tone of the respondent's counsel."
    )

    res = client.post("/judge/objection", json=frivolous_obj.model_dump())
    assert res.status_code == 200
    friv_out = JudgeObjectionOutput(**res.json())

    print(f"  Ruling: {friv_out.ruling}")
    print(f"  Explanation: {friv_out.explanation}")
    print(f"  Credibility Impact: {friv_out.credibility_impact}")

    assert friv_out.ruling == "OVERRULED"
    assert friv_out.struck_from_record is False
    assert friv_out.credibility_impact["petitioner"] < 0  # Penalty for time wasting
    print("  [PASS] Frivolous objection properly overruled with penalty to interrupting party.")

    print("\n" + "=" * 65)
    print("ALL PHASE 5 AI SERVICE INTERACTIVITY TESTS PASSED!")
    print("=" * 65)

if __name__ == "__main__":
    run_phase5_tests()
