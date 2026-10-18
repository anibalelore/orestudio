# Image Reference Agent

"""Searches for reference images related to a topic and downloads them for use
in video projects.

Sources (free, no API key):
  1. Openverse (Creative Commons images, commercial-use licenses by default)
  2. Wikimedia Commons (fallback)

Every downloaded file gets a ``.meta.json`` side-car with the real source URL,
license, author and page, so attribution can be honored.
"""

import os

try:  # package import
    from . import _media as m
except ImportError:  # direct script import
    import _media as m

ALLOWED = {"image/jpeg": ".jpg", "image/png": ".png", "image/gif": ".gif", "image/webp": ".webp"}


class ImageReferenceAgent:
    def __init__(self, download_dir: str = "assets/images", commercial_only: bool = True):
        self.download_dir = download_dir
        self.commercial_only = commercial_only
        os.makedirs(self.download_dir, exist_ok=True)

    def _search_openverse(self, query: str, n: int) -> list[dict]:
        url = f"https://api.openverse.org/v1/images/?q={m.quote(query)}&page_size={n * 2}"
        if self.commercial_only:
            url += "&license_type=commercial"
        out = []
        for r in m.get_json(url).get("results", []):
            out.append({
                "url": r["url"],
                "license": f"CC {r.get('license', '').upper()} {r.get('license_version', '')}".strip(),
                "author": r.get("creator"),
                "page": r.get("foreign_landing_url"),
                "title": r.get("title"),
                "source": "openverse",
            })
        return out

    def _search_wikimedia(self, query: str, n: int) -> list[dict]:
        url = ("https://commons.wikimedia.org/w/api.php?action=query&generator=search"
               f"&gsrsearch={m.quote(query + ' filetype:bitmap')}&gsrnamespace=6&gsrlimit={n * 2}"
               "&prop=imageinfo&iiprop=url|mime|extmetadata&format=json")
        pages = m.get_json(url).get("query", {}).get("pages", {})
        out = []
        for p in pages.values():
            info = p["imageinfo"][0]
            meta = info.get("extmetadata", {})
            out.append({
                "url": info["url"],
                "license": meta.get("LicenseShortName", {}).get("value", "unknown"),
                "author": meta.get("Artist", {}).get("value"),
                "page": info.get("descriptionurl"),
                "title": p.get("title"),
                "source": "wikimedia",
            })
        return out

    def search_and_download(self, query: str, max_results: int = 5) -> list[str]:
        """Searches images matching *query* and downloads up to *max_results*.
        Returns a list of local file paths. Each image is validated for MIME type
        (JPEG, PNG, GIF, WebP) and minimum size (1 KB). A side-car JSON file
        records the real source URL, license, author and download timestamp.
        """
        candidates: list[dict] = []
        for search in (self._search_openverse, self._search_wikimedia):
            try:
                candidates += search(query, max_results)
            except Exception as e:
                print(f"[ImageReferenceAgent] {search.__name__} failed: {e}")
            if len(candidates) >= max_results:
                break

        downloaded = []
        for c in candidates:
            if len(downloaded) >= max_results:
                break
            base = os.path.join(self.download_dir, f"{m.slug(query)}_{len(downloaded) + 1}")
            try:
                path, mime, size = m.download(c["url"], base, ALLOWED, 1024)
                m.write_meta(path, source_url=c["url"], license=c["license"], author=c["author"],
                             source_page=c["page"], title=c["title"], source=c["source"],
                             mime_type=mime, size_bytes=size, query=query)
                downloaded.append(path)
            except Exception as e:
                print(f"[ImageReferenceAgent] Failed to download {c['url']}: {e}")
        return downloaded
