from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from collections import defaultdict
import time
import os

from routers import auth, user, styling, visual_search
from models.database import engine, Base

# ── CORS ──────────────────────────────────────────────────────────────
# "allow_origins=['*']" combined with allow_credentials=True is invalid
# by the CORS spec and rejected by browsers. Use an explicit origin list.
ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "http://localhost,http://localhost:3000,http://localhost:5173").split(",")
    if o.strip()
]

# ── Simple in-process rate limiter for auth endpoints ─────────────────
# Limits each IP to MAX_ATTEMPTS login/register calls per WINDOW seconds.
_rate_store: dict[str, list[float]] = defaultdict(list)
RATE_WINDOW = 60      # seconds
MAX_ATTEMPTS = 10     # per window per IP

def _check_rate_limit(ip: str) -> bool:
    now = time.time()
    hits = [t for t in _rate_store[ip] if now - t < RATE_WINDOW]
    _rate_store[ip] = hits
    if len(hits) >= MAX_ATTEMPTS:
        return False
    _rate_store[ip].append(now)
    return True


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    os.makedirs("/app/uploads", exist_ok=True)
    yield
    await engine.dispose()


app = FastAPI(
    title="My Stylist API",
    description="AI-powered personal styling assistant",
    version="1.0.0",
    lifespan=lifespan,
    # Disable auto-generated docs in production
    docs_url="/api/docs" if os.getenv("ENVIRONMENT") != "production" else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# ── Rate-limit middleware for auth routes ──────────────────────────────
@app.middleware("http")
async def rate_limit_auth(request: Request, call_next):
    if request.url.path.startswith("/api/auth/"):
        ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown").split(",")[0].strip()
        if not _check_rate_limit(ip):
            return JSONResponse(status_code=429, content={"detail": "יותר מדי ניסיונות — נסה שוב בעוד דקה"})
    return await call_next(request)

# ── Security headers middleware ────────────────────────────────────────
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

app.mount("/uploads", StaticFiles(directory="/app/uploads"), name="uploads")

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(user.router, prefix="/api/user", tags=["User"])
app.include_router(styling.router, prefix="/api/styling", tags=["Styling"])
app.include_router(visual_search.router, prefix="/api/search", tags=["Visual Search"])


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "My Stylist Backend"}
