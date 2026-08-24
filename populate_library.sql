-- ==========================================================
-- NextChapter - Complete Digital Library Seed Data (Self-Hosted PDFs & HD Covers)
-- Run this script in your Supabase SQL Editor to populate 16 classic books
-- ==========================================================

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
    'The Metamorphosis',
    'Franz Kafka',
    'A profound existential novella following Gregor Samsa, who awakens one morning transformed into an enormous insect.',
    ARRAY['Fiction', 'Classic', 'Philosophy', 'Psychological'],
    'https://www.gutenberg.org/cache/epub/5200/pg5200.cover.medium.jpg',
    '/pdfs/the-metamorphosis.pdf',
    4.55, 195, 620, 85, 1915
),
(
    '77777777-7777-7777-7777-777777777777',
    'The Picture of Dorian Gray',
    'Oscar Wilde',
    'A philosophical novel examining hedonism, aestheticism, and the moral corruption of a young aristocrat whose portrait ages in his place.',
    ARRAY['Classic', 'Gothic', 'Philosophy', 'Drama'],
    'https://www.gutenberg.org/cache/epub/174/pg174.cover.medium.jpg',
    '/pdfs/the-picture-of-dorian-gray.pdf',
    4.82, 380, 1420, 254, 1890
),
(
    '88888888-8888-8888-8888-888888888888',
    'Jane Eyre',
    'Charlotte Brontë',
    'An orphaned governess navigates hardship, social class, and deep moral conviction while developing a stormy bond with the brooding Edward Rochester.',
    ARRAY['Classic', 'Romance', 'Drama', 'Gothic'],
    'https://www.gutenberg.org/cache/epub/1260/pg1260.cover.medium.jpg',
    '/pdfs/jane-eyre.pdf',
    4.80, 310, 1150, 480, 1847
),
(
    '99999999-9999-9999-9999-999999999999',
    'A Tale of Two Cities',
    'Charles Dickens',
    'Set in London and Paris during the brutality of the French Revolution, exploring themes of resurrection, sacrifice, and tyranny.',
    ARRAY['Classic', 'Historical', 'Drama', 'Fiction'],
    'https://www.gutenberg.org/cache/epub/98/pg98.cover.medium.jpg',
    '/pdfs/a-tale-of-two-cities.pdf',
    4.62, 275, 890, 370, 1859
),
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'The Time Machine',
    'H.G. Wells',
    'The pioneer of time travel fiction, following a Victorian inventor who voyages into the year 802,701 AD and discovers the split destiny of mankind.',
    ARRAY['Science Fiction', 'Adventure', 'Classic'],
    'https://www.gutenberg.org/cache/epub/35/pg35.cover.medium.jpg',
    '/pdfs/the-time-machine.pdf',
    4.70, 330, 1280, 118, 1895
),
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'The War of the Worlds',
    'H.G. Wells',
    'A terrifying chronicle of an alien invasion from Mars that devastates southern England with heat rays and tripods.',
    ARRAY['Science Fiction', 'Thriller', 'Horror', 'Classic'],
    'https://www.gutenberg.org/cache/epub/36/pg36.cover.medium.jpg',
    '/pdfs/the-war-of-the-worlds.pdf',
    4.66, 310, 1190, 192, 1898
),
(
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Moby-Dick; or, The Whale',
    'Herman Melville',
    'Captain Ahab''s obsessive, monomaniacal pursuit of the legendary white whale across the world''s oceans.',
    ARRAY['Classic', 'Adventure', 'Literature', 'Drama'],
    'https://www.gutenberg.org/cache/epub/2701/pg2701.cover.medium.jpg',
    '/pdfs/moby-dick.pdf',
    4.60, 295, 990, 635, 1851
),
(
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'Crime and Punishment',
    'Fyodor Dostoevsky',
    'A gripping psychological examination of guilt, morality, and redemption centered on impoverished ex-student Rodion Raskolnikov in St. Petersburg.',
    ARRAY['Classic', 'Psychological', 'Philosophy', 'Crime'],
    'https://www.gutenberg.org/cache/epub/2554/pg2554.cover.medium.jpg',
    '/pdfs/crime-and-punishment.pdf',
    4.91, 510, 2200, 545, 1866
),
(
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'The Strange Case of Dr. Jekyll and Mr. Hyde',
    'Robert Louis Stevenson',
    'A dark exploration of the dual nature of man and the conflict between good and evil residing in a single human soul.',
    ARRAY['Horror', 'Mystery', 'Gothic', 'Psychological'],
    'https://www.gutenberg.org/cache/epub/43/pg43.cover.medium.jpg',
    '/pdfs/the-strange-case-of-dr-jekyll-and-mr-hyde.pdf',
    4.74, 340, 1410, 141, 1886
),
(
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'Little Women',
    'Louisa May Alcott',
    'The heartwarming journey of the four March sisters—Meg, Jo, Beth, and Amy—growing up in 19th-century New England.',
    ARRAY['Classic', 'Drama', 'Family', 'Romance'],
    'https://www.gutenberg.org/cache/epub/514/pg514.cover.medium.jpg',
    '/pdfs/little-women.pdf',
    4.77, 360, 1600, 449, 1868
),
(
    '10101010-1010-1010-1010-101010101010',
    'The Adventures of Tom Sawyer',
    'Mark Twain',
    'The classic tale of a mischievous young boy growing up along the Mississippi River in the 1840s.',
    ARRAY['Classic', 'Adventure', 'Humor', 'Fiction'],
    'https://www.gutenberg.org/cache/epub/74/pg74.cover.medium.jpg',
    '/pdfs/the-adventures-of-tom-sawyer.pdf',
    4.75, 390, 1750, 219, 1876
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    author = EXCLUDED.author,
    description = EXCLUDED.description,
    genres = EXCLUDED.genres,
    cover_url = EXCLUDED.cover_url,
    file_url = EXCLUDED.file_url,
    rating = EXCLUDED.rating,
    total_ratings = EXCLUDED.total_ratings,
    total_reads = EXCLUDED.total_reads,
    pages = EXCLUDED.pages,
    published_year = EXCLUDED.published_year;
