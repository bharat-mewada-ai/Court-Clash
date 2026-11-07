"""
Semantic chunker for constitutions:
Splits by Article or numbered/lettered clauses instead of arbitrary fixed-length token windows.
Preserves full metadata (constitution id, article number, title, clause) for grounded citations.
"""
import re
from typing import List
from app.schemas.constitution import ArticleInput, ArticleChunk, ConstitutionInput

def chunk_article(constitution_id: str, article: ArticleInput) -> List[ArticleChunk]:
    """
    Chunks an individual article by clause or as a complete unit if short.
    Ensures every chunk contains the Article title and number so RAG retrieval
    always has complete legal context.
    """
    chunks: List[ArticleChunk] = []
    text = article.text.strip()
    
    # Check if article has numbered sub-clauses like (1), (2), (3)...
    clause_pattern = re.compile(r'(?=\(\d+\))')
    clauses = [c.strip() for c in clause_pattern.split(text) if c.strip()]
    
    # If the text has multiple sub-clauses and is long (> 300 chars), chunk by sub-clause
    if len(clauses) > 1 and len(text) > 300:
        for idx, clause_text in enumerate(clauses):
            # Extract clause label if present e.g. "(1)"
            clause_match = re.match(r'\((\d+)\)', clause_text)
            clause_label = f"Clause ({clause_match.group(1)})" if clause_match else f"Part {idx + 1}"
            
            chunk_id = f"{constitution_id}_{article.number}_{idx+1}".lower().replace(" ", "_")
            searchable = f"{article.number}: {article.title}\n{clause_label}: {clause_text}"
            
            chunks.append(
                ArticleChunk(
                    chunk_id=chunk_id,
                    constitution_id=constitution_id,
                    article_number=article.number,
                    title=article.title,
                    part=article.part or "",
                    clause=clause_label,
                    text=clause_text,
                    searchable_text=searchable
                )
            )
    else:
        # Single consolidated chunk
        chunk_id = f"{constitution_id}_{article.number}".lower().replace(" ", "_")
        searchable = f"{article.number}: {article.title}\n{text}"
        chunks.append(
            ArticleChunk(
                chunk_id=chunk_id,
                constitution_id=constitution_id,
                article_number=article.number,
                title=article.title,
                part=article.part or "",
                clause=None,
                text=text,
                searchable_text=searchable
            )
        )
        
    return chunks

def chunk_constitution(constitution: ConstitutionInput) -> List[ArticleChunk]:
    """
    Processes all articles in a constitution and returns all semantic chunks.
    """
    all_chunks: List[ArticleChunk] = []
    for art in constitution.articles:
        all_chunks.extend(chunk_article(constitution.id, art))
    return all_chunks
