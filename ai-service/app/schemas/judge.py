"""
Pydantic schemas for AI Judge input, evaluation, and structured verdict contract (Section 8).
"""
from typing import List, Optional
from enum import Enum
from pydantic import BaseModel, Field

class JudgePersona(str, Enum):
    STRICT = "Strict"
    CHILL = "Chill"
    TEXTUALIST = "Textualist"

class ApplicableArticle(BaseModel):
    """
    Grounded legal citation.
    CRITICAL RULE: The article and quote MUST only be taken from retrieved constitution chunks.
    """
    article: str = Field(..., description="E.g., 'Article 19(1)(a)' or 'Rule 1'")
    quote: str = Field(..., description="Exact or closely paraphrased quote from the retrieved text")
    why_it_applies: str = Field(..., description="Explanation of how this provision governs the dispute")

class JudgeVerdict(BaseModel):
    """
    Standard Judge Contract specified in Section 8.
    All judicial rulings must validate against this exact schema.
    """
    case_title: str
    judge_persona: str
    facts_summary: str = Field(..., description="Brief factual summary of the dispute")
    issues: List[str] = Field(..., description="The key questions of law the court must decide")
    petitioner_arguments: List[str] = Field(..., description="Summary of petitioner's core contentions")
    respondent_arguments: List[str] = Field(..., description="Summary of respondent's core contentions")
    applicable_articles: List[ApplicableArticle] = Field(..., description="Articles retrieved from chosen constitution")
    reasoning: str = Field(..., description="Judicial analysis balancing facts, arguments, and articles")
    verdict: str = Field(..., description="Clear ruling, e.g., 'In favor of the Petitioner' or 'Dismissed'")
    relief: str = Field(..., description="Remedies granted or denied")
    credibility_scores: Optional[dict] = Field(
        default_factory=lambda: {"petitioner": 80, "respondent": 75},
        description="Credibility ratings based on argument grounding"
    )
    disclaimer: str = Field(
        default="This is an educational simulation, not legal advice.",
        description="Mandatory disclaimer for all verdicts"
    )

class JudgeCaseInput(BaseModel):
    """Input payload for a single-turn judicial ruling."""
    namespace_id: str = Field(default="indian_constitution", description="Constitution namespace to search")
    persona: JudgePersona = Field(default=JudgePersona.STRICT, description="Tone & strictness of the judge")
    case_title: str = Field(..., description="Title of the legal clash")
    facts: str = Field(..., description="Factual background of the dispute")
    relief_sought: str = Field(..., description="Specific relief requested by the petitioner")
    petitioner_arguments: List[str] = Field(..., description="Arguments submitted by petitioner")
    respondent_arguments: List[str] = Field(..., description="Arguments submitted by respondent")
    evidence: Optional[List[str]] = Field(default=[], description="List of submitted evidence exhibits")

class JudgeQuestionInput(BaseModel):
    """Input payload to ask an in-trial judicial question."""
    namespace_id: str = Field(default="indian_constitution")
    persona: JudgePersona = Field(default=JudgePersona.STRICT)
    case_title: str
    facts: str
    current_argument: str
    speaker_side: str = Field(..., description="'petitioner' or 'respondent'")
    turn_phase: str = Field(default="ROUND_1_OPENING")

class JudgeQuestionOutput(BaseModel):
    """Structured question from the AI judge during oral arguments."""
    target_side: str
    question: str = Field(..., description="Short, direct judicial inquiry")
    referenced_article: Optional[str] = None
    urgency: str = Field(default="Standard", description="Urgency: 'Standard' or 'Pressing'")

class JudgeObjectionInput(BaseModel):
    """Input payload when a party raises an objection during argument."""
    namespace_id: str = Field(default="indian_constitution")
    persona: JudgePersona = Field(default=JudgePersona.STRICT)
    objecting_side: str = Field(..., description="'petitioner' or 'respondent'")
    target_argument: str = Field(..., description="The argument being objected to")
    reason: str = Field(..., description="Grounds, e.g. 'Relevance', 'Speculation', 'Hearsay'")

class JudgeObjectionOutput(BaseModel):
    """Authoritative judicial ruling on an in-trial objection."""
    ruling: str = Field(..., description="'SUSTAINED' or 'OVERRULED'")
    explanation: str = Field(..., description="Legal rationale matching persona style")
    credibility_impact: dict = Field(..., description="Score adjustments e.g. {'petitioner': -5, 'respondent': +5}")
    struck_from_record: bool = Field(default=False)

