# Instagram Agent
"""Instagram integration agent.

Uses the Instagram Graph API (or a suitable wrapper).
Requires environment variables:
- INSTAGRAM_APP_ID
- INSTAGRAM_APP_SECRET
- INSTAGRAM_ACCESS_TOKEN
"""

import os
import requests
from typing import Dict

class InstagramAgent:
    base_url = "https://graph.facebook.com/v15.0"

    def __init__(self):
        self.app_id = os.getenv("INSTAGRAM_APP_ID")
        self.app_secret = os.getenv("INSTAGRAM_APP_SECRET")
        self.access_token = os.getenv("INSTAGRAM_ACCESS_TOKEN")
        if not self.access_token:
            raise EnvironmentError("INSTAGRAM_ACCESS_TOKEN not set in environment")

    def _auth_params(self) -> Dict[str, str]:
        return {"access_token": self.access_token}

    def fetch_metrics(self, media_id: str) -> Dict:
        """Obtener métricas de un media (post) en Instagram."""
        url = f"{self.base_url}/{media_id}/insights"
        params = {"metric": "impressions,reach,engagement,saved", **self._auth_params()}
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        return resp.json().get("data", {})

    def reply_to_comment(self, comment_id: str, message: str) -> Dict:
        """Publica una respuesta a un comentario existente en Instagram."""
        url = f"{self.base_url}/{comment_id}/replies"
        payload = {"message": message, **self._auth_params()}
        resp = requests.post(url, data=payload, timeout=10)
        resp.raise_for_status()
        return resp.json()

    def schedule_post(self, image_path: str, caption: str) -> Dict:
        """Placeholder for uploading and scheduling an Instagram post.
        Real implementation requires media container creation and publishing.
        """
        raise NotImplementedError("Instagram upload & scheduling not implemented yet")
