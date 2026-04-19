from typing import Literal, List
from pydantic import BaseModel


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
    updated_at: str


class ProfileUpsertRequest(BaseModel):
    known_languages: List[FocusLanguage]
    target_language: FocusLanguage
    skill_level: SkillLevel
    known_concepts: List[str] = []
    goal_tags: List[str] = []
    goals_free_text: str = ""
    onboarding_completed: bool = True
