import uuid
from typing import List, Dict, Any
from .extractor import PageData

class ChunkMetadata:
    def __init__(
        self,
        chunk_id: str,
        chunk_index: int,
        text: str,
        page_number: int,
        page_start: int,
        page_end: int,
        char_start: int,
        char_end: int
    ):
        self.chunk_id = chunk_id
        self.chunk_index = chunk_index
        self.text = text
        self.page_number = page_number
        self.page_start = page_start
        self.page_end = page_end
        self.char_start = char_start
        self.char_end = char_end

class DocumentChunker:
    def __init__(self, target_chunk_size: int = 600, chunk_overlap: int = 100):
        self.target_chunk_size = target_chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_pages(self, pages: List[PageData]) -> List[ChunkMetadata]:
        """
        Splits extracted pages into chunks while strictly preserving page boundaries
        and exact page citations.
        """
        chunks: List[ChunkMetadata] = []
        global_chunk_index = 0

        for page in pages:
            text = page.text
            if not text.strip():
                continue

            # Split by paragraphs or sentences
            paragraphs = text.split("\n\n")
            current_chunk_words: List[str] = []
            current_char_start = 0

            for para in paragraphs:
                para_words = para.split()
                if not para_words:
                    continue

                if len(current_chunk_words) + len(para_words) <= self.target_chunk_size:
                    current_chunk_words.extend(para_words)
                else:
                    # Flush current chunk
                    if current_chunk_words:
                        chunk_text = " ".join(current_chunk_words)
                        chunk_id = str(uuid.uuid4())
                        chunks.append(ChunkMetadata(
                            chunk_id=chunk_id,
                            chunk_index=global_chunk_index,
                            text=chunk_text,
                            page_number=page.page_number,
                            page_start=page.page_number,
                            page_end=page.page_number,
                            char_start=current_char_start,
                            char_end=current_char_start + len(chunk_text)
                        ))
                        global_chunk_index += 1
                        current_char_start += len(chunk_text)

                        # Carry over overlap
                        overlap_words = current_chunk_words[-self.chunk_overlap:] if len(current_chunk_words) > self.chunk_overlap else []
                        current_chunk_words = overlap_words + para_words
                    else:
                        current_chunk_words = para_words

            # Flush remaining words on this page
            if current_chunk_words:
                chunk_text = " ".join(current_chunk_words)
                chunk_id = str(uuid.uuid4())
                chunks.append(ChunkMetadata(
                    chunk_id=chunk_id,
                    chunk_index=global_chunk_index,
                    text=chunk_text,
                    page_number=page.page_number,
                    page_start=page.page_number,
                    page_end=page.page_number,
                    char_start=current_char_start,
                    char_end=current_char_start + len(chunk_text)
                ))
                global_chunk_index += 1

        return chunks
