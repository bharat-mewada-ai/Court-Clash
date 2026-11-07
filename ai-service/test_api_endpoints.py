"""
FastAPI Endpoint Verification for Phase 1.
Tests FastAPI routes using Starlette/FastAPI TestClient.
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
from app.main import app

client = TestClient(app)

def test_endpoints():
    print("Testing GET /health...")
    res = client.get("/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[PASS] /health response:", res.json())

    print("\nTesting POST /constitution/search for 'freedom of speech'...")
    res = client.post(
        "/constitution/search",
        json={"namespace_id": "indian_constitution", "query": "freedom of speech", "top_k": 2}
    )
    assert res.status_code == 200, f"Search failed: {res.text}"
    articles = res.json()
    assert len(articles) > 0, "No articles found"
    print(f"[PASS] Found {len(articles)} articles. Top: {articles[0]['article_number']} - {articles[0]['title']}")

    print("\n[ALL PASSED] All API route tests passed successfully!")

if __name__ == "__main__":
    test_endpoints()
