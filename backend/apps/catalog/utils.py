from urllib.parse import parse_qs, urlparse


GOOGLE_DRIVE_HOSTS = {
    "drive.google.com",
    "www.drive.google.com",
}


def extract_google_drive_file_id(url: str) -> str:
    if not url:
        return ""

    parsed = urlparse(url)
    host = parsed.netloc.lower()
    if host not in GOOGLE_DRIVE_HOSTS:
        return ""

    parts = [p for p in parsed.path.split("/") if p]

    # /file/d/<id>/view
    if len(parts) >= 3 and parts[0] == "file" and parts[1] == "d":
        return parts[2]

    # /open?id=<id> or /uc?id=<id>
    query_id = parse_qs(parsed.query).get("id", [""])[0]
    return query_id


def normalize_image_url(url: str) -> str:
    value = (url or "").strip()
    if not value:
        return ""

    file_id = extract_google_drive_file_id(value)
    if not file_id:
        return value

    return f"https://lh3.googleusercontent.com/d/{file_id}"
