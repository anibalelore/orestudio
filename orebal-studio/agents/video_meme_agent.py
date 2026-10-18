# Video Meme Agent

"""Finds videos and humor/meme media related to a topic and downloads them for
inclusion in projects.

Sources:
  * Videos: Pexels (if ``PEXELS_API_KEY`` is set) and Wikimedia Commons (no key).
  * Humor / memes: meme-api.com (images and GIFs from a subreddit, no key).

Every downloaded file gets a ``.meta.json`` side-car with the real source URL,
license (when known) and attribution. Meme licenses are NOT verified: they come
from social platforms, so review rights before commercial use.
"""

import os

try:  # package import
    from . import _media as m
except ImportError:  # direct script import
    import _media as m

VIDEO_MIMES = {"video/mp4": ".mp4", "video/webm": ".webm", "video/quicktime": ".mov", "application/ogg": ".ogv", "video/ogg": ".ogv"}
MEME_MIMES = {"image/jpeg": ".jpg", "image/png": ".png", "image/gif": ".gif", "image/webp": ".webp"}


class VideoMemeAgent:
    def __init__(self, download_dir: str = "assets/videos"):
        self.download_dir = download_dir
        os.makedirs(self.download_dir, exist_ok=True)

    # ---- videos -------------------------------------------------------
    def _search_pexels(self, query: str, n: int) -> list[dict]:
        key = os.environ.get("PEXELS_API_KEY")
        if not key:
            return []
        data = m.get_json(f"https://api.pexels.com/videos/search?query={m.quote(query)}&per_page={n * 2}",
                          headers={"Authorization": key})
        out = []
        for v in data.get("videos", []):
            files = [f for f in v.get("video_files", []) if f.get("file_type") == "video/mp4"]
            if not files:
                continue
            best = min(files, key=lambda f: abs((f.get("width") or 0) - 1280))
            out.append({"url": best["link"], "license": "Pexels License", "author": v.get("user", {}).get("name"),
                        "page": v.get("url"), "source": "pexels"})
        return out

    def _search_wikimedia(self, query: str, n: int) -> list[dict]:
        url = ("https://commons.wikimedia.org/w/api.php?action=query&generator=search"
               f"&gsrsearch={m.quote('filetype:video ' + query)}&gsrnamespace=6&gsrlimit={n * 2}"
               "&prop=imageinfo&iiprop=url|mime|size|extmetadata&format=json")
        out = []
        for p in m.get_json(url).get("query", {}).get("pages", {}).values():
            info = p["imageinfo"][0]
            if info.get("size", 0) > m.MAX_BYTES:
                continue
            meta = info.get("extmetadata", {})
            out.append({"url": info["url"], "license": meta.get("LicenseShortName", {}).get("value", "unknown"),
                        "author": meta.get("Artist", {}).get("value"), "page": info.get("descriptionurl"),
                        "source": "wikimedia"})
        return out

    def search_videos(self, query: str, max_results: int = 3) -> list[str]:
        """Searches topic-related videos, downloads and validates them (MP4, WebM,
        MOV, OGV; >10 KB). Returns local file paths."""
        candidates: list[dict] = []
        for search in (self._search_pexels, self._search_wikimedia):
            try:
                candidates += search(query, max_results)
            except Exception as e:
                print(f"[VideoMemeAgent] {search.__name__} failed: {e}")
            if len(candidates) >= max_results:
                break
        return self._download_all(candidates, f"{m.slug(query)}", VIDEO_MIMES, 10 * 1024, max_results, query)

    # ---- humor / memes ------------------------------------------------
    def fetch_memes(self, subreddit: str = "memes", max_results: int = 5) -> list[str]:
        """Downloads funny images/GIFs from a subreddit via meme-api.com. Use a
        subreddit related to the topic (e.g. 'ProgrammerHumor', 'marketingmemes',
        'wholesomememes')."""
        data = m.get_json(f"https://meme-api.com/gimme/{m.quote(subreddit)}/{min(max_results * 2, 50)}")
        candidates = [{"url": x["url"], "license": "unverified (Reddit user content)", "author": x.get("author"),
                       "page": x.get("postLink"), "source": f"reddit/r/{x.get('subreddit', subreddit)}"}
                      for x in data.get("memes", []) if not x.get("nsfw")]
        return self._download_all(candidates, f"meme_{m.slug(subreddit)}", MEME_MIMES, 1024, max_results, subreddit)

    def fetch_trending(self, max_results: int = 5) -> list[str]:
        """Kept for backward compatibility: downloads trending memes from r/memes."""
        return self.fetch_memes("memes", max_results)

    # ---- shared -------------------------------------------------------
    def _download_all(self, candidates, prefix, mimes, min_bytes, limit, query) -> list[str]:
        downloaded = []
        for c in candidates:
            if len(downloaded) >= limit:
                break
            base = os.path.join(self.download_dir, f"{prefix}_{len(downloaded) + 1}")
            try:
                path, mime, size = m.download(c["url"], base, mimes, min_bytes)
                m.write_meta(path, source_url=c["url"], license=c["license"], author=c["author"],
                             source_page=c["page"], source=c["source"], mime_type=mime,
                             size_bytes=size, query=query)
                downloaded.append(path)
            except Exception as e:
                print(f"[VideoMemeAgent] Failed to download {c['url']}: {e}")
        return downloaded
