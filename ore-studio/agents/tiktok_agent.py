# TikTok Agent

"""TikTok integration agent.

Uses the official TikTok for Developers API (or a suitable wrapper).
Requires environment variables:
- TIKTOK_CLIENT_ID
- TIKTOK_CLIENT_SECRET
- TIKTOK_ACCESS_TOKEN
"""

import os
import requests
from typing import Dict

class TikTokAgent:
    base_url = "https://open-api.tiktok.com"

    def __init__(self):
        self.client_id = os.getenv("TIKTOK_CLIENT_ID")
        self.client_secret = os.getenv("TIKTOK_CLIENT_SECRET")
        self.access_token = os.getenv("TIKTOK_ACCESS_TOKEN")
        if not self.access_token:
            raise EnvironmentError("TIKTOK_ACCESS_TOKEN not set in environment")

    def _auth_headers(self) -> Dict[str, str]:
        return {"Authorization": f"Bearer {self.access_token}"}

    def fetch_metrics(self, video_id: str) -> Dict:
        """Obtener métricas de un video concreto en TikTok."""
        url = f"{self.base_url}/video/data/"
        params = {"video_id": video_id}
        resp = requests.get(url, headers=self._auth_headers(), params=params, timeout=10)
        resp.raise_for_status()
        return resp.json().get("data", {})

    def reply_to_comment(self, comment_id: str, text: str) -> Dict:
        """Publica una respuesta a un comentario existente en TikTok."""
        url = f"{self.base_url}/comment/reply/"
        payload = {"comment_id": comment_id, "text": text}
        resp = requests.post(url, headers=self._auth_headers(), json=payload, timeout=10)
        resp.raise_for_status()
        return resp.json().get("data", {})

    def schedule_post(self, video_path: str, caption: str) -> Dict:
        """Placeholder for uploading and scheduling a TikTok video.
        Real implementation requires multipart upload and a separate scheduling endpoint.
        """
        raise NotImplementedError("TikTok upload & scheduling not implemented yet")
