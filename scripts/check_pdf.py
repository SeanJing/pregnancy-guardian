"""
Check OCR quality of a PDF. Shows text length and sample for several pages.

Usage:
    python3 scripts/check_pdf.py <PDF_PATH>
"""

import sys
import fitz

def main():
    if len(sys.argv) < 2:
        print('Usage: python3 scripts/check_pdf.py <PDF_PATH>')
        sys.exit(1)

    doc = fitz.open(sys.argv[1])
    total_pages = len(doc)
    total_chars = 0
    empty_pages = 0

    print(f'Total pages: {total_pages}\n')
    print(f'{"Page":<6} {"Chars":<8} {"Sample"}')
    print('-' * 70)

    # Sample pages evenly across the book
    sample_indices = [0, 5, 10, 20, 50, 100, 150, 200, 300, total_pages - 1]
    sample_indices = [i for i in sample_indices if i < total_pages]

    for i in sample_indices:
        text = doc[i].get_text().strip()
        total_chars += len(text)
        if len(text) < 10:
            empty_pages += 1
        sample = text[:60].replace('\n', ' ') if text else '(empty)'
        print(f'{i+1:<6} {len(text):<8} {sample}')

    # Stats for all pages
    all_chars = [len(doc[i].get_text().strip()) for i in range(total_pages)]
    total_chars = sum(all_chars)
    empty_pages = sum(1 for c in all_chars if c < 10)

    print(f'\n--- Summary ---')
    print(f'Total characters: {total_chars:,}')
    print(f'Avg chars/page:   {total_chars // total_pages:,}')
    print(f'Empty pages:      {empty_pages}/{total_pages}')
    print(f'Quality:          {"GOOD" if total_chars // total_pages > 200 else "POOR - consider re-OCR"}')

    doc.close()

if __name__ == '__main__':
    main()
