"""Shared helpers for the media-search agents (real HTTP search + download).

Only the standard library is used. All sources are free and need no API key,
except the optional Pexels video source (set ``PEXELS_API_KEY``).
"""

import datetime
import json
import os
import re
import urllib.parse
import urllib.request

USER_AGENT = "ORE-Studio/0.1 (https://github.com/anibalelore/orestudio)"
TIMEOUT = 30
MAX_BYTES = 60 * 1024 * 1024  # 60 MB safety cap per file


def get_json(url: str, headers: dict | None = None):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, **(headers or {})})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
        return json.loads(resp.read().decode("utf-8"))


def slug(text: str) -> str:
    return re.sub(r"[^a-zA-Z0-9]+", "_", text).strip("_").lower()[:60] or "media"


def download(url: str, dest_base: str, allowed_mimes: dict, min_bytes: int) -> tuple[str, str, int]:
    """Download *url* to ``dest_base + extension``. Returns (path, mime, size).

    Raises ValueError if the MIME type is not allowed, the file is too small or
    larger than ``MAX_BYTES``.
    """
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
        mime = resp.info().get_content_type()
        if mime not in allowed_mimes:
            raise ValueError(f"Unsupported MIME type: {mime}")
        declared = int(resp.headers.get("Content-Length") or 0)
        if declared > MAX_BYTES:
            raise ValueError(f"File too large ({declared} bytes)")
        content = resp.read(MAX_BYTES + 1)
    if len(content) > MAX_BYTES:
        raise ValueError("File too large")
    if len(content) < min_bytes:
        raise ValueError(f"File too small (<{min_bytes} bytes)")
    path = dest_base + allowed_mimes[mime]
    with open(path, "wb") as f:
        f.write(content)
    return path, mime, len(content)


def write_meta(path: str, **meta) -> None:
    meta.setdefault("downloaded_at", datetime.datetime.now(datetime.timezone.utc).isoformat())
    with open(path + ".meta.json", "w", encoding="utf-8") as mf:
        json.dump(meta, mf, ensure_ascii=False, indent=2)


def quote(text: str) -> str:
    return urllib.parse.quote(text)
