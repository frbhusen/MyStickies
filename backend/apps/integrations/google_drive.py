"""Google Drive image sync helpers.

This module is intentionally small at the start of the project. It provides a
clear place to implement service-account based folder syncing and public link
normalization without coupling Drive logic to catalog models.
"""

from dataclasses import dataclass


@dataclass
class DriveImagePayload:
    file_id: str
    file_name: str
    public_url: str
    mime_type: str


def build_public_drive_url(file_id: str) -> str:
    return f"https://drive.google.com/file/d/{file_id}/view"
