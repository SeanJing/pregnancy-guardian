"""
Extract main content from a URL and save as markdown.

Usage:
    python3.12 scripts/extract_url.py <URL> [--output FILE]

Examples:
    python3.12 scripts/extract_url.py "https://example.com/article"
    python3.12 scripts/extract_url.py "https://example.com/article" --output content.md

Requires: pip install requests beautifulsoup4 markdownify
"""

import sys
import re
import requests
from bs4 import BeautifulSoup
from markdownify import markdownify as md

def extract(url):
    """Fetch URL and extract main content as markdown."""
    res = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=30)
    res.raise_for_status()
    soup = BeautifulSoup(res.text, 'html.parser')

    # Remove non-content elements
    for tag in soup(['script', 'style', 'nav', 'header', 'footer', 'aside', 'iframe', 'form', 'noscript']):
        tag.decompose()

    # Try to find main content area
    main = soup.find('main') or soup.find('article') or soup.find('div', class_=re.compile(r'content|article|post|entry'))
    content = main if main else soup.body

    if not content:
        return ''

    # Convert to markdown
    text = md(str(content), heading_style='ATX', strip=['img', 'a'])
    # Clean up excessive whitespace
    text = re.sub(r'\n{3,}', '\n\n', text).strip()
    # Strip everything after Sources/References section
    text = re.split(r'\n#+\s*(Sources|References|Bibliography|Works Cited)', text, flags=re.IGNORECASE)[0].strip()
    return text

def main():
    if len(sys.argv) < 2:
        print('Usage: python3.12 scripts/extract_url.py <URL> [--output FILE]')
        sys.exit(1)

    url = sys.argv[1]
    output = None
    if '--output' in sys.argv:
        output = sys.argv[sys.argv.index('--output') + 1]

    print(f'Fetching: {url}')
    text = extract(url)
    print(f'Extracted: {len(text)} characters\n')

    if output:
        with open(output, 'w') as f:
            f.write(text)
        print(f'Saved to: {output}')
    else:
        print(text[:2000])
        if len(text) > 2000:
            print(f'\n... ({len(text) - 2000} more characters, use --output to save full content)')

if __name__ == '__main__':
    main()
