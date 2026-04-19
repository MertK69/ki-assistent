from fastapi import APIRouter
from components.data.data_repository import STARTER_SNIPPETS, CONCEPT_LIBRARY, LEARNING_TASKS

router = APIRouter(prefix="/api/data", tags=["data"])


@router.get("/snippets")
async def get_snippets():
    return STARTER_SNIPPETS


@router.get("/concepts")
async def get_concepts():
    return CONCEPT_LIBRARY


@router.get("/tasks")
async def get_tasks():
    return LEARNING_TASKS
