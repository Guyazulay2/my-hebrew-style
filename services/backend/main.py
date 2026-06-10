from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from routers import auth, user, styling, visual_search
from models.database import engine, Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    os.makedirs("/app/uploads", exist_ok=True)
    yield
    # Shutdown
    await engine.dispose()

app = FastAPI(
    title="My Stylist API",
    description="AI-powered personal styling assistant",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="/app/uploads"), name="uploads")

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(user.router, prefix="/api/user", tags=["User"])
app.include_router(styling.router, prefix="/api/styling", tags=["Styling"])
app.include_router(visual_search.router, prefix="/api/search", tags=["Visual Search"])

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "My Stylist Backend"}
