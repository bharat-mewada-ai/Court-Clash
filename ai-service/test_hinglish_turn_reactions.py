"""
Test dynamic Hinglish judge personas, gallery reactions, and sound effects.
"""
import os
import sys

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

sys.path.insert(0, os.path.dirname(__file__))

from app.schemas.judge import TurnEventInput
from app.services.judge_engine import generate_turn_reaction

def test_turn_reactions():
    print("=" * 65)
    print("TESTING DYNAMIC HINGLISH JUDGE PERSONAS & GALLERY REACTIONS")
    print("=" * 65)

    personas = ["STRICT", "SARCASTIC", "FILMY", "SLEEPY"]

    # 1. Test Article 19 submission across all 4 personas
    for p in personas:
        event = TurnEventInput(
            persona=p,
            phase="ORAL_ARGUMENTS",
            event_type="SUBMISSION",
            event_text="We submit that Article 19 protects student journalism on campus from censorship.",
            speaker_role="petitioner",
            petitioner_name="Aarav",
            respondent_name="Dean",
            petitioner_score=85,
            respondent_score=85,
            seconds_left=45
        )
        res = generate_turn_reaction(event)
        print(f"\n[{p} JUDGE ON ARTICLE 19]")
        print(f"  Judge Line: \"{res.judge_line}\"")
        print(f"  Score Delta: {res.score_delta} ({res.score_reason})")
        print(f"  Sound Effect: {res.effects.sound.value} | Emotion: {res.effects.judge_emotion.value}")
        print(f"  Gallery Crowd: {[g.text for g in res.gallery]}")
        assert res.article_check.status.value == "CORRECT", "Expected Article 19 to be detected as CORRECT"

    # 2. Test Bluff Caught (Fake Article)
    fake_event = TurnEventInput(
        persona="SARCASTIC",
        event_type="SUBMISSION",
        event_text="Under Article 999 of the Constitution, I have the absolute right to skip all exams.",
        speaker_role="petitioner"
    )
    bluff_res = generate_turn_reaction(fake_event)
    print(f"\n[BLUFF CAUGHT TEST]")
    print(f"  Judge Line: \"{bluff_res.judge_line}\"")
    print(f"  Badge: {bluff_res.effects.badge.value} | Penalty: {bluff_res.score_delta}")
    assert bluff_res.effects.badge.value == "BLUFF_CAUGHT", "Expected BLUFF_CAUGHT badge"

    # 3. Test Objection Sustained
    obj_event = TurnEventInput(
        persona="FILMY",
        event_type="OBJECTION",
        event_text="Objection! Speculative hearsay with zero relevance to the petition.",
        speaker_role="respondent"
    )
    obj_res = generate_turn_reaction(obj_event)
    print(f"\n[FILMY OBJECTION TEST]")
    print(f"  Ruling: {obj_res.ruling} -> \"{obj_res.judge_line}\"")
    print(f"  Screen Shake: {obj_res.effects.screen_shake} | Sound: {obj_res.effects.sound.value}")
    assert obj_res.ruling == "SUSTAINED"

    print("\n" + "=" * 65)
    print("ALL DYNAMIC HINGLISH PERSONA TESTS PASSED SUCCESSFULLY!")
    print("=" * 65)

if __name__ == "__main__":
    test_turn_reactions()
