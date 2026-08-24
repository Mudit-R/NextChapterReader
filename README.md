# NextChapter - Digital Library and AI Reading Platform

Live Application: [https://next-chapter-reader.vercel.app](https://next-chapter-reader.vercel.app)

---

## Live Deployment Links

- Frontend Application: [https://next-chapter-reader.vercel.app](https://next-chapter-reader.vercel.app)
- Backend AI Microservice: [https://nextchapter-backend-ai.onrender.com](https://nextchapter-backend-ai.onrender.com)
- Database and Auth: [https://supabase.com](https://supabase.com)

---

## Overview

NextChapter is a full-stack digital library and reading platform designed for seamless book exploration, high-performance in-browser PDF rendering, and AI-powered reading assistance.

Users can explore books across multiple genres, track detailed reading metrics, and chat with an in-book grounded RAG assistant featuring anti-spoiler guardrails that prevent future chapter leaks based on the reader's current page.

---

## Architecture

- Frontend: React 18, Vite, Tailwind CSS, Framer Motion, and PDF.js hosted globally on Vercel with edge routing and single-page application fallback.
- Backend AI: FastAPI Python server handling in-book grounded retrieval-augmented generation (RAG), content moderation, and AI cover generation hosted on Render.
- Database and Authentication: PostgreSQL with Row-Level Security (RLS) policies and OAuth authentication (Google and Email) on Supabase.
- Inference Engine: Ultra-low latency inference via Groq API (dynamic model selection across Llama 3.3, Allam 2, and Qwen models).

---

## Features

### Core Reader and Library
- In-Browser PDF Rendering: Canvas-based PDF viewer with zoom, full-screen, continuous scrolling, and offline caching.
- Advanced Catalog Search: Filter and sort by title, author, genre, language, publication year, and community ratings.
- User Bookshelf and Progress: Track reading status (want to read, currently reading, completed), exact page progress, bookmarks, and highlights.
- Theme Customization: Dark and light modes with persistent local and profile preferences.
- Authentication: Secure email/password and Google OAuth workflows with automatic profile creation.

### AI Reading Assistant
- In-Book Grounded RAG: Context-aware Q&A answering questions exclusively from the book contents.
- Anti-Spoiler Mode: Restricts context retrieval to pages at or before the user's current reading position.
- Content Moderation: Automated screening of user comments and community submissions.
- Contextual Explanations: Inline vocabulary definitions and character relationship summaries.

### Community and Analytics
- Interactive Discussion: Real-time book comments, nested replies, upvoting, and user reporting.
- Personal Dashboard: Reading streak calculations, total hours read, completed books, and annual reading challenges.
- Admin Panel: Book catalog management, metadata edits, and batch CSV imports.

---

## Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- Framer Motion
- React Router DOM
- Lucide React
- Recharts
- PDF.js
- Socket.io Client

### Backend and Services
- Supabase (PostgreSQL, Auth, Storage)
- FastAPI (Python 3.11)
- Groq Cloud API
- Uvicorn
- Pydantic

---

## Project Structure

```text
NextChapter/
├── frontend/                     # React Single Page Application
│   ├── public/                  # Static assets and self-hosted book PDFs
│   │   └── pdfs/                # Complete public-domain book PDFs
│   ├── src/
│   │   ├── components/          # Reusable UI elements, reader, and admin panel
│   │   ├── contexts/            # Authentication and theme contexts
│   │   ├── lib/                 # Supabase client, PDF cache, and data transformers
│   │   ├── pages/               # Application routes and views
│   │   ├── pdf/                 # PDF rendering engine hooks
│   │   └── services/            # Microservice client connectors
│   ├── vercel.json              # Vercel SPA rewrites and security headers
│   └── package.json
├── backendAI/                   # FastAPI AI and RAG microservice
│   ├── rag/                     # Chunking, vector indexing, and grounded synthesis
│   ├── main.py                  # API endpoints for moderation, chat, and RAG
│   ├── requirements.txt         # Python dependencies
│   └── render.yaml              # Render deployment blueprint
├── database_setup.sql           # Complete Supabase PostgreSQL schema, RLS, and seed data
├── populate_library.sql         # Seed catalog with 16 classic books, covers, and PDFs
├── DEPLOYMENT_GUIDE.md          # Step-by-step cloud deployment walkthrough
└── README.md
```

---

## Local Development

### 1. Prerequisites
- Node.js 18 or higher
- Python 3.10 or higher
- Supabase account
- Groq Cloud API key

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Backend AI Setup
```bash
cd backendAI
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

---

## Database Configuration

1. Open the SQL Editor in your Supabase project dashboard.
2. Execute `database_setup.sql` to generate all required tables, security policies, and indexes.
3. Execute `populate_library.sql` to insert the classic book dataset.

---

## License

This project is licensed under the MIT License.
