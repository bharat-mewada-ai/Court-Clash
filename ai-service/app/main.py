"""
FastAPI entrypoint for Court Clash AI Judge service.
Provides endpoints for constitution ingestion, namespace-isolated search,
and (in Phase 2) AI Judge questions and verdicts.
"""
import os
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from app.schemas.constitution import ConstitutionInput, SearchQuery, RetrievedArticle
from app.schemas.judge import (
    JudgeCaseInput,
    JudgeVerdict,
    JudgeQuestionInput,
    JudgeQuestionOutput,
    JudgeObjectionInput,
    JudgeObjectionOutput
)
from app.services.judge_engine import judge_case, generate_judge_question, evaluate_objection
from app.rag.vector_store import vector_store

INDIAN_CONST_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "indian_constitution.json")
LANDMARK_CASES_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "landmark_cases.json")

def bootstrap_builtin_constitution():
    """Ensures the built-in Indian Constitution and Landmark Cases are ingested on startup."""
    # 1. Ingest Complete Constitution of India
    if os.path.exists(INDIAN_CONST_PATH):
        try:
            with open(INDIAN_CONST_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
            const_input = ConstitutionInput(**data)
            count = vector_store.ingest_constitution(const_input)
            print(f"[Bootstrap] Indian Constitution loaded and indexed: {count} chunks in namespace '{const_input.id}'.")
        except Exception as e:
            print(f"[Bootstrap Warning] Failed to auto-ingest Indian Constitution: {e}")

    # 2. Ingest Landmark Supreme Court Precedents
    if os.path.exists(LANDMARK_CASES_PATH):
        try:
            with open(LANDMARK_CASES_PATH, "r", encoding="utf-8") as f:
                case_data = json.load(f)
            case_input = ConstitutionInput(**case_data)
            count = vector_store.ingest_constitution(case_input)
            print(f"[Bootstrap] Landmark Cases loaded and indexed: {count} chunks in namespace '{case_input.id}'.")
        except Exception as e:
            print(f"[Bootstrap Warning] Failed to auto-ingest Landmark Cases: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    bootstrap_builtin_constitution()
    yield
    # Shutdown

app = FastAPI(
    title="Court Clash AI Judge Service",
    description="RAG retrieval and AI judicial reasoning engine for Court Clash",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for the React frontend and Node backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Court Clash AI Service",
        "loaded_namespaces": list(vector_store.namespaces.keys())
    }

@app.post("/constitution/ingest", status_code=status.HTTP_201_CREATED)
def ingest_constitution_endpoint(constitution: ConstitutionInput):
    """
    Ingests a constitution into its own isolated namespace.
    Used for both built-in and user-created custom rulebooks.
    """
    try:
        chunk_count = vector_store.ingest_constitution(constitution)
        return {
            "success": True,
            "namespace_id": constitution.id,
            "name": constitution.name,
            "chunks_indexed": chunk_count,
            "message": f"Successfully ingested {chunk_count} clauses into namespace '{constitution.id}'"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to ingest constitution: {str(e)}"
        )

@app.post("/constitution/search", response_model=list[RetrievedArticle])
def search_constitution_endpoint(payload: SearchQuery):
    """
    Retrieves grounded articles/clauses from the specified namespace.
    """
    try:
        results = vector_store.search(
            namespace_id=payload.namespace_id,
            query=payload.query,
            top_k=payload.top_k
        )
        return results
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@app.get("/constitution/{namespace_id}")
def get_namespace_details(namespace_id: str):
    info = vector_store.get_namespace_info(namespace_id)
    if not info:
        raise HTTPException(status_code=404, detail=f"Namespace '{namespace_id}' not found")
    return info

@app.post("/judge/ruling", response_model=JudgeVerdict)
def judge_ruling_endpoint(case: JudgeCaseInput):
    """
    Delivers a grounded, structured judicial verdict compliant with Section 8.
    Ensures citations only reference retrieved articles.
    """
    try:
        verdict = judge_case(case)
        return verdict
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Judicial reasoning error: {str(e)}"
        )

@app.post("/judge/question", response_model=JudgeQuestionOutput)
def judge_question_endpoint(payload: JudgeQuestionInput):
    """
    Generates an in-trial judicial inquiry referencing specific claims or articles.
    """
    try:
        return generate_judge_question(payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error formulating judge question: {str(e)}"
        )

@app.post("/judge/objection", response_model=JudgeObjectionOutput)
def judge_objection_endpoint(payload: JudgeObjectionInput):
    """
    Authoritatively sustains or overrules an in-trial objection with credibility impacts.
    """
    try:
        return evaluate_objection(payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error evaluating objection: {str(e)}"
        )
