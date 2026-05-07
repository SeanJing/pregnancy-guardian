"""
Ingest weekly pregnancy articles into Vectorize.

Usage:
    python3.12 scripts/ingest_weeks.py <WORKER_URL>

Example:
    python3.12 scripts/ingest_weeks.py https://pregnancy-guardian-api.hfjingxiao13.workers.dev
"""

import sys
import os
import json
import hashlib
import requests

BATCH_SIZE = 50
CHUNK_SIZE = 800
OVERLAP = 100
WEEKS_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'pregnancy_week_by_week')

def chunk_text(text, source, week, chunk_size=CHUNK_SIZE, overlap=OVERLAP):
    chunks = []
    paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
    current = ''
    for para in paragraphs:
        if len(current) + len(para) > chunk_size and current:
            chunk_id = hashlib.md5(current.encode()).hexdigest()[:12]
            chunks.append({
                'id': f'{source}_w{week}_{chunk_id}',
                'text': current.strip(),
                'meta': {'week': week, 'source': source}
            })
            current = current[-overlap:] + ' ' + para
        else:
            current = current + '\n\n' + para if current else para
    if current.strip():
        chunk_id = hashlib.md5(current.encode()).hexdigest()[:12]
        chunks.append({
            'id': f'{source}_w{week}_{chunk_id}',
            'text': current.strip(),
            'meta': {'week': week, 'source': source}
        })
    return chunks

def main():
    if len(sys.argv) < 2:
        print('Usage: python3.12 scripts/ingest_weeks.py <WORKER_URL>')
        sys.exit(1)

    api_url = sys.argv[1].rstrip('/')
    source = 'americanpregnancy'
    all_chunks = []

    for f in sorted(os.listdir(WEEKS_DIR)):
        if not f.endswith('.md'):
            continue
        week = ''.join(c for c in f.replace('.md', '').split('_')[-1] if c.isdigit()) or '1'
        text = open(os.path.join(WEEKS_DIR, f)).read()
        chunks = chunk_text(text, source, int(week))
        all_chunks.extend(chunks)
        print(f'  {f}: {len(chunks)} chunks')

    print(f'\nTotal: {len(all_chunks)} chunks')
    print('Ingesting...')

    for i in range(0, len(all_chunks), BATCH_SIZE):
        batch = all_chunks[i:i + BATCH_SIZE]
        res = requests.post(f'{api_url}/api/knowledge/ingest', json={'chunks': batch}, headers={'Content-Type': 'application/json'})
        result = res.json()
        batch_num = i // BATCH_SIZE + 1
        print(f'  Batch {batch_num}: {"✓" if result.get("ok") else "✗"} {result.get("count", result)}')

    # Save manifest
    manifest = {'source': source, 'ids': [c['id'] for c in all_chunks], 'count': len(all_chunks)}
    manifest_path = os.path.join(WEEKS_DIR, f'{source}.manifest.json')
    json.dump(manifest, open(manifest_path, 'w'))
    print(f'\nManifest saved: {manifest_path}')
    print('Done!')

if __name__ == '__main__':
    main()
