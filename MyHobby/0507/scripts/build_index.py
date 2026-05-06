#!/usr/bin/env python3
"""
build_index.py — 미디어 폴더를 스캔해서 data/index.json 을 생성합니다.

폴더 구조 규칙
─────────────────────────────────────────────
media/
  freediving/<country-slug>/<location-slug>/<YYYY-MM-DD>_<point-slug>_<NNN>.<ext>
  stamps/<country-slug>/<YYYY>_<theme-slug>.<ext>
  coins/<country-slug>/<YYYY>_<denomination>.<ext>

또한 각 폴더에 meta.json 을 두면 메타데이터(위경도, 설명, 태그 등)를
세밀하게 덮어쓸 수 있습니다.

사용법:
  python scripts/build_index.py
  python scripts/build_index.py --media media --out data/index.json
"""
from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"}
VIDEO_EXTS = {".mp4", ".mov", ".webm", ".m4v"}

# country-slug → 표시명/ISO 코드 매핑. 새 국가 추가 시 여기에 등록.
COUNTRY_MAP = {
    "korea":       ("대한민국", "KR"),
    "japan":       ("일본", "JP"),
    "china":       ("중국", "CN"),
    "usa":         ("미국", "US"),
    "uk":          ("영국", "GB"),
    "france":      ("프랑스", "FR"),
    "germany":     ("독일", "DE"),
    "italy":       ("이탈리아", "IT"),
    "spain":       ("스페인", "ES"),
    "philippines": ("필리핀", "PH"),
    "indonesia":   ("인도네시아", "ID"),
    "thailand":    ("태국", "TH"),
    "vietnam":     ("베트남", "VN"),
    "egypt":       ("이집트", "EG"),
    "australia":   ("호주", "AU"),
    "eu":          ("유로존", "EU"),
}

FILENAME_RE = re.compile(
    r"^(?P<date>\d{4}-\d{2}-\d{2})?_?(?P<slug>[a-z0-9\-]+?)(?:_(?P<seq>\d{3}))?$"
)


def slug_to_title(slug: str) -> str:
    return slug.replace("-", " ").title()


def country_label(slug: str) -> tuple[str, str]:
    if slug in COUNTRY_MAP:
        return COUNTRY_MAP[slug]
    return (slug_to_title(slug), slug.upper()[:2])


def media_type(p: Path) -> str | None:
    ext = p.suffix.lower()
    if ext in IMAGE_EXTS:
        return "image"
    if ext in VIDEO_EXTS:
        return "video"
    return None


def parse_filename(name: str) -> dict:
    """예: '2025-03-15_pescador-island_001' → {date, slug, seq}"""
    stem = Path(name).stem
    m = FILENAME_RE.match(stem)
    if not m:
        return {"slug": stem, "date": None, "seq": None}
    return {
        "date": m.group("date"),
        "slug": m.group("slug") or stem,
        "seq": m.group("seq"),
    }


def load_meta(folder: Path) -> dict:
    """폴더 안 meta.json 을 읽어 파일별 오버라이드 dict 반환."""
    meta_path = folder / "meta.json"
    if not meta_path.exists():
        return {}
    try:
        return json.loads(meta_path.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"⚠️  {meta_path} 파싱 실패: {e}")
        return {}


def find_thumb(media_file: Path) -> Path:
    """비디오 파일은 같은 이름의 .jpg 썸네일을 찾습니다. 없으면 비디오 자체."""
    if media_type(media_file) == "video":
        for ext in (".jpg", ".jpeg", ".png", ".webp"):
            candidate = media_file.with_suffix(ext)
            if candidate.exists():
                return candidate
    return media_file


def scan_freediving(root: Path) -> list[dict]:
    items = []
    for country_dir in sorted(p for p in root.iterdir() if p.is_dir()):
        country_name, country_code = country_label(country_dir.name)
        for loc_dir in sorted(p for p in country_dir.iterdir() if p.is_dir()):
            meta = load_meta(loc_dir)
            for f in sorted(loc_dir.iterdir()):
                if not f.is_file() or media_type(f) is None:
                    continue
                if f.name.startswith("."):
                    continue
                parsed = parse_filename(f.name)
                file_meta = meta.get(f.name, {})
                items.append({
                    "id": f"fd_{parsed['date'] or 'undated'}_{country_dir.name}_{loc_dir.name}_{parsed['slug']}",
                    "type": media_type(f),
                    "src": str(f).replace("\\", "/"),
                    "thumb": str(find_thumb(f)).replace("\\", "/"),
                    "country": country_name,
                    "country_code": country_code,
                    "location": file_meta.get("location", slug_to_title(loc_dir.name)),
                    "point": file_meta.get("point", slug_to_title(parsed["slug"])),
                    "lat": file_meta.get("lat"),
                    "lng": file_meta.get("lng"),
                    "date": file_meta.get("date", parsed["date"]),
                    "depth_m": file_meta.get("depth_m"),
                    "description": file_meta.get("description", ""),
                    "tags": file_meta.get("tags", []),
                })
    return items


def scan_collectibles(root: Path, kind: str) -> list[dict]:
    items = []
    for country_dir in sorted(p for p in root.iterdir() if p.is_dir()):
        country_name, country_code = country_label(country_dir.name)
        meta = load_meta(country_dir)
        for f in sorted(country_dir.iterdir()):
            if not f.is_file() or media_type(f) is None:
                continue
            if f.name.startswith("."):
                continue
            parsed = parse_filename(f.name)
            file_meta = meta.get(f.name, {})
            year_match = re.match(r"(\d{4})", parsed["slug"] or "")
            year = file_meta.get("year") or (int(year_match.group(1)) if year_match else None)
            items.append({
                "id": f"{kind[:2]}_{country_dir.name}_{parsed['slug']}",
                "type": media_type(f),
                "src": str(f).replace("\\", "/"),
                "thumb": str(find_thumb(f)).replace("\\", "/"),
                "country": country_name,
                "country_code": country_code,
                "year": year,
                "face_value": file_meta.get("face_value", ""),
                "description": file_meta.get("description", ""),
                "tags": file_meta.get("tags", []),
                **({"denomination_type": file_meta.get("denomination_type", "coin")} if kind == "coins" else {}),
            })
    return items


def build(media_root: Path, out_path: Path):
    fd_root = media_root / "freediving"
    st_root = media_root / "stamps"
    cn_root = media_root / "coins"

    data = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "hobbies": {
            "freediving": {
                "name": "프리다이빙",
                "name_en": "Freediving",
                "items": scan_freediving(fd_root) if fd_root.exists() else [],
            },
            "stamps": {
                "name": "우표",
                "name_en": "Stamps",
                "items": scan_collectibles(st_root, "stamps") if st_root.exists() else [],
            },
            "coins": {
                "name": "돈",
                "name_en": "Coins & Notes",
                "items": scan_collectibles(cn_root, "coins") if cn_root.exists() else [],
            },
        },
    }
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    total = sum(len(h["items"]) for h in data["hobbies"].values())
    print(f"✅ {out_path}  —  총 {total}개 항목 인덱싱 완료")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--media", default="media", help="미디어 루트 폴더")
    ap.add_argument("--out", default="data/index.json", help="출력 JSON 경로")
    args = ap.parse_args()
    build(Path(args.media), Path(args.out))


if __name__ == "__main__":
    main()
