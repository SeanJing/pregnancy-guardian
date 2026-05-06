"""
Ingest a PDF book into Vectorize via the Worker API.

Usage:
    python3.12 scripts/ingest_pdf.py <PDF_PATH> <WORKER_URL>

Example:
    python3.12 scripts/ingest_pdf.py ~/books/pregnancy-book.pdf https://pregnancy-guardian-api.hfjingxiao13.workers.dev
"""

import sys
import os
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

def chunk_text(pages, book_name, chunk_size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
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
                    'id': f'{book_name}_p{page_num}_{chunk_id}',
                    'text': current.strip(),
                    'meta': {'page': page_num, 'source': book_name}
                })
                # Keep overlap
                current = current[-overlap:] + ' ' + para
            else:
                current = current + '\n\n' + para if current else para
        
        if current.strip():
            chunk_id = hashlib.md5(current.encode()).hexdigest()[:12]
            chunks.append({
                'id': f'{book_name}_p{page_num}_{chunk_id}',
                'text': current.strip(),
                'meta': {'page': page_num, 'source': book_name}
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
    if len(sys.argv) < 2:
        print('Usage: python3.12 scripts/ingest_pdf.py <PDF_PATH> <WORKER_URL> [--dry-run] [--chunk-size N]')
        sys.exit(1)

    pdf_path = sys.argv[1]
    args = sys.argv[2:]
    dry_run = '--dry-run' in args
    chunk_size = CHUNK_SIZE
    if '--chunk-size' in args:
        chunk_size = int(args[args.index('--chunk-size') + 1])

    api_url = None
    if not dry_run:
        urls = [a for a in args if a.startswith('http')]
        if not urls:
            print('Error: provide WORKER_URL or use --dry-run')
            sys.exit(1)
        api_url = urls[0].rstrip('/')

    book_name = os.path.splitext(os.path.basename(pdf_path))[0]

    print(f'Extracting text from: {pdf_path} (book: {book_name})')
    pages = extract_text(pdf_path)
    print(f'  {len(pages)} pages extracted')

    print(f'Chunking (size={chunk_size}, overlap={CHUNK_OVERLAP})...')
    chunks = chunk_text(pages, book_name, chunk_size=chunk_size)
    print(f'  {len(chunks)} chunks created')

    if dry_run:
        print(f'\n  Estimated API calls: {(len(chunks) + BATCH_SIZE - 1) // BATCH_SIZE}')
        print(f'  Sample chunk ({len(chunks[0]["text"])} chars):')
        print(f'    {chunks[0]["text"][:200]}...')
        return

    print('Ingesting...')
    ingest(chunks, api_url)

    # Save manifest for future deletion
    manifest_path = f'{pdf_path}.manifest.json'
    ids = [c['id'] for c in chunks]
    with open(manifest_path, 'w') as f:
        json.dump({'source': book_name, 'ids': ids, 'count': len(ids)}, f)
    print(f'  Manifest saved: {manifest_path} ({len(ids)} IDs)')
    print('Done!')

if __name__ == '__main__':
    main()
