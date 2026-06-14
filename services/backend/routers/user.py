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

_AVATAR_MAX_BYTES   = 5 * 1024 * 1024
_AVATAR_ALLOWED_EXT = {"jpg", "jpeg", "png", "webp"}

@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    raw_name = (file.filename or "avatar.jpg").rsplit("/", 1)[-1].rsplit("\\", 1)[-1]
    ext = raw_name.rsplit(".", 1)[-1].lower() if "." in raw_name else "jpg"
    if ext not in _AVATAR_ALLOWED_EXT:
        raise HTTPException(status_code=400, detail="סוג קובץ לא נתמך — JPG / PNG / WEBP בלבד")

    content = await file.read()
    if len(content) > _AVATAR_MAX_BYTES:
        raise HTTPException(status_code=413, detail="הקובץ גדול מדי — מקסימום 5MB")

    filename = f"avatars/{user.id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = f"/app/uploads/{filename}"
    os.makedirs(os.path.dirname(filepath), exist_ok=True)

    async with aiofiles.open(filepath, "wb") as f:
        await f.write(content)

    user.avatar_url = f"/uploads/{filename}"
    await db.flush()
    return {"avatar_url": user.avatar_url}

_BODY_MAX_BYTES = 10 * 1024 * 1024
_BODY_ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp"}
_BODY_ALLOWED_EXT  = {"jpg", "jpeg", "png", "webp"}

@router.post("/body-photo")
async def upload_body_photo(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if file.content_type and file.content_type not in _BODY_ALLOWED_MIME:
        raise HTTPException(status_code=400, detail="סוג קובץ לא נתמך — JPG / PNG / WEBP בלבד")

    raw_name = (file.filename or "upload.jpg").rsplit("/", 1)[-1].rsplit("\\", 1)[-1]
    ext = raw_name.rsplit(".", 1)[-1].lower() if "." in raw_name else "jpg"
    if ext not in _BODY_ALLOWED_EXT:
        ext = "jpg"

    content = await file.read()
    if len(content) > _BODY_MAX_BYTES:
        raise HTTPException(status_code=413, detail="הקובץ גדול מדי — מקסימום 10MB")

    # Validate with vision service BEFORE saving
    vision_url = os.getenv("VISION_SERVICE_URL", "http://vision:8001")
    vision_result: dict = {}

    try:
        async with httpx.AsyncClient(timeout=40) as client:
            resp = await client.post(
                f"{vision_url}/analyze",
                files={"file": (f"body.{ext}", content, f"image/{'jpeg' if ext == 'jpg' else ext}")}
            )
            if resp.status_code == 200:
                vision_result = resp.json()
            elif resp.status_code in (400, 413):
                raise HTTPException(status_code=resp.status_code, detail=resp.json().get("detail", "תמונה לא תקינה"))
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=503, detail="שירות הניתוח אינו זמין כרגע — נסה שוב מאוחר יותר")

    if not vision_result.get("detected"):
        msg = vision_result.get("message") or "לא זוהה גוף בתמונה"
        raise HTTPException(
            status_code=422,
            detail=f"התמונה שהועלתה אינה מתאימה. {msg} אנא העלה תמונה של גוף מלא, עומד ישר, על רקע בהיר."
        )

    # Body detected — save original + cutout
    stem = f"{user.id}_{uuid.uuid4().hex[:6]}"
    filename     = f"body/{stem}.{ext}"
    filepath     = f"/app/uploads/{filename}"
    cutout_name  = f"body/{stem}_cutout.png"
    cutout_path  = f"/app/uploads/{cutout_name}"

    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    async with aiofiles.open(filepath, "wb") as f:
        await f.write(content)

    cutout_url = None
    raw_cutout_b64 = vision_result.get("cutout_image")
    if raw_cutout_b64:
        import base64 as _b64
        try:
            cutout_bytes = _b64.b64decode(raw_cutout_b64)
            async with aiofiles.open(cutout_path, "wb") as f:
                await f.write(cutout_bytes)
            cutout_url = f"/uploads/{cutout_name}"
        except Exception:
            pass

    if vision_result.get("body_type"):
        user.body_type = vision_result["body_type"]
    user.body_photo_url = f"/uploads/{filename}"
    await db.flush()

    return {
        "body_photo_url": user.body_photo_url,
        "cutout_url": cutout_url,
        "body_type": user.body_type,
        "body_type_label": vision_result.get("body_type_label"),
        "detected": True,
        "shoulder_hip_ratio": vision_result.get("shoulder_hip_ratio"),
        "detection_method": vision_result.get("detection_method"),
        "style_note": vision_result.get("style_note", ""),
        "confidence": vision_result.get("confidence"),
        "landmarks_count": vision_result.get("landmarks_count"),
        "image_width": vision_result.get("image_width"),
        "image_height": vision_result.get("image_height"),
        "annotated_image": vision_result.get("annotated_image"),
        "cutout_image": raw_cutout_b64,
        "message": "",
    }
