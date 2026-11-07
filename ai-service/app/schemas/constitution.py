"""
Pydantic models for Constitution representation, chunking, and RAG retrieval.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ArticleInput(BaseModel):
    """Represents an article in a constitution."""
    number: str = Field(..., description="E.g., 'Article 19' or 'Section 4'")
    title: str = Field(..., description="Short heading or title of the article")
    part: Optional[str] = Field(default="", description="Part or chapter, e.g. 'Part III - Fundamental Rights'")
    text: str = Field(..., description="Full text or clauses of the article")

class ConstitutionInput(BaseModel):
    """Input payload for ingesting a constitution into its own namespace."""
    id: str = Field(..., description="Unique namespace identifier, e.g. 'indian_constitution' or 'guild_rules_42'")
    name: str = Field(..., description="Human-readable title")
    description: Optional[str] = Field(default="", description="Brief summary")
    articles: List[ArticleInput]

class ArticleChunk(BaseModel):
    """A semantic chunk split by Article or clause, retaining full provenance metadata."""
    chunk_id: str
    constitution_id: str
    article_number: str
    title: str
    part: str
    clause: Optional[str] = None
    text: str
    searchable_text: str

class SearchQuery(BaseModel):
    """Payload to search a constitution namespace."""
    namespace_id: str = Field(..., description="Constitution namespace to search")
    query: str = Field(..., description="Natural language search or legal concept")
    top_k: int = Field(default=3, ge=1, le=10, description="Max number of articles to retrieve")

class RetrievedArticle(BaseModel):
    """Search result returned to the judge reasoning engine."""
    chunk_id: str
    constitution_id: str
    article_number: str
    title: str
    part: str
    clause: Optional[str] = None
    text: str
    score: float
