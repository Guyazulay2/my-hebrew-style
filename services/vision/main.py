from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import mediapipe as mp
import numpy as np
import cv2
from PIL import Image
import io
import math
import base64

_REMBG_AVAILABLE = False
_rembg_session = None
_rembg_general_session = None

try:
    from rembg import remove as _rembg_remove, new_session as _rembg_new_session
    _rembg_session = _rembg_new_session("u2net_human_seg")
    _REMBG_AVAILABLE = True
    try:
        _rembg_general_session = _rembg_new_session("u2net")
    except Exception:
        _rembg_general_session = _rembg_session
except Exception:
    pass

app = FastAPI(title="My Stylist Vision Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

mp_pose = mp.solutions.pose

def get_body_width_at_y(img_bgr, y_ratio, landmarks, img_w, img_h, search_band=0.04):
    """
    Find actual body width at a specific vertical position using pixel analysis.
    More accurate than using landmark x-distances.
    """
    y_px = int(y_ratio * img_h)
    band = int(search_band * img_h)
    y1 = max(0, y_px - band)
    y2 = min(img_h, y_px + band)
    
    strip = img_bgr[y1:y2, :, :]
    
    # Convert to grayscale and find body pixels
    # Body detection: find columns that differ from background
    gray = cv2.cvtColor(strip, cv2.COLOR_BGR2GRAY)
    
    # Adaptive threshold to find foreground
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    # Find leftmost and rightmost body pixels
    col_sums = np.sum(thresh, axis=0)
    body_cols = np.where(col_sums > band * 0.3)[0]
    
    if len(body_cols) < 10:
        return None, None, None
    
    left_px = body_cols[0]
    right_px = body_cols[-1]
    width_px = right_px - left_px
    
    return left_px, right_px, width_px


def calculate_body_type_v2(landmarks, img_bgr, img_w, img_h) -> dict:
    """
    Improved body type detection using both landmarks AND pixel width analysis.
    """
    lm = landmarks.landmark

    def vis(idx):
        return lm[idx].visibility

    def px_y(idx):
        return lm[idx].y * img_h

    def px_x(idx):
        return lm[idx].x * img_w

    try:
        # Key landmarks
        LEFT_SHOULDER  = mp_pose.PoseLandmark.LEFT_SHOULDER
        RIGHT_SHOULDER = mp_pose.PoseLandmark.RIGHT_SHOULDER
        LEFT_HIP       = mp_pose.PoseLandmark.LEFT_HIP
        RIGHT_HIP      = mp_pose.PoseLandmark.RIGHT_HIP
        LEFT_KNEE      = mp_pose.PoseLandmark.LEFT_KNEE
        RIGHT_KNEE     = mp_pose.PoseLandmark.RIGHT_KNEE

        # Check visibility
        shoulder_vis = min(vis(LEFT_SHOULDER.value), vis(RIGHT_SHOULDER.value))
        hip_vis      = min(vis(LEFT_HIP.value), vis(RIGHT_HIP.value))

        if shoulder_vis < 0.3 or hip_vis < 0.3:
            return {"body_type": "unknown", "style_note": "לא מספיק נקודות גוף ברורות"}

        # Landmark-based widths (normalized)
        shoulder_lm_w = abs(px_x(LEFT_SHOULDER.value) - px_x(RIGHT_SHOULDER.value))
        hip_lm_w      = abs(px_x(LEFT_HIP.value) - px_x(RIGHT_HIP.value))

        # Pixel-based widths at shoulder and hip heights
        shoulder_y = (lm[LEFT_SHOULDER.value].y + lm[RIGHT_SHOULDER.value].y) / 2
        hip_y      = (lm[LEFT_HIP.value].y + lm[RIGHT_HIP.value].y) / 2

        _, _, shoulder_px_w = get_body_width_at_y(img_bgr, shoulder_y, landmarks, img_w, img_h, search_band=0.03)
        _, _, hip_px_w      = get_body_width_at_y(img_bgr, hip_y,      landmarks, img_w, img_h, search_band=0.04)

        # Use pixel width if available (more accurate), else landmark
        if shoulder_px_w and hip_px_w and shoulder_px_w > 20 and hip_px_w > 20:
            shoulder_w = shoulder_px_w
            hip_w      = hip_px_w
            method     = "pixel"
        else:
            shoulder_w = shoulder_lm_w
            hip_w      = hip_lm_w
            method     = "landmark"

        if hip_w == 0:
            return {"body_type": "average", "style_note": ""}

        ratio = shoulder_w / hip_w

        # Refined thresholds
        if ratio > 1.20:
            body_type  = "inverted_triangle"
            style_note = "כתפיים רחבות יחסית לירכיים – מתאים לחולצות fitted ומכנסיים ישרים"
        elif ratio < 0.85:
            body_type  = "pear"
            style_note = "ירכיים רחבות יחסית לכתפיים – מתאים לחולצות מבנה ומכנסיים A-line"
        elif 0.90 <= ratio <= 1.10:
            body_type  = "hourglass" if hip_w > shoulder_w * 0.85 else "rectangle"
            style_note = "פרופורציות מאוזנות – רוב הסגנונות מתאימים"
        else:
            body_type  = "athletic"
            style_note = "גוף ספורטיבי – מתאים למגוון רחב של סגנונות"

        return {
            "body_type": body_type,
            "shoulder_hip_ratio": round(ratio, 2),
            "shoulder_width_px": round(shoulder_w, 1) if method == "pixel" else None,
            "hip_width_px": round(hip_w, 1) if method == "pixel" else None,
            "detection_method": method,
            "style_note": style_note,
            "confidence": round(min(shoulder_vis, hip_vis), 2)
        }
    except Exception as e:
        return {"body_type": "average", "style_note": "", "error": str(e)}


def draw_skeleton(img_bgr: np.ndarray, landmarks, img_w: int, img_h: int) -> np.ndarray:
    out = img_bgr.copy()
    lm  = landmarks.landmark

    CONNECTIONS = {
        "torso": [(11,12),(11,23),(12,24),(23,24)],
        "arms":  [(11,13),(13,15),(12,14),(14,16)],
        "legs":  [(23,25),(25,27),(24,26),(26,28),(27,31),(28,32)],
    }
    COLORS = {
        "torso": (0, 220, 255),
        "arms":  (60, 230, 60),
        "legs":  (255, 160, 20),
    }
    THICKNESS = max(3, img_w // 200)

    for group, pairs in CONNECTIONS.items():
        color = COLORS[group]
        for a_idx, b_idx in pairs:
            a = lm[a_idx]; b = lm[b_idx]
            if a.visibility < 0.35 or b.visibility < 0.35:
                continue
            ax, ay = int(a.x * img_w), int(a.y * img_h)
            bx, by = int(b.x * img_w), int(b.y * img_h)
            cv2.line(out, (ax, ay), (bx, by), (0,0,0), THICKNESS + 4)
            cv2.line(out, (ax, ay), (bx, by), color, THICKNESS)

    KEY_JOINTS = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]
    R = max(6, img_w // 120)
    for idx in KEY_JOINTS:
        lmk = lm[idx]
        if lmk.visibility < 0.35:
            continue
        cx, cy = int(lmk.x * img_w), int(lmk.y * img_h)
        cv2.circle(out, (cx, cy), R+3, (0,0,0), -1)
        cv2.circle(out, (cx, cy), R, (255,255,255), -1)
        cv2.circle(out, (cx, cy), R-2, (0,210,255), -1)

    # Measurement lines
    def draw_measure(p1_idx, p2_idx, color, label):
        p1 = lm[p1_idx]; p2 = lm[p2_idx]
        if p1.visibility < 0.4 or p2.visibility < 0.4:
            return
        x1,y1 = int(p1.x*img_w), int(p1.y*img_h)
        x2,y2 = int(p2.x*img_w), int(p2.y*img_h)
        mid_x = (x1+x2)//2
        top_y = min(y1,y2) - 14
        cv2.line(out,(x1,y1),(x2,y1),color,2)
        cv2.line(out,(x1,y1-8),(x1,y1+8),color,2)
        cv2.line(out,(x2,y2-8),(x2,y2+8),color,2)
        cv2.putText(out, label, (mid_x-30, top_y), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,0,0), 3)
        cv2.putText(out, label, (mid_x-30, top_y), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)

    draw_measure(11, 12, (0,220,255), "Shoulders")
    draw_measure(23, 24, (255,160,20), "Hips")

    return out


MAX_UPLOAD_BYTES = 15 * 1024 * 1024
ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp"}

@app.post("/analyze")
async def analyze_body(file: UploadFile = File(...)):
    if file.content_type and file.content_type not in ALLOWED_MIME:
        raise HTTPException(status_code=400, detail="סוג קובץ לא נתמך — JPG / PNG / WEBP בלבד")

    content = await file.read()

    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="הקובץ גדול מדי — מקסימום 15MB")

    try:
        img = Image.open(io.BytesIO(content)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="לא ניתן לפתוח את הקובץ — קובץ תמונה לא תקין")

    try:
        max_size = 1024
        if max(img.size) > max_size:
            ratio = max_size / max(img.size)
            img = img.resize((int(img.width*ratio), int(img.height*ratio)), Image.LANCZOS)

        img_array = np.array(img)
        img_bgr   = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        h, w      = img_bgr.shape[:2]

        with mp_pose.Pose(static_image_mode=True, model_complexity=2, min_detection_confidence=0.3) as pose:
            results = pose.process(cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB))

        if not results.pose_landmarks:
            return {
                "detected": False,
                "body_type": None,
                "message": "לא זוהה גוף בתמונה. אנא העלה תמונה של גוף מלא, עומד ישר, על רקע בהיר.",
                "annotated_image": None,
            }

        annotated = draw_skeleton(img_bgr, results.pose_landmarks, w, h)
        _, buf = cv2.imencode('.jpg', annotated, [cv2.IMWRITE_JPEG_QUALITY, 92])
        img_b64 = base64.b64encode(buf.tobytes()).decode()

        analysis = calculate_body_type_v2(results.pose_landmarks, img_bgr, w, h)

        visible_count = len([
            lm for lm in results.pose_landmarks.landmark
            if lm.visibility > 0.35
        ])

        body_type_labels = {
            "inverted_triangle": "משולש הפוך",
            "pear": "אגס",
            "hourglass": "שעון חול",
            "rectangle": "מלבן",
            "athletic": "ספורטיבי",
            "average": "ממוצע",
            "unknown": "לא ידוע",
        }
        body_type = analysis.get("body_type", "average")

        # Background removal — produce a clean cutout PNG
        cutout_b64 = None
        if _REMBG_AVAILABLE:
            try:
                cutout_bytes = _rembg_remove(content, session=_rembg_session)
                cutout_b64 = base64.b64encode(cutout_bytes).decode()
            except Exception:
                pass

        return {
            "detected": True,
            "body_type": body_type,
            "body_type_label": body_type_labels.get(body_type, body_type),
            "shoulder_hip_ratio": analysis.get("shoulder_hip_ratio"),
            "detection_method": analysis.get("detection_method", "landmark"),
            "style_note": analysis.get("style_note", ""),
            "confidence": analysis.get("confidence", 0.8),
            "landmarks_count": visible_count,
            "annotated_image": img_b64,
            "cutout_image": cutout_b64,
            "image_width": w,
            "image_height": h,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="שגיאה בניתוח התמונה — נסה שוב")


@app.post("/cutout")
async def remove_background_general(file: UploadFile = File(...)):
    """General background removal — for clothing items and other objects."""
    if not _REMBG_AVAILABLE:
        return {"cutout_image": None, "available": False}

    if file.content_type and file.content_type not in ALLOWED_MIME:
        raise HTTPException(status_code=400, detail="סוג קובץ לא נתמך")

    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="הקובץ גדול מדי")

    try:
        sess = _rembg_general_session if _rembg_general_session else _rembg_session
        cutout_bytes = _rembg_remove(content, session=sess)
        return {"cutout_image": base64.b64encode(cutout_bytes).decode(), "available": True}
    except Exception:
        raise HTTPException(status_code=500, detail="שגיאה בהסרת רקע")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "Vision Service", "mediapipe": "ready"}
