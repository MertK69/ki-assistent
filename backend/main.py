from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from components.auth.auth_routes import router as auth_router
from components.profile.profile_routes import router as profile_router
from components.analyze.analyze_routes import router as analyze_router
from components.data.data_routes import router as data_router
from components.history.history_routes import router as history_router

app = FastAPI(title="CodeMentor Learn API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(analyze_router)
app.include_router(data_router)
app.include_router(history_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
