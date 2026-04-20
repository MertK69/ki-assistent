from pydantic import BaseModel
from typing import Any
from datetime import datetime
import uuid


class HistoryEntry(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    language: str
    code_snippet: str
    analysis_result: dict[str, Any]
    provider: str
    created_at: datetime


class HistoryListResponse(BaseModel):
    entries: list[HistoryEntry]
    total: int
