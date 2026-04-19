from typing import Literal, List, Optional
from pydantic import BaseModel, ConfigDict, Field


SupportedLanguage = Literal["java", "python", "javascript", "assembly"]
ConfidenceLevel = Literal["low", "medium", "high"]


class Hint(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    level: Literal[1, 2, 3]
    title: str
    content: str


class AnalysisResult(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    detectedIssue: str = Field(alias="detectedIssue")
    explanationSimple: str = Field(alias="explanationSimple")
    likelyConcepts: List[str] = Field(alias="likelyConcepts")
    reflectionQuestions: List[str] = Field(alias="reflectionQuestions")
    hints: List[Hint]
    confidenceLevel: ConfidenceLevel = Field(alias="confidenceLevel")
    hallucinationWarning: bool = Field(alias="hallucinationWarning")
    relevanceNote: str = Field(alias="relevanceNote")
    conceptFocus: str = Field(alias="conceptFocus")


class AnalyzeRequest(BaseModel):
    code: str = Field(min_length=3)
    language: SupportedLanguage
    error_message: Optional[str] = None
    avoid_direct_solution: bool = True
