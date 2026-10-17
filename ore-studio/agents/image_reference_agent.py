# Image Reference Agent

"""Searches for reference images and downloads them for use in video projects.
Uses a placeholder image‑search implementation (replace with real API in production).
"""

import os
import urllib.request

class ImageReferenceAgent:
    def __init__(self, download_dir: str = "assets/images"):
        self.download_dir = download_dir
        os.makedirs(self.download_dir, exist_ok=True)

    def search_and_download(self, query: str, max_results: int = 5) -> list[str]:
        """Searches for images matching *query* and downloads up to *max_results*.
        Returns a list of local file paths. Each image is validated for MIME type
        (JPEG, PNG, GIF) and minimum size (1 KB). A side‑car JSON file records the
        source URL, assumed license (CC0 for placeholder), and download timestamp.
        """
        # Placeholder URLs – replace with a real image‑search API in production.
        dummy_urls = [
            f"https://example.com/{query.replace(' ', '_')}_{i}.jpg"
            for i in range(1, max_results + 1)
        ]
        downloaded = []
        for idx, url in enumerate(dummy_urls, 1):
            filename = os.path.join(self.download_dir, f"{query.replace(' ', '_')}_{idx}.jpg")
            try:
                with urllib.request.urlopen(url, timeout=10) as resp:
                    mime = resp.info().get_content_type()
                    if mime not in ("image/jpeg", "image/png", "image/gif"):
                        raise ValueError(f"Unsupported MIME type: {mime}")
                    content = resp.read()
                    if len(content) < 1024:
                        raise ValueError("Image too small (under 1 KB)")
                    with open(filename, "wb") as f:
                        f.write(content)
                    # Write metadata side‑car JSON
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
                print(f"[ImageReferenceAgent] Failed to download {url}: {e}")
        return downloaded
