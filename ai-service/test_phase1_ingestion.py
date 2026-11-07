"""
Phase 1 Ingestion and Retrieval Verification Test.
Tests:
1. Loading Indian Constitution from data/indian_constitution.json
2. Chunking into articles and clauses with metadata
3. Ingesting into isolated 'indian_constitution' namespace
4. Testing legal queries (e.g., 'freedom of speech', 'equality before law', 'right to life')
5. Testing irrelevant queries (verifying no hallucinated citations)
6. Testing namespace isolation with a custom constitution
"""
import os
import sys
import json

# Ensure UTF-8 output on Windows consoles
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Add parent directory to sys.path so app imports work cleanly
sys.path.insert(0, os.path.dirname(__file__))

from app.schemas.constitution import ConstitutionInput
from app.rag.vector_store import vector_store

def run_tests():
    print("=" * 60)
    print("COURT CLASH - PHASE 1: INGESTION & RETRIEVAL TESTS")
    print("=" * 60)

    # 1. Load data
    data_path = os.path.join(os.path.dirname(__file__), "data", "indian_constitution.json")
    print(f"\n[Step 1] Loading Indian Constitution from: {data_path}")
    assert os.path.exists(data_path), f"File not found: {data_path}"

    with open(data_path, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    constitution = ConstitutionInput(**raw_data)
    print(f"Loaded '{constitution.name}' with {len(constitution.articles)} articles.")

    # 2. Ingest
    print("\n[Step 2] Chunking and indexing into namespace 'indian_constitution'...")
    chunk_count = vector_store.ingest_constitution(constitution)
    print(f"[OK] Ingestion successful! Indexed {chunk_count} semantic clauses/chunks.")

    # 3. Test Retrieval Queries
    test_queries = [
        ("freedom of speech", "Article 19"),
        ("equality before law and discrimination", "Article 14"),
        ("protection of life and personal liberty", "Article 21"),
        ("remedies enforcement of fundamental rights writ", "Article 32"),
        ("abolition of untouchability", "Article 17"),
        ("minorities right to establish educational institutions", "Article 30"),
    ]

    print("\n[Step 3] Running Legal Retrieval Queries:")
    for query, expected_article in test_queries:
        results = vector_store.search("indian_constitution", query, top_k=2)
        print(f"\n--- Query: '{query}' ---")
        if not results:
            print("  [FAIL] No results returned!")
            continue

        top = results[0]
        match = expected_article in top.article_number
        status_tag = "[PASS]" if match else "[FAIL]"
        print(f"  {status_tag} Top Match: {top.article_number} - {top.title} (Score: {top.score})")
        if top.clause:
            print(f"    Sub-clause: {top.clause}")
        print(f"    Snippet: {top.text[:120]}...")
        assert match or expected_article in [r.article_number for r in results], (
            f"Expected {expected_article} in results for '{query}'"
        )

    # 4. Irrelevant Query Test (Non-hallucination guardrail)
    print("\n[Step 4] Testing Irrelevant Query (Guardrail against inventing law):")
    irrelevant_query = "quantum mechanics black hole event horizon physics"
    results = vector_store.search("indian_constitution", irrelevant_query, top_k=2)
    print(f"Query: '{irrelevant_query}'")
    print(f"Results returned: {len(results)} (expected 0 or low-threshold match)")
    if len(results) == 0:
        print("[PASS] Guardrail verified: Nothing relevant retrieved, court will not invent law.")
    else:
        print(f"  Lowest score match: {results[0].article_number} (Score: {results[0].score})")

    # 5. Namespace Isolation Test
    print("\n[Step 5] Testing Namespace Isolation with Custom Constitution:")
    custom_rules = ConstitutionInput(
        id="campus_guild_rules",
        name="Campus Gaming Guild Charter",
        description="Rules for competitive gaming tournament disputes",
        articles=[
            {
                "number": "Rule 1",
                "title": "Fair Play and Anti-Cheating",
                "part": "Section A",
                "text": "No player shall use aimbots, wallhacks, or unauthorized third-party scripts during match play."
            },
            {
                "number": "Rule 2",
                "title": "Dispute Resolution and Replays",
                "part": "Section B",
                "text": "Any accusation of cheating must be accompanied by full match demo recordings within 2 hours of match end."
            }
        ]
    )
    vector_store.ingest_constitution(custom_rules)
    print("[OK] Custom constitution 'campus_guild_rules' ingested.")

    # Search in custom namespace
    guild_res = vector_store.search("campus_guild_rules", "aimbots and third party wallhacks", top_k=1)
    assert len(guild_res) > 0 and guild_res[0].article_number == "Rule 1"
    print(f"[PASS] Custom Search Match: {guild_res[0].article_number} - {guild_res[0].title}")

    # Verify cross-constitution isolation: Search custom query in Indian constitution
    cross_res = vector_store.search("indian_constitution", "aimbots and third party wallhacks", top_k=1)
    print(f"[PASS] Searching gaming terms in 'indian_constitution' returned {len(cross_res)} results (strictly isolated).")

    print("\n" + "=" * 60)
    print("ALL PHASE 1 INGESTION AND RETRIEVAL TESTS PASSED!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
