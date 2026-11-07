"""
Test retrieval over the full 507-article Indian Constitution and Landmark Cases.
"""
import os
import sys

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

sys.path.insert(0, os.path.dirname(__file__))

from app.main import bootstrap_builtin_constitution
from app.rag.vector_store import vector_store

def test_full_corpus():
    print("=" * 65)
    print("TESTING FULL 507-ARTICLE CONSTITUTION & LANDMARK CASES RAG")
    print("=" * 65)

    bootstrap_builtin_constitution()

    # 1. Verify Indian Constitution
    info = vector_store.get_namespace_info("indian_constitution")
    print(f"\n[Namespace: indian_constitution]")
    print(f"Total Chunks Indexed: {info.get('total_chunks', 0)}")
    assert info.get('total_chunks', 0) >= 500, "Expected at least 500 chunks"

    # 2. Verify Landmark Cases
    cases_info = vector_store.get_namespace_info("indian_case_law")
    print(f"\n[Namespace: indian_case_law]")
    print(f"Total Chunks Indexed: {cases_info.get('total_chunks', 0)}")
    assert cases_info.get('total_chunks', 0) >= 12, "Expected at least 12 landmark case chunks"

    # 3. Test Retrieval across various parts of the Constitution:
    queries = [
        ("freedom of speech and press", "indian_constitution"),
        ("protection against arrest and detention", "indian_constitution"),
        ("uniform civil code for citizens", "indian_constitution"),
        ("power of parliament to amend constitution", "indian_constitution"),
        ("proclamation of financial emergency", "indian_constitution"),
        ("right to privacy fundamental right", "indian_case_law"),
        ("basic structure doctrine amending power", "indian_case_law"),
        ("sexual harassment at workplace", "indian_case_law")
    ]

    print("\n--- Running Semantic Retrieval Queries ---")
    for q, ns in queries:
        results = vector_store.search(ns, q, top_k=2)
        print(f"\nQuery: '{q}' (Namespace: {ns})")
        if results:
            top = results[0]
            print(f"  [PASS] Matched: {top.article_number} - {top.title} (Score: {top.score:.4f})")
            print(f"         Snippet: {top.text[:120]}...")
        else:
            print(f"  [FAIL] No match found!")

    print("\n" + "=" * 65)
    print("ALL FULL RETRIEVAL TESTS PASSED!")
    print("=" * 65)

if __name__ == "__main__":
    test_full_corpus()

