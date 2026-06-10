# My Stylist · סטייליסט אישי מבוסס AI

AI-powered personal styling app — upload a reference photo, describe where you're going, and get a complete outfit with real shopping links from Israeli stores.

## Stack

- **Frontend**: React + TanStack Router + Tailwind CSS (TypeScript)
- **Backend**: FastAPI (Python) + PostgreSQL + SQLAlchemy async
- **AI**: Google Gemini 2.0 Flash (outfit generation + clothing recognition)
- **Shopping**: SerpAPI Google Shopping (optional) + direct store links

## Quick Start

### 1. Clone & configure

```bash
cp .env.example .env
# Edit .env — add your GEMINI_API_KEY at minimum
```

### 2. Run with Docker Compose

```bash
docker compose up --build
```

The app will be available at `http://localhost`.

### 3. Frontend dev mode (without Docker)

```bash
# In the root directory
bun install
VITE_API_URL=http://localhost:8000 bun dev
```

And run the backend separately:

```bash
cd services/backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## API Keys

| Key | Required | Where to get |
|-----|----------|--------------|
| `GEMINI_API_KEY` | ✅ Yes | [Google AI Studio](https://aistudio.google.com/) |
| `SERPAPI_KEY` | Optional | [SerpAPI](https://serpapi.com/) — for real product prices |

Without `SERPAPI_KEY`, results include direct links to Israeli store search pages (ZARA, H&M, FOX, Castro, etc.) with no prices.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/user/profile` | Get user profile |
| PUT | `/api/user/onboarding` | Update style preferences |
| POST | `/api/styling/generate` | Generate outfit recommendation |
| GET | `/api/styling/history` | Past styling sessions |
| POST | `/api/search/image` | Visual search by clothing photo |
| GET | `/api/search/saved` | Saved items |
