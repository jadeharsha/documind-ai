import os
import re
from pathlib import Path
from typing import List, Dict, Any

class PageData:
    def __init__(self, page_number: int, text: str, tables: List[Dict[str, Any]] = None):
        self.page_number = page_number
        self.text = text
        self.tables = tables or []

class DocumentExtractor:
    @staticmethod
    def clean_text(text: str) -> str:
        """
        Cleans and normalizes raw extracted text.
        """
        if not text:
            return ""
        # Remove null bytes
        text = text.replace('\x00', '')
        # Normalize excessive whitespace
        text = re.sub(r'[ \t]+', ' ', text)
        text = re.sub(r'\n{3,}', '\n\n', text)
        return text.strip()

    @classmethod
    def extract(cls, file_path: str, file_extension: str) -> Dict[str, Any]:
        """
        Extracts pages and metadata according to file type.
        """
        ext = file_extension.lower().lstrip('.')
        if ext == 'pdf':
            return cls._extract_pdf(file_path)
        elif ext in ('docx', 'doc'):
            return cls._extract_docx(file_path)
        elif ext in ('txt', 'md'):
            return cls._extract_txt(file_path)
        else:
            raise ValueError(f"Unsupported file format: .{ext}")

    @classmethod
    def _extract_pdf(cls, file_path: str) -> Dict[str, Any]:
        pages: List[PageData] = []
        doc_metadata = {}
        total_words = 0

        try:
            import fitz  # PyMuPDF
            doc = fitz.open(file_path)
            doc_metadata = doc.metadata or {}

            for page_index in range(len(doc)):
                page = doc[page_index]
                text = page.get_text("text")
                cleaned = cls.clean_text(text)

                # Optional table extraction from PyMuPDF
                tables = []
                try:
                    tabs = page.find_tables()
                    for t in tabs:
                        tables.append(t.extract())
                except Exception:
                    pass

                total_words += len(cleaned.split())
                pages.append(PageData(
                    page_number=page_index + 1,
                    text=cleaned,
                    tables=tables
                ))
            doc.close()
        except ImportError:
            # Fallback if fitz is not installed in basic environment
            with open(file_path, 'r', errors='ignore') as f:
                content = cls.clean_text(f.read())
                pages.append(PageData(page_number=1, text=content))
                total_words = len(content.split())

        return {
            "pages": pages,
            "page_count": len(pages),
            "word_count": total_words,
            "metadata": doc_metadata
        }

    @classmethod
    def _extract_docx(cls, file_path: str) -> Dict[str, Any]:
        pages: List[PageData] = []
        total_words = 0

        try:
            import docx
            doc = docx.Document(file_path)
            full_text = []

            for para in doc.paragraphs:
                if para.text.strip():
                    full_text.append(para.text.strip())

            # Also extract tables
            tables = []
            for table in doc.tables:
                table_data = []
                for row in table.rows:
                    row_data = [cell.text.strip() for cell in row.cells]
                    table_data.append(row_data)
                tables.append(table_data)

            combined_text = cls.clean_text("\n\n".join(full_text))
            total_words = len(combined_text.split())

            # For DOCX, simulate pages every ~500 words if no native page markers
            words = combined_text.split()
            words_per_page = 500
            if not words:
                pages.append(PageData(page_number=1, text=""))
            else:
                for i in range(0, len(words), words_per_page):
                    page_slice = " ".join(words[i:i + words_per_page])
                    pages.append(PageData(
                        page_number=(i // words_per_page) + 1,
                        text=page_slice,
                        tables=tables if i == 0 else []
                    ))
        except ImportError:
            with open(file_path, 'r', errors='ignore') as f:
                content = cls.clean_text(f.read())
                pages.append(PageData(page_number=1, text=content))
                total_words = len(content.split())

        return {
            "pages": pages,
            "page_count": len(pages),
            "word_count": total_words,
            "metadata": {}
        }

    @classmethod
    def _extract_txt(cls, file_path: str) -> Dict[str, Any]:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = cls.clean_text(f.read())

        words = content.split()
        total_words = len(words)
        words_per_page = 500
        pages: List[PageData] = []

        if not words:
            pages.append(PageData(page_number=1, text=""))
        else:
            for i in range(0, len(words), words_per_page):
                page_slice = " ".join(words[i:i + words_per_page])
                pages.append(PageData(
                    page_number=(i // words_per_page) + 1,
                    text=page_slice
                ))

        return {
            "pages": pages,
            "page_count": len(pages),
            "word_count": total_words,
            "metadata": {}
        }
