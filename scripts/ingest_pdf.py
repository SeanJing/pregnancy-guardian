"""
Ingest a PDF book into Vectorize via the Worker API.

Usage:
    python3.12 scripts/ingest_pdf.py <PDF_PATH> <WORKER_URL>

Example:
    python3.12 scripts/ingest_pdf.py ~/books/pregnancy-book.pdf https://pregnancy-guardian-api.hfjingxiao13.workers.dev
"""

import sys
import json
import hashlib
import requests
import fitz  # PyMuPDF

CHUNK_SIZE = 800  # characters per chunk
CHUNK_OVERLAP = 100  # overlap between chunks
BATCH_SIZE = 50  # vectors per API call

def extract_text(pdf_path):
    """Extract all text from PDF, page by page."""
    doc = fitz.open(pdf_path)
    pages = []
    for i, page in enumerate(doc):
        text = page.get_text().strip()
        if text:
            pages.append((i + 1, text))
    doc.close()
    return pages

def chunk_text(pages, chunk_size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
    """Split pages into overlapping chunks."""
    chunks = []
    for page_num, text in pages:
        # Split into paragraphs first
        paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
        
        current = ''
        for para in paragraphs:
            if len(current) + len(para) > chunk_size and current:
                chunk_id = hashlib.md5(current.encode()).hexdigest()[:12]
                chunks.append({
                    'id': f'book_p{page_num}_{chunk_id}',
                    'text': current.strip(),
                    'meta': {'page': page_num, 'source': 'book'}
                })
                # Keep overlap
                current = current[-overlap:] + ' ' + para
            else:
                current = current + '\n\n' + para if current else para
        
        if current.strip():
            chunk_id = hashlib.md5(current.encode()).hexdigest()[:12]
            chunks.append({
                'id': f'book_p{page_num}_{chunk_id}',
                'text': current.strip(),
                'meta': {'page': page_num, 'source': 'book'}
            })
    return chunks

def ingest(chunks, api_url):
    """Send chunks to the Worker API in batches."""
    total = len(chunks)
    for i in range(0, total, BATCH_SIZE):
        batch = chunks[i:i + BATCH_SIZE]
        res = requests.post(
            f'{api_url}/api/knowledge/ingest',
            json={'chunks': batch},
            headers={'Content-Type': 'application/json'}
        )
        result = res.json()
        batch_num = i // BATCH_SIZE + 1
        if result.get('ok'):
            print(f'  Batch {batch_num}: ✓ {result["count"]} chunks')
        else:
            print(f'  Batch {batch_num}: ✗ {result}')

def main():
    if len(sys.argv) < 3:
        print('Usage: python3.12 scripts/ingest_pdf.py <PDF_PATH> <WORKER_URL>')
        sys.exit(1)

    pdf_path = sys.argv[1]
    api_url = sys.argv[2].rstrip('/')

    print(f'Extracting text from: {pdf_path}')
    pages = extract_text(pdf_path)
    print(f'  {len(pages)} pages extracted')

    print('Chunking...')
    chunks = chunk_text(pages)
    print(f'  {len(chunks)} chunks created (size={CHUNK_SIZE}, overlap={CHUNK_OVERLAP})')

    print('Ingesting...')
    ingest(chunks, api_url)
    print('Done!')

if __name__ == '__main__':
    main()
