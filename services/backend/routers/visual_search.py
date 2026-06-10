from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
import httpx
import aiofiles
import uuid
import os
import base64
import json

from models.database import get_db, User, SavedItem, VisualSearch
from routers.user import get_current_user

router = APIRouter()
SERPAPI_KEY = os.getenv("SERPAPI_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_VISION_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

async def analyze_clothing_with_gemini(image_bytes: bytes, mime_type: str) -> dict:
    if not GEMINI_API_KEY:
        return {"item_type": "clothing", "description": "clothing item", "search_queries": ["בגד דומה לקנות"]}
    
    prompt = """Analyze this clothing item image and respond with ONLY valid JSON, no markdown:
{
  "item_type": "סוג הפריט בעברית",
  "gender": "גברים/נשים/יוניסקס",
  "color": "צבע עיקרי בעברית",
  "style": "קז'ואל/פורמלי/ספורט/אחר",
  "description": "תיאור קצר בעברית של הפריט",
  "search_queries": [
    "חיפוש ספציפי בעברית לחנויות ישראליות",
    "חיפוש שני בעברית",
    "english search query for broader results"
  ]
}
Be very specific about colors, patterns, cut and style."""

    try:
        img_b64 = base64.b64encode(image_bytes).decode()
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{GEMINI_VISION_URL}?key={GEMINI_API_KEY}",
                json={
                    "contents": [{
                        "parts": [
                            {"text": prompt},
                            {"inline_data": {"mime_type": mime_type, "data": img_b64}}
                        ]
                    }],
                    "generationConfig": {"temperature": 0.3, "maxOutputTokens": 512}
                }
            )
        if resp.status_code == 200:
            text = resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            return json.loads(text.strip())
    except Exception:
        pass
    return {"item_type": "clothing", "description": "clothing item", "search_queries": ["בגד דומה"]}

async def search_israel_stores(query: str) -> list[dict]:
    results = []
    
    if SERPAPI_KEY:
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                resp = await client.get("https://serpapi.com/search", params={
                    "engine": "google_shopping",
                    "q": query,
                    "gl": "il",
                    "hl": "iw",
                    "api_key": SERPAPI_KEY,
                    "num": 8
                })
                if resp.status_code == 200:
                    shopping = resp.json().get("shopping_results", [])[:8]
                    for r in shopping:
                        results.append({
                            "title": r.get("title", ""),
                            "price": r.get("price", ""),
                            "link": r.get("link", ""),
                            "thumbnail": r.get("thumbnail", ""),
                            "source": r.get("source", ""),
                            "rating": r.get("rating"),
                        })
        except Exception:
            pass

    encoded = query.replace(" ", "+")
    israel_stores = [
        {"title": f"חיפוש ב-ZARA Israel", "price": "", "link": f"https://www.zara.com/il/he/search?searchTerm={encoded}", "thumbnail": "", "source": "ZARA"},
        {"title": f"חיפוש ב-H&M Israel", "price": "", "link": f"https://www2.hm.com/he_il/search-results.html?q={encoded}", "thumbnail": "", "source": "H&M"},
        {"title": f"חיפוש ב-FOX Fashion", "price": "", "link": f"https://www.foxfashion.co.il/catalogsearch/result/?q={encoded}", "thumbnail": "", "source": "FOX"},
        {"title": f"חיפוש ב-Castro", "price": "", "link": f"https://www.castro.com/catalogsearch/result/?q={encoded}", "thumbnail": "", "source": "Castro"},
        {"title": f"חיפוש ב-Renuar", "price": "", "link": f"https://www.renuar.co.il/catalogsearch/result/?q={encoded}", "thumbnail": "", "source": "Renuar"},
        {"title": f"חיפוש ב-ASOS", "price": "", "link": f"https://www.asos.com/il/search/?q={encoded}", "thumbnail": "", "source": "ASOS"},
        {"title": f"חיפוש ב-Terminal X", "price": "", "link": f"https://www.terminalx.com/search?q={encoded}", "thumbnail": "", "source": "Terminal X"},
        {"title": f"חיפוש ב-Honigman", "price": "", "link": f"https://www.honigman.co.il/search?q={encoded}", "thumbnail": "", "source": "Honigman"},
    ]
    
    if not results:
        return israel_stores
    else:
        results.extend(israel_stores[:4])
        return results

MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_EXT  = {"jpg", "jpeg", "png", "webp"}

@router.post("/image")
async def search_by_image(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Validate content-type
    if file.content_type and file.content_type not in ALLOWED_MIME:
        raise HTTPException(status_code=400, detail="סוג קובץ לא נתמך — JPG / PNG / WEBP בלבד")

    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_EXT:
        ext = "jpg"

    content = await file.read()

    # Enforce size limit
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="הקובץ גדול מדי — מקסימום 10MB")
    filename = f"searches/{user.id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = f"/app/uploads/{filename}"
    os.makedirs(os.path.dirname(filepath), exist_ok=True)

    async with aiofiles.open(filepath, "wb") as f:
        await f.write(content)

    image_url = f"/uploads/{filename}"
    mime_type = f"image/{ext}" if ext != "jpg" else "image/jpeg"

    analysis = await analyze_clothing_with_gemini(content, mime_type)
    
    all_results = []
    search_queries = analysis.get("search_queries", ["בגד דומה"])
    
    for query in search_queries[:2]:
        results = await search_israel_stores(query)
        for r in results:
            if r not in all_results:
                all_results.append(r)

    search_record = VisualSearch(
        user_id=user.id,
        image_url=image_url,
        search_results=all_results
    )
    db.add(search_record)
    await db.flush()

    return {
        "search_id": str(search_record.id),
        "image_url": image_url,
        "analysis": analysis,
        "results": all_results
    }

@router.post("/save-item")
async def save_item(
    item: dict,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    saved = SavedItem(
        user_id=user.id,
        title=item.get("title"),
        price=item.get("price"),
        link=item.get("link"),
        thumbnail_url=item.get("thumbnail"),
        source=item.get("source"),
        category=item.get("category")
    )
    db.add(saved)
    await db.flush()
    return {"id": str(saved.id), "message": "Item saved"}

@router.get("/saved")
async def get_saved_items(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy import select, desc
    result = await db.execute(
        select(SavedItem)
        .where(SavedItem.user_id == user.id)
        .order_by(desc(SavedItem.created_at))
    )
    items = result.scalars().all()
    return [
        {
            "id": str(i.id),
            "title": i.title,
            "price": i.price,
            "link": i.link,
            "thumbnail_url": i.thumbnail_url,
            "source": i.source,
            "category": i.category,
            "created_at": i.created_at.isoformat()
        }
        for i in items
    ]
