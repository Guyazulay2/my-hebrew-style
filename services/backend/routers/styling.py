from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel
import httpx
import json
import os
import base64

from models.database import get_db, User, StylingSession
from routers.user import get_current_user

router = APIRouter()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
SERPAPI_KEY = os.getenv("SERPAPI_KEY", "")
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
GEMINI_FALLBACK_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
GEMINI_IMAGE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent"


class StylingRequest(BaseModel):
    event_type: str
    city: str = "Tel Aviv"
    additional_notes: str = ""

class StylingResponse(BaseModel):
    session_id: str
    outfit_description: str
    style_tip: str
    items: list[dict]

async def get_weather(city: str) -> dict:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            geo = await client.get(
                f"https://geocoding-api.open-meteo.com/v1/search?name={city}&count=1"
            )
            if geo.status_code == 200:
                results = geo.json().get("results", [])
                if results:
                    lat = results[0]["latitude"]
                    lon = results[0]["longitude"]
                    weather = await client.get(
                        f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}"
                        f"&current=temperature_2m,weathercode&timezone=auto"
                    )
                    if weather.status_code == 200:
                        current = weather.json().get("current", {})
                        temp = current.get("temperature_2m", 20)
                        code = current.get("weathercode", 0)
                        condition = "sunny" if code < 3 else "cloudy" if code < 50 else "rainy"
                        return {"temp": temp, "condition": condition, "city": city}
    except Exception:
        pass
    return {"temp": 22, "condition": "pleasant", "city": city}

async def search_item(query: str) -> list[dict]:
    if not SERPAPI_KEY:
        return [{
            "title": query,
            "price": "Check online",
            "link": f"https://www.google.com/search?q={query.replace(' ', '+')}+buy",
            "thumbnail": "",
            "source": "Google Shopping"
        }]
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get("https://serpapi.com/search", params={
                "q": query,
                "tbm": "shop",
                "api_key": SERPAPI_KEY,
                "num": 3
            })
            if resp.status_code == 200:
                results = resp.json().get("shopping_results", [])[:3]
                return [
                    {
                        "title": r.get("title", ""),
                        "price": r.get("price", ""),
                        "link": r.get("link", ""),
                        "thumbnail": r.get("thumbnail", ""),
                        "source": r.get("source", "")
                    }
                    for r in results
                ]
    except Exception:
        pass
    return []

STYLING_PROMPT = """You are My Stylist – an elite personal AI fashion stylist.
You create personalized, stylish outfit recommendations.

IMPORTANT: Respond with ONLY valid JSON, no markdown, no extra text.

Format:
{
  "outfit_description": "2-3 sentences describing the full look and why it works",
  "style_tip": "One sharp specific styling tip",
  "items": [
    {
      "category": "top",
      "name": "specific item name",
      "description": "brief description with color and fit",
      "search_query": "exact search query for Google Shopping"
    }
  ]
}

Generate exactly 4-5 items. Categories: top, bottom, shoes, accessory, outerwear.
Be specific, fashionable, and personalized to the user."""

@router.post("/generate", response_model=StylingResponse)
async def generate_styling(
    request: StylingRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="AI service not configured. Add GEMINI_API_KEY to .env")

    weather = await get_weather(request.city)

    user_prompt = f"""{STYLING_PROMPT}

User Profile:
- Age: {user.age or 'not specified'}
- Height: {user.height_cm or 'not specified'}cm
- Weight: {user.weight_kg or 'not specified'}kg
- Body Type: {user.body_type or 'average'}
- Style Preferences: {', '.join(user.style_tags or ['casual', 'modern'])}
- Favorite Brands: {', '.join(user.brand_preferences or ['any'])}

Context:
- Event: {request.event_type}
- Weather: {weather['temp']}°C, {weather['condition']} in {weather['city']}
- Notes: {request.additional_notes or 'none'}

Respond with JSON only."""

    gemini_payload = {
        "contents": [{"parts": [{"text": user_prompt}]}],
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 1024},
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(f"{GEMINI_URL}?key={GEMINI_API_KEY}", json=gemini_payload)

        # On quota/rate-limit, try the fallback model
        if resp.status_code in (429, 503, 500):
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(f"{GEMINI_FALLBACK_URL}?key={GEMINI_API_KEY}", json=gemini_payload)

        if resp.status_code == 429:
            raise HTTPException(
                status_code=503,
                detail="מכסת ה-AI מוצתה — ודא שמפתח GEMINI_API_KEY תקין ויש לו קרדיט פעיל, או נסה שוב עוד מספר דקות."
            )
        if resp.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail="שירות ה-AI אינו זמין כרגע — בדוק את מפתח ה-GEMINI_API_KEY."
            )

        text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]

        # Clean markdown if Gemini adds it
        text = text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        text = text.strip()

        outfit_data = json.loads(text)

    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="Invalid AI response format")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI error: {str(e)}")

    # Enrich with search results
    items_with_results = []
    for item in outfit_data.get("items", []):
        search_results = await search_item(item["search_query"])
        items_with_results.append({**item, "search_results": search_results})

    # Save session
    session = StylingSession(
        user_id=user.id,
        event_type=request.event_type,
        weather_data=weather,
        additional_notes=request.additional_notes,
        outfit_recommendation=outfit_data,
        outfit_items=items_with_results
    )
    db.add(session)
    await db.flush()

    return StylingResponse(
        session_id=str(session.id),
        outfit_description=outfit_data.get("outfit_description", ""),
        style_tip=outfit_data.get("style_tip", ""),
        items=items_with_results
    )

def _session_dict(s: StylingSession) -> dict:
    return {
        "id": str(s.id),
        "event_type": s.event_type,
        "weather_data": s.weather_data,
        "outfit_description": (s.outfit_recommendation or {}).get("outfit_description", ""),
        "style_tip": (s.outfit_recommendation or {}).get("style_tip", ""),
        "items": s.outfit_items or [],
        "items_count": len(s.outfit_items or []),
        "is_saved": s.is_saved,
        "look_title": s.look_title,
        "created_at": s.created_at.isoformat(),
    }

@router.get("/history")
async def get_history(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(StylingSession)
        .where(StylingSession.user_id == user.id)
        .order_by(desc(StylingSession.created_at))
        .limit(50)
    )
    return [_session_dict(s) for s in result.scalars().all()]


@router.get("/wardrobe")
async def get_wardrobe(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(StylingSession)
        .where(StylingSession.user_id == user.id, StylingSession.is_saved == True)
        .order_by(desc(StylingSession.created_at))
    )
    return [_session_dict(s) for s in result.scalars().all()]


class SaveRequest(BaseModel):
    title: str | None = None

@router.post("/{session_id}/save")
async def toggle_save(
    session_id: str,
    body: SaveRequest = SaveRequest(),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    import uuid as _uuid
    try:
        sid = _uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="מזהה לא תקין")

    session = await db.get(StylingSession, sid)
    if not session or session.user_id != user.id:
        raise HTTPException(status_code=404, detail="לא נמצא")

    session.is_saved = not session.is_saved
    if session.is_saved and body.title:
        session.look_title = body.title
    elif not session.is_saved:
        session.look_title = None
    return {"is_saved": session.is_saved, "look_title": session.look_title}


@router.delete("/{session_id}")
async def delete_session(
    session_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    import uuid as _uuid
    try:
        sid = _uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="מזהה לא תקין")

    session = await db.get(StylingSession, sid)
    if not session or session.user_id != user.id:
        raise HTTPException(status_code=404, detail="לא נמצא")
    await db.delete(session)
    return {"deleted": True}


@router.post("/{session_id}/try-on")
async def virtual_try_on(
    session_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="AI service not configured")

    import uuid as _uuid
    try:
        sid = _uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="מזהה לא תקין")

    session = await db.get(StylingSession, sid)
    if not session or session.user_id != user.id:
        raise HTTPException(status_code=404, detail="לא נמצא")

    if not user.body_photo_url:
        raise HTTPException(status_code=400, detail="אנא העלה תמונת גוף תחילה")

    # Derive cutout path from body_photo_url using naming convention
    # body_photo_url = /uploads/body/{stem}.{ext}
    # cutout_path    = /app/uploads/body/{stem}_cutout.png
    photo_url = user.body_photo_url  # e.g. /uploads/body/uuid_abc123.jpg
    parts = photo_url.rsplit("/", 1)
    stem_with_ext = parts[-1]
    stem = stem_with_ext.rsplit(".", 1)[0]
    cutout_file = f"/app/uploads/body/{stem}_cutout.png"

    outfit_data = session.outfit_recommendation or {}
    outfit_desc = outfit_data.get("outfit_description", "")
    items = session.outfit_items or []
    items_text = ", ".join(
        f"{it.get('name', '')} ({it.get('category', '')})"
        for it in items[:5]
        if it.get("name")
    )

    # Read cutout file
    try:
        with open(cutout_file, "rb") as f:
            cutout_bytes = f.read()
        cutout_b64 = base64.b64encode(cutout_bytes).decode()
        image_mime = "image/png"
    except FileNotFoundError:
        # Fallback: use original body photo
        try:
            orig_file = f"/app{photo_url}"
            with open(orig_file, "rb") as f:
                cutout_bytes = f.read()
            cutout_b64 = base64.b64encode(cutout_bytes).decode()
            ext = photo_url.rsplit(".", 1)[-1].lower()
            image_mime = f"image/{'jpeg' if ext in ('jpg', 'jpeg') else ext}"
        except Exception:
            raise HTTPException(status_code=500, detail="לא ניתן לטעון את תמונת הגוף")

    prompt = f"""You are a virtual fashion stylist.
Take this person (shown in the image) and generate a realistic photo of them wearing the following outfit:

Outfit: {outfit_desc}
Items: {items_text}

Instructions:
- Keep the person's face, body shape, skin tone, and hair exactly the same
- Only change the clothing to match the described outfit
- The result should look like a real photo, not a drawing
- Use natural lighting and a neutral background
- The pose should be natural and confident"""

    try:
        async with httpx.AsyncClient(timeout=90) as client:
            resp = await client.post(
                f"{GEMINI_IMAGE_URL}?key={GEMINI_API_KEY}",
                json={
                    "contents": [{
                        "parts": [
                            {"text": prompt},
                            {"inline_data": {"mime_type": image_mime, "data": cutout_b64}}
                        ]
                    }],
                    "generationConfig": {
                        "responseModalities": ["IMAGE", "TEXT"],
                    }
                }
            )

        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail=f"AI error: {resp.status_code}")

        candidates = resp.json().get("candidates", [])
        if not candidates:
            raise HTTPException(status_code=502, detail="AI לא החזיר תוצאה")

        for part in candidates[0].get("content", {}).get("parts", []):
            if "inline_data" in part:
                return {
                    "try_on_image": part["inline_data"]["data"],
                    "mime_type": part["inline_data"].get("mime_type", "image/png"),
                }

        raise HTTPException(status_code=502, detail="AI לא יצר תמונה")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail="שגיאה ביצירת תמונת Try-On")
