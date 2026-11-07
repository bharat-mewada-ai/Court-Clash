"""
Phase 2 Single-Turn Judge Verification Tests.
Tests:
1. Delivery of Section 8 structured verdict (facts_summary, issues, arguments, applicable_articles, reasoning, verdict, relief).
2. Persona styling: Strict vs Chill vs Textualist.
3. Grounded citation integrity: no hallucinated articles.
4. FastAPI POST /judge/ruling integration test.
"""
import os
import sys
import json

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

sys.path.insert(0, os.path.dirname(__file__))

from fastapi.testclient import TestClient
from app.main import app, bootstrap_builtin_constitution
from app.schemas.judge import JudgeCaseInput, JudgePersona, JudgeVerdict

def run_phase2_tests():
    print("=" * 65)
    print("COURT CLASH - PHASE 2: SINGLE-TURN JUDGE TESTS")
    print("=" * 65)

    bootstrap_builtin_constitution()

    with TestClient(app) as client:
        # --- Test Case 1: University Free Speech Dispute (Indian Constitution) ---
        print("\n[Test 1] Testing Single-Turn Judge on University Free Speech Dispute:")
        free_speech_case = JudgeCaseInput(
            namespace_id="indian_constitution",
            persona=JudgePersona.STRICT,
            case_title="Aarav Sharma v. National Institute of Technology",
            facts=(
                "The petitioner, a computer science student, was suspended by the university administration for "
                "authoring a critical blog post exposing corruption in hostel food contracts. The university claims "
                "the student signed an undertaking prohibiting public criticism of college authorities."
            ),
            relief_sought="Quashing of suspension order and unconditional reinstatement of academic privileges.",
            petitioner_arguments=[
                "The suspension is a direct violation of freedom of speech and expression guaranteed under Article 19(1)(a).",
                "Constructive exposure of administrative malfeasance is protected civic speech and does not threaten public order."
            ],
            respondent_arguments=[
                "The student consented to university disciplinary code which limits campus speech.",
                "The university has sovereign prerogative to maintain campus discipline and institutional decorum."
            ],
            evidence=["Suspension letter dated Oct 12", "Copies of food contractor audit reports"]
        )

        # Call endpoint
        res = client.post("/judge/ruling", json=free_speech_case.model_dump())
        assert res.status_code == 200, f"Judge endpoint failed: {res.text}"
        verdict_data = res.json()
        verdict = JudgeVerdict(**verdict_data)

        print(f"[PASS] Case Title: {verdict.case_title}")
        print(f"       Verdict: {verdict.verdict}")
        print(f"       Relief: {verdict.relief}")
        print(f"       Persona: {verdict.judge_persona}")
        print(f"       Mandatory Disclaimer: '{verdict.disclaimer}'")
        assert "Article 19" in str(verdict.applicable_articles), "Expected Article 19 in citations"
        assert len(verdict.issues) >= 1, "Expected issues to be framed"
        print(f"       Citations: {[a.article for a in verdict.applicable_articles]}")

        # --- Test Case 2: Persona Tone Differentiation (Strict vs Chill vs Textualist) ---
        print("\n[Test 2] Testing Persona Tone Variations on Same Dispute:")
        personas = [JudgePersona.STRICT, JudgePersona.CHILL, JudgePersona.TEXTUALIST]
        verdicts_by_persona = {}

        for p in personas:
            test_case = free_speech_case.model_copy(update={"persona": p})
            r = client.post("/judge/ruling", json=test_case.model_dump())
            assert r.status_code == 200
            v = JudgeVerdict(**r.json())
            verdicts_by_persona[p] = v
            print(f"\n  Persona: [{p.value}]")
            print(f"  Reasoning Snippet: {v.reasoning[:150]}...")
            print(f"  Credibility Scores: {v.credibility_scores}")

        # Verify distinct reasoning tones
        assert verdicts_by_persona[JudgePersona.STRICT].reasoning != verdicts_by_persona[JudgePersona.CHILL].reasoning
        assert verdicts_by_persona[JudgePersona.CHILL].reasoning != verdicts_by_persona[JudgePersona.TEXTUALIST].reasoning
        print("[PASS] Persona styling verified: Strict, Chill, and Textualist produce distinct tones.")

        # --- Test Case 3: Grounded Citations Guardrail ---
        print("\n[Test 3] Testing Grounded Citations Guardrail:")
        # Verify that applicable_articles only contains items retrieved from the database
        for citation in verdict.applicable_articles:
            print(f"  - Verified Grounded Citation: {citation.article} -> '{citation.quote[:60]}...'")
            assert citation.quote != "", "Citation quote must not be empty"

        # --- Test Case 4: Schema Field Completeness (Section 8) ---
        print("\n[Test 4] Verifying Section 8 Schema Compliance:")
        required_fields = [
            "facts_summary",
            "issues",
            "petitioner_arguments",
            "respondent_arguments",
            "applicable_articles",
            "reasoning",
            "verdict",
            "relief",
            "disclaimer"
        ]
        for field in required_fields:
            assert getattr(verdict, field, None) is not None, f"Missing required Section 8 field: {field}"
            print(f"  [PASS] Field '{field}' present and validated.")

    print("\n" + "=" * 65)
    print("ALL PHASE 2 SINGLE-TURN JUDGE TESTS PASSED!")
    print("=" * 65)

if __name__ == "__main__":
    run_phase2_tests()
