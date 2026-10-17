# Search Corpus Script

"""search_corpus.py

Utility to search the ORE Studio corpus for relevant documents.
This is a stub implementation – in a real system it would query a vector store
or a document database. Here we simply scan the local `docs/` directory for
files containing the query string.
"""
import os
import sys

def search(query: str, docs_root: str = "../docs") -> list[str]:
    """Return a list of file paths that contain the query string.
    This naive implementation walks the filesystem and looks for the query
    (case‑insensitive) in each file's text.
    """
    matches = []
    for root, _, files in os.walk(docs_root):
        for f in files:
            if not f.lower().endswith('.md'):
                continue
            path = os.path.join(root, f)
            try:
                with open(path, 'r', encoding='utf-8') as fh:
                    content = fh.read()
                if query.lower() in content.lower():
                    matches.append(path)
            except Exception:
                continue
    return matches

def main():
    if len(sys.argv) < 2:
        print('Usage: python search_corpus.py <query>')
        sys.exit(1)
    query = sys.argv[1]
    results = search(query)
    print('Found %d matching documents:' % len(results))
    for r in results:
        print(' -', r)

if __name__ == '__main__':
    main()
