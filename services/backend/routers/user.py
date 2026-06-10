from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt, JWTError
from pydantic import BaseModel
import os
import aiofiles
import uuid
import httpx

from models.database import get_db, User

router = APIRouter()
security = HTTPBearer()
JWT_SECRET = os.getenv("JWT_SECRET", "dev_secret")
JWT_ALGORITHM = "HS256"

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

class OnboardingRequest(BaseModel):
    username: str | None = None
    age: int | None = None
    height_cm: int | None = None
    weight_kg: int | None = None
    style_tags: list[str] = []
    brand_preferences: list[str] = []

class ProfileResponse(BaseModel):
    id: str
    email: str
    username: str | None
    full_name: str | None
    avatar_url: str | None
    age: int | None
    height_cm: int | None
    weight_kg: int | None
    body_type: str | None
    style_tags: list
    brand_preferences: list
    is_onboarded: bool

@router.get("/profile", response_model=ProfileResponse)
async def get_profile(user: User = Depends(get_current_user)):
    return ProfileResponse(
        id=str(user.id),
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
        age=user.age,
        height_cm=user.height_cm,
        weight_kg=user.weight_kg,
        body_type=user.body_type,
        style_tags=user.style_tags or [],
        brand_preferences=user.brand_preferences or [],
        is_onboarded=user.is_onboarded
    )

@router.put("/onboarding")
async def update_onboarding(
    data: OnboardingRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if data.username:
        user.username = data.username
    if data.age:
        user.age = data.age
    if data.height_cm:
        user.height_cm = data.height_cm
    if data.weight_kg:
        user.weight_kg = data.weight_kg
    if data.style_tags:
        user.style_tags = data.style_tags
    if data.brand_preferences:
        user.brand_preferences = data.brand_preferences
    user.is_onboarded = True
    await db.flush()
    return {"message": "Profile updated successfully"}

@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    ext = file.filename.split(".")[-1].lower()
    if ext not in ["jpg", "jpeg", "png", "webp"]:
        raise HTTPException(status_code=400, detail="Invalid file type")

    filename = f"avatars/{user.id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = f"/app/uploads/{filename}"
    os.makedirs(os.path.dirname(filepath), exist_ok=True)

    async with aiofiles.open(filepath, "wb") as f:
        content = await file.read()
        await f.write(content)

    user.avatar_url = f"/uploads/{filename}"
    await db.flush()
    return {"avatar_url": user.avatar_url}

@router.post("/body-photo")
async def upload_body_photo(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "jpg"
    if ext not in ["jpg", "jpeg", "png", "webp"]:
        ext = "jpg"

    filename = f"body/{user.id}_{uuid.uuid4().hex[:6]}.{ext}"
    filepath = f"/app/uploads/{filename}"
    os.makedirs(os.path.dirname(filepath), exist_ok=True)

    content = await file.read()
    async with aiofiles.open(filepath, "wb") as f:
        await f.write(content)

    # Send to vision service for analysis + skeleton drawing
    vision_url = os.getenv("VISION_SERVICE_URL", "http://vision:8001")
    vision_result = {
        "detected": False,
        "body_type": None,
        "message": "Vision service unavailable",
        "annotated_image": None
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{vision_url}/analyze",
                files={"file": (filename, content, f"image/{ext}")}
            )
            if resp.status_code == 200:
                vision_result = resp.json()
                if vision_result.get("body_type"):
                    user.body_type = vision_result["body_type"]
    except Exception as e:
        pass

    user.body_photo_url = f"/uploads/{filename}"
    await db.flush()

    # Return full vision result including annotated_image
    return {
        "body_photo_url": user.body_photo_url,
        "body_type": user.body_type,
        "detected": vision_result.get("detected", False),
        "shoulder_hip_ratio": vision_result.get("shoulder_hip_ratio"),
        "style_note": vision_result.get("style_note", ""),
        "confidence": vision_result.get("confidence"),
        "landmarks_count": vision_result.get("landmarks_count"),
        "annotated_image": vision_result.get("annotated_image"),  # base64 skeleton image
        "message": vision_result.get("message", "")
    }
