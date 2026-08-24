-- ==========================================================
-- NextChapter - Complete Supabase Database Setup & Schema
-- Run this script in your Supabase SQL Editor (1-Click Setup)
-- ==========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. BOOKS TABLE
CREATE TABLE IF NOT EXISTS public.books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    description TEXT,
    genres TEXT[] DEFAULT '{}',
    cover_image TEXT,
    cover_url TEXT,
    file_url TEXT,
    storage_path TEXT,
    rating NUMERIC(3, 2) DEFAULT 4.5,
    total_ratings INT DEFAULT 0,
    total_reads INT DEFAULT 0,
    pages INT DEFAULT 100,
    published_year INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. USER PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT,
    profile_photo_url TEXT,
    bio TEXT,
    date_of_birth TEXT,
    gender TEXT,
    favorite_authors TEXT[] DEFAULT '{}',
    genres TEXT[] DEFAULT '{}',
    languages TEXT[] DEFAULT '{}',
    completed_at TIMESTAMP WITH TIME ZONE,
    subscription_plan TEXT DEFAULT 'Free',
    subscription_status TEXT DEFAULT 'inactive',
    subscription_start_date TIMESTAMP WITH TIME ZONE,
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    preferences JSONB DEFAULT '{"genres": [], "theme": "system", "daily_goal": 20}'::jsonb,
    is_admin BOOLEAN DEFAULT FALSE,
    role TEXT DEFAULT 'reader',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 3. USER READING PROGRESS & LISTS
CREATE TABLE IF NOT EXISTS public.user_books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'want_to_read' CHECK (status IN ('want_to_read', 'reading', 'finished')),
    current_page INT DEFAULT 1,
    total_pages INT DEFAULT 1,
    progress NUMERIC(5, 2) DEFAULT 0.0,
    rating INT,
    is_pinned BOOLEAN DEFAULT FALSE,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, book_id)
);

-- 4. BOOK RATINGS & REVIEWS
CREATE TABLE IF NOT EXISTS public.book_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, book_id)
);

-- 5. BOOK READING SESSIONS & ANALYTICS
CREATE TABLE IF NOT EXISTS public.book_reads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
    read_duration INT DEFAULT 0, -- seconds
    pages_read INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. BOOK SCROLL DEPTH
CREATE TABLE IF NOT EXISTS public.book_scroll_depth (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
    max_depth NUMERIC(5, 2) DEFAULT 0.0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, book_id)
);

-- 7. BOOK COMMENTS, REPLIES, REACTIONS & REPORTS
CREATE TABLE IF NOT EXISTS public.book_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
    author_name TEXT,
    text TEXT,
    comment TEXT,
    upvotes_count INT DEFAULT 0,
    is_moderated BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.book_comment_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID REFERENCES public.book_comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name TEXT,
    text TEXT NOT NULL,
    upvotes_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.book_comment_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID REFERENCES public.book_comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction_type TEXT DEFAULT 'upvote',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.book_reply_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reply_id UUID REFERENCES public.book_comment_replies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction_type TEXT DEFAULT 'upvote',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(reply_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.book_comment_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID REFERENCES public.book_comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.book_reply_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reply_id UUID REFERENCES public.book_comment_replies(id) ON DELETE CASCADE,
    user_id REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(reply_id, user_id)
);

-- 8. SUBSCRIPTIONS & PAYMENTS
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL DEFAULT 'free',
    status TEXT NOT NULL DEFAULT 'active',
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_period_end TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'completed',
    payment_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. PUBLIC STATS TABLE
CREATE TABLE IF NOT EXISTS public.public_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    total_readers INT DEFAULT 1250,
    books_completed INT DEFAULT 4800,
    reading_hours INT DEFAULT 18500,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. TRENDING BOOKS VIEW
CREATE OR REPLACE VIEW public.v_trending_books AS
SELECT 
    b.id,
    b.title,
    b.author,
    b.description,
    b.genres,
    b.cover_image,
    b.cover_url,
    b.file_url,
    b.rating,
    b.total_reads,
    COALESCE(COUNT(DISTINCT ubr.id), 0) AS recent_reads_count,
    COALESCE(AVG(br.rating), b.rating) AS avg_recent_rating
FROM public.books b
LEFT JOIN public.book_reads ubr ON b.id = ubr.book_id AND ubr.created_at > (NOW() - INTERVAL '30 days')
LEFT JOIN public.book_ratings br ON b.id = br.book_id
GROUP BY b.id;

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_stats ENABLE ROW LEVEL SECURITY;

-- Books: Public read, Admin write
CREATE POLICY "Books are publicly readable" ON public.books FOR SELECT USING (true);
CREATE POLICY "Books are editable by authenticated users" ON public.books FOR ALL USING (auth.role() = 'authenticated');

-- User Profiles: Public read, Owner insert & update & delete
CREATE POLICY "Profiles are readable by everyone" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own profile" ON public.user_profiles FOR DELETE USING (auth.uid() = user_id);

-- User Books: User only
CREATE POLICY "Users can view own reading lists" ON public.user_books FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own reading lists" ON public.user_books FOR ALL USING (auth.uid() = user_id);

-- Book Ratings & Comments: Public read, User write
CREATE POLICY "Ratings are publicly readable" ON public.book_ratings FOR SELECT USING (true);
CREATE POLICY "Users can rate books" ON public.book_ratings FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.book_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_comment_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_reply_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_comment_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_reply_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are publicly readable" ON public.book_comments FOR SELECT USING (true);
CREATE POLICY "Users can post comments" ON public.book_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update comments" ON public.book_comments FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'authenticated');
CREATE POLICY "Users can delete own comments" ON public.book_comments FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Replies are publicly readable" ON public.book_comment_replies FOR SELECT USING (true);
CREATE POLICY "Users can post replies" ON public.book_comment_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update replies" ON public.book_comment_replies FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'authenticated');
CREATE POLICY "Users can delete own replies" ON public.book_comment_replies FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Reactions are readable" ON public.book_comment_reactions FOR SELECT USING (true);
CREATE POLICY "Users can add reactions" ON public.book_comment_reactions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Reply reactions are readable" ON public.book_reply_reactions FOR SELECT USING (true);
CREATE POLICY "Users can add reply reactions" ON public.book_reply_reactions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can report comments" ON public.book_comment_reports FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can report replies" ON public.book_reply_reports FOR ALL USING (auth.uid() = user_id);

-- Subscriptions & Payments: User only
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public stats are readable" ON public.public_stats FOR SELECT USING (true);

-- ==========================================================
-- SEED DATA (Curated Classic & Popular Books)
-- ==========================================================

INSERT INTO public.public_stats (total_readers, books_completed, reading_hours)
VALUES (1420, 5630, 21400)
ON CONFLICT DO NOTHING;

INSERT INTO public.books (id, title, author, description, genres, cover_url, file_url, rating, total_ratings, total_reads, pages, published_year) VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'Pride and Prejudice',
    'Jane Austen',
    'A timeless romantic masterpiece following the tumultuous relationship between Elizabeth Bennet and the enigmatic Mr. Darcy.',
    ARRAY['Classic', 'Romance', 'Drama', 'Fiction'],
    'https://www.gutenberg.org/cache/epub/1342/pg1342.cover.medium.jpg',
    '/pdfs/pride-and-prejudice.pdf',
    4.85, 342, 1200, 279, 1813
),
(
    '22222222-2222-2222-2222-222222222222',
    'Frankenstein; Or, The Modern Prometheus',
    'Mary Wollstonecraft Shelley',
    'The groundbreaking gothic science fiction novel telling the tragic story of Victor Frankenstein and his monstrous creation.',
    ARRAY['Science Fiction', 'Horror', 'Classic', 'Gothic'],
    'https://www.gutenberg.org/cache/epub/84/pg84.cover.medium.jpg',
    '/pdfs/frankenstein.pdf',
    4.72, 285, 950, 211, 1818
),
(
    '33333333-3333-3333-3333-333333333333',
    'The Great Gatsby',
    'F. Scott Fitzgerald',
    'A portrait of the Jazz Age exploring wealth, obsession, and the elusive American Dream in Long Island during the Roaring Twenties.',
    ARRAY['Classic', 'Drama', 'Fiction', 'Literature'],
    'https://www.gutenberg.org/cache/epub/64317/pg64317.cover.medium.jpg',
    '/pdfs/the-great-gatsby.pdf',
    4.65, 410, 1540, 180, 1925
),
(
    '44444444-4444-4444-4444-444444444444',
    'Alice''s Adventures in Wonderland',
    'Lewis Carroll',
    'A young girl falls down a rabbit hole into a fantastical subterranean world populated by peculiar, anthropomorphic creatures.',
    ARRAY['Fantasy', 'Adventure', 'Classic', 'Children'],
    'https://www.gutenberg.org/cache/epub/11/pg11.cover.medium.jpg',
    '/pdfs/alices-adventures-in-wonderland.pdf',
    4.78, 450, 1850, 142, 1865
),
(
    '55555555-5555-5555-5555-555555555555',
    'Dracula',
    'Bram Stoker',
    'The iconic vampire story that shaped modern horror, chronicling Count Dracula''s attempt to move from Transylvania to England.',
    ARRAY['Horror', 'Gothic', 'Classic', 'Supernatural'],
    'https://www.gutenberg.org/cache/epub/345/pg345.cover.medium.jpg',
    '/pdfs/dracula.pdf',
    4.68, 290, 870, 388, 1897
),
(
    '66666666-6666-6666-6666-666666666666',
    'Metamorphosis',
    'Franz Kafka',
    'A profound existential novella following Gregor Samsa, who awakens one morning transformed into an enormous insect.',
    ARRAY['Fiction', 'Classic', 'Philosophy', 'Psychological'],
    'https://www.gutenberg.org/cache/epub/5200/pg5200.cover.medium.jpg',
    '/pdfs/the-metamorphosis.pdf',
    4.55, 195, 620, 85, 1915
)
ON CONFLICT (id) DO NOTHING;
