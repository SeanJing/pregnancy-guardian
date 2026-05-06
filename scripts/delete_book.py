"""
Delete a book's vectors from Vectorize using its manifest file.

Usage:
    python3.12 scripts/delete_book.py <MANIFEST_PATH> <WORKER_URL>

Example:
    python3.12 scripts/delete_book.py src/data/output.pdf.manifest.json https://pregnancy-guardian-api.hfjingxiao13.workers.dev
"""

import sys
import json
import requests

BATCH_SIZE = 50

def main():
    if len(sys.argv) < 3:
        print('Usage: python3.12 scripts/delete_book.py <MANIFEST_PATH> <WORKER_URL>')
        sys.exit(1)

    manifest_path = sys.argv[1]
    api_url = sys.argv[2].rstrip('/')

    with open(manifest_path) as f:
        manifest = json.load(f)

    ids = manifest['ids']
    print(f'Deleting {len(ids)} vectors for book: {manifest["source"]}')

    for i in range(0, len(ids), BATCH_SIZE):
        batch = ids[i:i + BATCH_SIZE]
        res = requests.post(
            f'{api_url}/api/knowledge/delete',
            json={'ids': batch},
            headers={'Content-Type': 'application/json'}
        )
        result = res.json()
        batch_num = i // BATCH_SIZE + 1
        if result.get('ok'):
            print(f'  Batch {batch_num}: ✓ {result["deleted"]} deleted')
        else:
            print(f'  Batch {batch_num}: ✗ {result}')

    print('Done!')

if __name__ == '__main__':
    main()
