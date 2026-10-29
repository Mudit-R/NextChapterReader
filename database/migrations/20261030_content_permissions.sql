-- Apply with the Supabase SQL Editor or a trusted database owner connection.
-- Admin authority comes ONLY from server-controlled app_metadata, not from
-- user-editable profile.is_admin or user_metadata fields.
BEGIN;

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_comment_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_scroll_depth ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own scroll depth" ON public.book_scroll_depth;
CREATE POLICY "Users can manage own scroll depth" ON public.book_scroll_depth
    FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Books are editable by authenticated users" ON public.books;
DROP POLICY IF EXISTS "Admins can manage books" ON public.books;
CREATE POLICY "Admins can manage books" ON public.books
    FOR ALL TO authenticated
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Users can update comments" ON public.book_comments;
CREATE POLICY "Users can update comments" ON public.book_comments
    FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update replies" ON public.book_comment_replies;
CREATE POLICY "Users can update replies" ON public.book_comment_replies
    FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

COMMIT;
