# NextChapter - Complete Database Setup & Deployment Guide

This guide walks you through setting up a brand-new cloud database (Supabase / PostgreSQL) and deploying the entire NextChapter application (Frontend on Vercel + Backend AI & RAG on Render / Cloud Run) in under 5 minutes.

---

## 🚀 Step 1: Initialize New Cloud Database (Supabase)

NextChapter uses a PostgreSQL-backed BaaS (Supabase) for authentication, user profiles, reading progress, and book catalogs.

1. **Create Free Project**:
   - Sign in to [Supabase](https://supabase.com).
   - Click **"New Project"**, name it `nextchapter`, set a database password, and choose your preferred region.

2. **Run 1-Click Schema & Seed Script**:
   - In your Supabase project dashboard, click **SQL Editor** on the left menu.
   - Click **"New query"**.
   - Copy and paste the entire contents of [`database_setup.sql`](./database_setup.sql) from this repository.
   - Click **"Run"** (Ctrl+Enter).
   - *Result*: All tables (`books`, `user_profiles`, `user_books`, `book_ratings`, `book_reads`, `book_comments`, `user_subscriptions`, `public_stats`, `v_trending_books`), Row-Level Security (RLS) policies, and starter classic books are created and indexed automatically.

3. **Get Your API Credentials**:
   - Go to **Project Settings** -> **API**.
   - Copy your **Project URL** (e.g. `https://xyzabcdef.supabase.co`).
   - Copy your **anon / public key** (`eyJhbGciOi...`).

---

## 🤖 Step 2: Deploy Backend AI & RAG Service (Render)

The backend microservice handles **in-book RAG Q&A**, **content moderation**, and **cover art generation**.

1. **Create Web Service**:
   - Sign in to [Render](https://render.com).
   - Click **"New +"** -> **"Web Service"**.
   - Connect your GitHub repository: `NextChapterReader` (or your repo name).

2. **Configure Service**:
   - **Root Directory**: `backendAI`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`

3. **Set Environment Variables**:
   - `GROQ_API_KEY`: `<Your Groq API key from https://console.groq.com>`
   - `PYTHON_VERSION`: `3.11.9`

4. Click **"Deploy Web Service"**.
   - Render will deploy the service and provide a URL (e.g. `https://nextchapter-ai.onrender.com`).

---

## 🌐 Step 3: Deploy Frontend (Vercel)

1. **Import Project**:
   - Sign in to [Vercel](https://vercel.com).
   - Click **"Add New..."** -> **"Project"** -> Import your GitHub repository.

2. **Configure Build Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click "Edit" and select `frontend`.
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

3. **Add Environment Variables**:
   | Key | Value |
   | :--- | :--- |
   | `VITE_SUPABASE_URL` | `https://your-project-id.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | `your-supabase-anon-key` |
   | `VITE_AI_SUGGESTION_URL` | `https://nextchapter-ai.onrender.com` (from Step 2) |
   | `VITE_GROQ_API_KEY` | `gsk_your_groq_key` |

4. Click **"Deploy"**.
   - Your digital reader platform will be live globally on Vercel with SSL, CDN caching, and custom domain support!

---

## 💻 Local Development Setup

If you want to run the full stack locally:

### 1. Backend AI:
```bash
cd backendAI
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### 2. Frontend:
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` to explore your reading platform!
