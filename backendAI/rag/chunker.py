import re
from typing import List, Dict, Any
from .models import PageTextItem


class TextChunk:
    def __init__(
        self,
        chunk_id: str,
        book_id: str,
        book_title: str,
        author: str,
        page_number: int,
        chunk_index: int,
        text: str,
        chapter_title: str = None
    ):
        self.chunk_id = chunk_id
        self.book_id = book_id
        self.book_title = book_title
        self.author = author
        self.page_number = page_number
        self.chunk_index = chunk_index
        self.text = text
        self.chapter_title = chapter_title
        self.char_length = len(text)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "chunk_id": self.chunk_id,
            "book_id": self.book_id,
            "book_title": self.book_title,
            "author": self.author,
            "page_number": self.page_number,
            "chunk_index": self.chunk_index,
            "text": self.text,
            "chapter_title": self.chapter_title,
            "char_length": self.char_length,
        }


class SemanticChunker:
    """
    Page-aware sliding-window chunker designed for digital books and PDFs.
    Maintains strict page-level metadata for spoiler filtering and exact citations.
    """

    def __init__(self, chunk_size: int = 600, chunk_overlap: int = 120):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def clean_text(self, text: str) -> str:
        """Normalize line breaks and multiple spaces."""
        if not text:
            return ""
        # Replace multiple newlines or tabs
        text = re.sub(r'[\r\n]+', '\n', text)
        text = re.sub(r'[ \t]+', ' ', text)
        return text.strip()

    def chunk_page(
        self,
        book_id: str,
        book_title: str,
        author: str,
        page: PageTextItem
    ) -> List[TextChunk]:
        """Split a single page's text into overlapping chunks."""
        cleaned = self.clean_text(page.text)
        if not cleaned:
            return []

        chunks: List[TextChunk] = []

        # If the page content is smaller than chunk_size + overlap, keep as one complete chunk
        if len(cleaned) <= self.chunk_size:
            chunk_id = f"{book_id}_p{page.page_number}_c0"
            chunks.append(
                TextChunk(
                    chunk_id=chunk_id,
                    book_id=book_id,
                    book_title=book_title,
                    author=author,
                    page_number=page.page_number,
                    chunk_index=0,
                    text=cleaned,
                    chapter_title=page.chapter_title
                )
            )
            return chunks

        # Sliding window chunking with sentence/paragraph boundary awareness
        start = 0
        chunk_idx = 0
        step = self.chunk_size - self.chunk_overlap

        while start < len(cleaned):
            end = min(start + self.chunk_size, len(cleaned))
            
            # If not at the end of the text, try to snap to nearest sentence boundary (. or \n)
            if end < len(cleaned):
                # Search for sentence break in the last 60 chars of the window
                boundary_zone = cleaned[max(start, end - 60):min(len(cleaned), end + 40)]
                punct_matches = [m.end() for m in re.finditer(r'[\.\?\!\n]\s+', boundary_zone)]
                if punct_matches:
                    adjusted_end = max(start, end - 60) + punct_matches[-1]
                    if adjusted_end > start + 100:  # Ensure chunk isn't too tiny
                        end = adjusted_end

            chunk_content = cleaned[start:end].strip()
            if chunk_content:
                chunk_id = f"{book_id}_p{page.page_number}_c{chunk_idx}"
                chunks.append(
                    TextChunk(
                        chunk_id=chunk_id,
                        book_id=book_id,
                        book_title=book_title,
                        author=author,
                        page_number=page.page_number,
                        chunk_index=chunk_idx,
                        text=chunk_content,
                        chapter_title=page.chapter_title
                    )
                )
                chunk_idx += 1

            if end >= len(cleaned):
                break
            start += step

        return chunks

    def chunk_document(
        self,
        book_id: str,
        book_title: str,
        author: str,
        pages: List[PageTextItem]
    ) -> List[TextChunk]:
        """Process all pages of a book and return indexed chunks."""
        all_chunks: List[TextChunk] = []
        for page in sorted(pages, key=lambda p: p.page_number):
            page_chunks = self.chunk_page(book_id, book_title, author, page)
            all_chunks.extend(page_chunks)
        return all_chunks
