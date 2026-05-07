"""
Ingest an EPUB book into Vectorize.

Usage:
    python3.12 scripts/ingest_epub.py <EPUB_PATH> <WORKER_URL> [--dry-run] [--chunk-size N]

Requires: pip install ebooklib beautifulsoup4 requests
"""

import sys
import os
import json
import hashlib
import requests
import ebooklib
from ebooklib import epub
from bs4 import BeautifulSoup

CHUNK_SIZE = 800
OVERLAP = 100
BATCH_SIZE = 50

def extract_text(epub_path):
    """Extract text from EPUB, chapter by chapter."""
    book = epub.read_epub(epub_path)
    chapters = []
    for item in book.get_items_of_type(ebooklib.ITEM_DOCUMENT):
        soup = BeautifulSoup(item.get_content(), 'html.parser')
        text = soup.get_text(separator='\n').strip()
        if len(text) > 50:
            chapters.append(text)
    return chapters

def chunk_text(chapters, book_name):
    """Split chapters into overlapping chunks."""
    chunks = []
    for ch_num, text in enumerate(chapters, 1):
        paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
        current = ''
        for para in paragraphs:
            if len(current) + len(para) > CHUNK_SIZE and current:
                chunk_id = hashlib.md5(current.encode()).hexdigest()[:12]
                chunks.append({
                    'id': f'{book_name}_ch{ch_num}_{chunk_id}',
                    'text': current.strip(),
                    'meta': {'chapter': ch_num, 'source': book_name}
                })
                current = current[-OVERLAP:] + ' ' + para
            else:
                current = current + '\n\n' + para if current else para
        if current.strip():
            chunk_id = hashlib.md5(current.encode()).hexdigest()[:12]
            chunks.append({
                'id': f'{book_name}_ch{ch_num}_{chunk_id}',
                'text': current.strip(),
                'meta': {'chapter': ch_num, 'source': book_name}
            })
    return chunks

def ingest(chunks, api_url):
    for i in range(0, len(chunks), BATCH_SIZE):
        batch = chunks[i:i + BATCH_SIZE]
        res = requests.post(f'{api_url}/api/knowledge/ingest', json={'chunks': batch}, headers={'Content-Type': 'application/json'})
        result = res.json()
        print(f'  Batch {i // BATCH_SIZE + 1}: {"✓" if result.get("ok") else "✗"} {result.get("count", result)}')

def main():
    if len(sys.argv) < 2:
        print('Usage: python3.12 scripts/ingest_epub.py <EPUB_PATH> <WORKER_URL> [--dry-run] [--chunk-size N]')
        sys.exit(1)

    epub_path = sys.argv[1]
    args = sys.argv[2:]
    dry_run = '--dry-run' in args

    global CHUNK_SIZE
    if '--chunk-size' in args:
        CHUNK_SIZE = int(args[args.index('--chunk-size') + 1])

    api_url = None
    if not dry_run:
        urls = [a for a in args if a.startswith('http')]
        if not urls:
            print('Error: provide WORKER_URL or use --dry-run')
            sys.exit(1)
        api_url = urls[0].rstrip('/')

    book_name = os.path.splitext(os.path.basename(epub_path))[0]

    print(f'Extracting: {epub_path} (book: {book_name})')
    chapters = extract_text(epub_path)
    print(f'  {len(chapters)} chapters extracted')

    print(f'Chunking (size={CHUNK_SIZE}, overlap={OVERLAP})...')
    chunks = chunk_text(chapters, book_name)
    print(f'  {len(chunks)} chunks created')

    if dry_run:
        print(f'\n  Estimated API calls: {(len(chunks) + BATCH_SIZE - 1) // BATCH_SIZE}')
        print(f'  Sample chunk ({len(chunks[0]["text"])} chars):')
        print(f'    {chunks[0]["text"][:200]}...')
        return

    print('Ingesting...')
    ingest(chunks, api_url)

    manifest_path = f'{epub_path}.manifest.json'
    json.dump({'source': book_name, 'ids': [c['id'] for c in chunks], 'count': len(chunks)}, open(manifest_path, 'w'))
    print(f'  Manifest saved: {manifest_path}')
    print('Done!')

if __name__ == '__main__':
    main()
