-- Aktifkan ekstensi vektor (Wajib untuk AI RAG)
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabel Users (Sesuai SRS 6.1)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Documents (Knowledge Base)
-- Menggunakan vector(1536) karena standar OpenAI embedding adalah 1536 dimensi
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536), 
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk mempercepat pencarian similarity (HNSW Index)
CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops);

-- Tabel Chat History
CREATE TABLE IF NOT EXISTS chat_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    session_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES chat_sessions(id),
    role VARCHAR(20) NOT NULL, -- 'user' atau 'ai'
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);