"""Run actual bootstrap, repeatable migration and RLS scenarios in disposable PG."""
from pathlib import Path
import json
import subprocess
import time
import uuid

ROOT = Path(__file__).resolve().parents[2]
NAME = 'nextchapter-rls-test-' + uuid.uuid4().hex[:10]
USER_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
USER_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
BOOK = '11111111-1111-1111-1111-111111111111'
COMMENT = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
REPLY = 'dddddddd-dddd-dddd-dddd-dddddddddddd'
SCROLL = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'


def docker(*args, **kwargs):
    return subprocess.run(['docker', *args], check=True, text=True, capture_output=True, **kwargs)


def sql(statement):
    return docker('exec', '-i', NAME, 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-At', input=statement).stdout.strip()


def scenario(name, query, expected=None, *, user=USER_A, admin=False, anonymous=False, spoof=False, denied=False):
    claims = json.dumps({'sub': user, 'app_metadata': {'role': 'admin'} if admin else {},
                         'user_metadata': {'role': 'admin'} if spoof else {}})
    role = 'anon' if anonymous else 'authenticated'
    statement = f"BEGIN; SET LOCAL ROLE {role}; SET LOCAL request.jwt.claims = '{claims}';\n{query}\nROLLBACK;"
    try:
        output = sql(statement)
    except subprocess.CalledProcessError as error:
        if denied and ('row-level security' in error.stderr or 'permission denied' in error.stderr):
            print('PASS:', name)
            return
        raise AssertionError(f'{name}: {error.stderr}') from error
    if denied:
        raise AssertionError(f'{name}: expected permission failure')
    # psql emits BEGIN/SET/ROLLBACK command tags alongside the scalar result.
    values = [line for line in output.splitlines() if line not in {'BEGIN', 'SET', 'ROLLBACK'}]
    assert values == [str(expected)], (name, values, expected)
    print('PASS:', name)


def main():
    docker('run', '--detach', '--name', NAME, '-e', 'POSTGRES_PASSWORD=local-disposable-test', 'postgres:16-alpine')
    try:
        for _ in range(60):
            try:
                docker('exec', NAME, 'pg_isready', '-U', 'postgres')
                break
            except subprocess.CalledProcessError:
                time.sleep(0.5)
        else:
            raise RuntimeError('PostgreSQL did not start')
        sql('''CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN;
CREATE SCHEMA auth;
CREATE TABLE auth.users(id uuid PRIMARY KEY);
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS
$$ SELECT COALESCE(NULLIF(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
$$ SELECT (auth.jwt()->>'sub')::uuid $$;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT current_user::text $$;
GRANT USAGE ON SCHEMA auth, public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO anon, authenticated;
''')
        sql((ROOT / 'database_setup.sql').read_text(encoding='utf-8'))
        migration = (ROOT / 'database/migrations/20261030_content_permissions.sql').read_text(encoding='utf-8')
        sql(migration)
        sql(migration)
        print('PASS: fresh schema bootstrap and migration applied twice')
        sql(f"""GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
INSERT INTO auth.users VALUES ('{USER_A}'), ('{USER_B}');
INSERT INTO public.book_comments(id,user_id,book_id,text) VALUES ('{COMMENT}','{USER_A}','{BOOK}','original');
INSERT INTO public.book_comment_replies(id,user_id,comment_id,text) VALUES ('{REPLY}','{USER_A}','{COMMENT}','original');
INSERT INTO public.book_scroll_depth(id,user_id,book_id,max_depth) VALUES ('{SCROLL}','{USER_A}','{BOOK}',30);
""")
        for table, row in [('book_comments', COMMENT), ('book_comment_replies', REPLY)]:
            update = f"WITH edited AS (UPDATE public.{table} SET text='changed' WHERE id='{row}' RETURNING id) SELECT count(*) FROM edited;"
            scenario(table + ': owner update', update, 1)
            scenario(table + ': other user blocked', update, 0, user=USER_B)
            scenario(table + ': anonymous blocked', update, 0, anonymous=True)
            scenario(table + ': owner reassignment blocked', f"UPDATE public.{table} SET user_id='{USER_B}' WHERE id='{row}';", denied=True)
        update_book = f"WITH edited AS (UPDATE public.books SET title='changed' WHERE id='{BOOK}' RETURNING id) SELECT count(*) FROM edited;"
        scenario('ordinary reader cannot edit catalog', update_book, 0)
        scenario('anonymous reader cannot edit catalog', update_book, 0, anonymous=True)
        scenario('user_metadata cannot grant admin', update_book, 0, spoof=True)
        scenario('trusted admin can edit catalog', update_book, 1, admin=True)
        scenario('public catalog remains readable', 'SELECT count(*) FROM public.books;', 6, anonymous=True)
        scenario('ordinary reader cannot insert catalog', "INSERT INTO public.books(title,author) VALUES ('unauthorized','reader');", denied=True)
        scenario('scroll owner can read progress', f"SELECT count(*) FROM public.book_scroll_depth WHERE id='{SCROLL}';", 1)
        scenario('other reader cannot read progress', f"SELECT count(*) FROM public.book_scroll_depth WHERE id='{SCROLL}';", 0, user=USER_B)
        scenario('other reader cannot change progress', f"WITH changed AS (UPDATE public.book_scroll_depth SET max_depth=90 WHERE id='{SCROLL}' RETURNING id) SELECT count(*) FROM changed;", 0, user=USER_B)
        scenario('progress owner cannot transfer ownership', f"UPDATE public.book_scroll_depth SET user_id='{USER_B}' WHERE id='{SCROLL}';", denied=True)
        print('SUCCESS: 18 authorization scenarios plus bootstrap/migration checks')
    finally:
        docker('rm', '-f', NAME)


if __name__ == '__main__':
    main()
