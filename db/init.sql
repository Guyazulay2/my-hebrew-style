-- My Stylist – Database Schema
-- ─────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE,
    full_name VARCHAR(255),
    password_hash VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
    avatar_url TEXT,
    
    -- Body data (private)
    age INTEGER,
    height_cm INTEGER,
    weight_kg INTEGER,
    body_photo_url TEXT,
    body_type VARCHAR(50),  -- detected by MediaPipe
    
    -- Style preferences
    style_tags JSONB DEFAULT '[]',      -- ["casual", "streetwear", ...]
    brand_preferences JSONB DEFAULT '[]', -- ["zara", "nike", ...]
    
    -- Meta
    is_onboarded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- STYLING SESSIONS
-- ─────────────────────────────────────────
CREATE TABLE styling_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Input context
    event_type VARCHAR(100),    -- casual, formal, sport, party, beach...
    weather_data JSONB,         -- {temp, condition, city}
    season VARCHAR(20),
    additional_notes TEXT,
    
    -- AI Output
    outfit_recommendation JSONB,  -- full Claude response
    outfit_items JSONB DEFAULT '[]', -- parsed items with search results

    -- Wardrobe
    is_saved BOOLEAN DEFAULT FALSE,
    look_title VARCHAR(255),

    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- VISUAL SEARCHES
-- ─────────────────────────────────────────
CREATE TABLE visual_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    image_url TEXT NOT NULL,
    search_results JSONB DEFAULT '[]',  -- [{title, price, link, thumbnail, source}]
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- SAVED ITEMS (Wishlist)
-- ─────────────────────────────────────────
CREATE TABLE saved_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    title VARCHAR(500),
    price VARCHAR(50),
    link TEXT,
    thumbnail_url TEXT,
    source VARCHAR(255),
    category VARCHAR(100),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_styling_sessions_user ON styling_sessions(user_id);
CREATE INDEX idx_visual_searches_user ON visual_searches(user_id);
CREATE INDEX idx_saved_items_user ON saved_items(user_id);
