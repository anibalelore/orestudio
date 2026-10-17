# Video Meme Agent

"""Searches for trending meme videos and downloads them for inclusion in projects.
Uses a placeholder implementation; replace with a real API (e.g., TikTok, YouTube) in production.
"""

import os
import urllib.request

class VideoMemeAgent:
    def __init__(self, download_dir: str = "assets/videos"):
        self.download_dir = download_dir
        os.makedirs(self.download_dir, exist_ok=True)

    def fetch_trending(self, max_results: int = 5) -> list[str]:
        """Fetches URLs of trending meme videos, downloads them, validates format
        (MP4, WebM, MOV) and size (>10 KB). Creates a side‑car JSON file storing
        source URL, assumed license (CC0), download timestamp, MIME type and size.
        Returns a list of local file paths for the successfully downloaded videos."""
        # Placeholder URLs – replace with real API (TikTok, YouTube) in production.
        dummy_urls = [
            f"https://example.com/trending_meme_{i}.mp4"
            for i in range(1, max_results + 1)
        ]
        downloaded = []
        for idx, url in enumerate(dummy_urls, 1):
            filename = os.path.join(self.download_dir, f"trending_meme_{idx}.mp4")
            try:
                with urllib.request.urlopen(url, timeout=10) as resp:
                    mime = resp.info().get_content_type()
                    if mime not in ("video/mp4", "video/webm", "video/quicktime"):
                        raise ValueError(f"Unsupported video MIME type: {mime}")
                    content = resp.read()
                    if len(content) < 10 * 1024:
                        raise ValueError("Video file too small (<10 KB)")
                    with open(filename, "wb") as f:
                        f.write(content)
                    meta = {
                        "source_url": url,
                        "license": "CC0",
                        "downloaded_at": __import__("datetime").datetime.utcnow().isoformat() + "Z",
                        "mime_type": mime,
                        "size_bytes": len(content),
                    }
                    meta_path = filename + ".meta.json"
                    with open(meta_path, "w", encoding="utf-8") as mf:
                        import json; json.dump(meta, mf, ensure_ascii=False, indent=2)
                    downloaded.append(filename)
            except Exception as e:
                print(f"[VideoMemeAgent] Failed to download {url}: {e}")
        return downloaded
