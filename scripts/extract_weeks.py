"""
Extract all weekly pregnancy articles from americanpregnancy.org.

Usage:
    python3.12 scripts/extract_weeks.py [--output-dir DIR]

Default output: src/data/weeks/
"""

import sys
import os
import time
from extract_url import extract

URLS = [
    ('week_1_2', 'https://americanpregnancy.org/pregnancy/pregnancy-week-1-2/'),
] + [
    (f'week_{n}', f'https://americanpregnancy.org/pregnancy/{n}-weeks-pregnant/')
    for n in range(3, 41)
]

def main():
    output_dir = 'src/data/weeks'
    if '--output-dir' in sys.argv:
        output_dir = sys.argv[sys.argv.index('--output-dir') + 1]

    os.makedirs(output_dir, exist_ok=True)

    for name, url in URLS:
        path = os.path.join(output_dir, f'{name}.md')
        if os.path.exists(path):
            print(f'  Skip (exists): {name}')
            continue
        print(f'  Fetching: {name} ...')
        try:
            text = extract(url)
            with open(path, 'w') as f:
                f.write(text)
            print(f'    ✓ {len(text)} chars')
        except Exception as e:
            print(f'    ✗ {e}')
        time.sleep(1)  # be polite

    print(f'\nDone! Files saved to {output_dir}/')

if __name__ == '__main__':
    main()
