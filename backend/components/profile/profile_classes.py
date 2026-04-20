from typing import Literal, List, Optional
from pydantic import BaseModel, validator


FocusLanguage = Literal["java", "python", "javascript", "assembly"]
SkillLevel = Literal["beginner", "basic", "intermediate", "advanced"]


class QualificationProfile(BaseModel):
    user_id: str
    known_languages: List[FocusLanguage]
    target_language: FocusLanguage
    skill_level: SkillLevel
    known_concepts: List[str]
    goal_tags: List[str]
    goals_free_text: str
    onboarding_completed: bool
    llm_provider: str = "openai"
    updated_at: str


class ProfileUpsertRequest(BaseModel):
    known_languages: List[FocusLanguage]
    target_language: FocusLanguage
    skill_level: SkillLevel
    known_concepts: List[str] = []
    goal_tags: List[str] = []
    goals_free_text: str = ""
    onboarding_completed: bool = True
    llm_provider: Optional[str] = None

    @validator('llm_provider')
    def validate_provider(cls, v):
        if v is None:
            return v
        if v not in ('openai', 'ollama'):
            raise ValueError('llm_provider must be openai or ollama')
        return v
