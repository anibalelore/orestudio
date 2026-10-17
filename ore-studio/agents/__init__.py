# Init for ore-studio agents package
from .personas import PERSONAS, PLATFORM_AGENT, connections_report
from .interviewer import Interviewer, Brief, ClientProfile
from .platform_playbooks import PLAYBOOKS, study_markdown, build_script
from .pipeline import Pipeline
from .image_reference_agent import ImageReferenceAgent
from .video_meme_agent import VideoMemeAgent

try:  # API agents need the optional `requests` package
    from .tiktok_agent import TikTokAgent
    from .instagram_agent import InstagramAgent
except ImportError:  # pragma: no cover
    TikTokAgent = InstagramAgent = None

__all__ = [
    "PERSONAS",
    "PLATFORM_AGENT",
    "connections_report",
    "Interviewer",
    "Brief",
    "ClientProfile",
    "PLAYBOOKS",
    "study_markdown",
    "build_script",
    "Pipeline",
    "ImageReferenceAgent",
    "VideoMemeAgent",
    "TikTokAgent",
    "InstagramAgent",
]
