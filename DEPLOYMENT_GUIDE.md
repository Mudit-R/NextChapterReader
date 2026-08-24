# NextChapter - Database Setup and Deployment Guide

Live Application: [https://next-chapter-reader.vercel.app](https://next-chapter-reader.vercel.app)

This guide walks you through setting up a cloud database on Supabase and deploying the entire NextChapter application with frontend on Vercel and backend AI on Render.

---

## Step 1: Initialize Cloud Database (Supabase)

NextChapter uses a PostgreSQL database on Supabase for authentication, user profiles, reading progress, and book catalogs.

1. Create Project:
   - Sign in to [Supabase](https://supabase.com).
   - Click "New Project", name it `nextchapter`, set a database password, and select your region.

2. Run Database Setup Script:
   - In your Supabase project dashboard, open the SQL Editor.
   - Click "New query".
   - Copy and paste the contents of `database_setup.sql` from this repository.
   - Click "Run" (Ctrl+Enter).
   - Result: All tables (`books`, `user_profiles`, `user_books`, `book_ratings`, `book_reads`, `book_comments`, `book_comment_replies`, `book_comment_reactions`, `book_reply_reactions`, `book_comment_reports`, `book_reply_reports`, `user_subscriptions`, `public_stats`), Row-Level Security (RLS) policies, and indexes are created.

3. Populate Library Catalog:
   - In SQL Editor, open another query and run `populate_library.sql` to populate the 16 classic books with covers and self-hosted PDF links.

4. Retrieve API Credentials:
   - Go to Project Settings -> API.
   - Copy your Project URL (`https://your-id.supabase.co`).
   - Copy your anon public key.

---

## Step 2: Deploy Backend AI and RAG Service (Render)

The backend microservice handles in-book grounded RAG question answering, content moderation, and AI cover generation.

1. Create Web Service:
   - Sign in to [Render](https://render.com).
   - Click "New +" -> "Web Service".
   - Connect your GitHub repository: `NextChapterReader`.

2. Configure Service:
   - Root Directory: `backendAI`
   - Runtime: `Python 3`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Instance Type: Free

3. Set Environment Variables:
   - `GROQ_API_KEY`: Your Groq API key from https://console.groq.com
   - `PYTHON_VERSION`: `3.11.9`

4. Click "Deploy Web Service".

---

## Step 3: Deploy Frontend (Vercel)

1. Import Project:
   - Sign in to [Vercel](https://vercel.com).
   - Click "Add New..." -> "Project" and import your repository.

2. Configure Build Settings:
   - Framework Preset: `Vite`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. Set Environment Variables:
   | Variable Name | Description / Example |
   | :--- | :--- |
   | `VITE_SUPABASE_URL` | Your Supabase project URL |
   | `VITE_SUPABASE_ANON_KEY` | Your Supabase anon public key |
   | `VITE_AI_SUGGESTION_URL` | Your Render backend service URL |
   | `VITE_GROQ_API_KEY` | Your Groq API key |

4. Click "Deploy".

---

## Local Development Setup

### 1. Backend AI
```bash
cd backendAI
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` to test the application locally.
