#!/usr/bin/env python3
"""
build_index.py — 평탄화된 미디어 폴더를 스캔해서 data/index.json 을 생성.

폴더 구조 (단순):
  media/diving/<cc>_<yyyy>_<nn>.<ext>     예) ph_2025_01.jpg, kr_2024_03.mp4
  media/stamps/<cc>_<yyyy>_<nn>.<ext>     예) kr_1988_01.jpg
  media/coins/<cc>_<yyyy>_<nn>.<ext>      예) jp_2000_01.jpg

규칙:
  - 국가코드: 영문 소문자 2자리 (ISO-3166-1 alpha-2). 모르면 '00'.
  - 년도: 4자리. 모르면 '0000'.
  - 일련번호: 2자리. 같은 (국가코드, 년도) 안에서 01부터 증가.

메타데이터:
  data/diving.json, data/stamps.json, data/coins.json 의 'items' 객체에서
  파일 stem(확장자 제외)을 키로 조회 → 위경도/설명/태그 등을 덮어씀.

사용법:
  python scripts/build_index.py
"""
from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"}
VIDEO_EXTS = {".mp4", ".mov", ".webm", ".m4v"}

# 국가코드 → (한글명, ISO코드 그대로)
COUNTRY_NAMES = {
    "kr": "대한민국", "jp": "일본", "cn": "중국", "tw": "대만",
    "us": "미국", "ca": "캐나다", "mx": "멕시코",
    "gb": "영국", "fr": "프랑스", "de": "독일", "it": "이탈리아",
    "es": "스페인", "nl": "네덜란드", "pt": "포르투갈", "se": "스웨덴",
    "no": "노르웨이", "fi": "핀란드", "ch": "스위스", "at": "오스트리아",
    "ph": "필리핀", "id": "인도네시아", "th": "태국", "vn": "베트남",
    "my": "말레이시아", "sg": "싱가포르", "in": "인도",
    "eg": "이집트", "ma": "모로코", "za": "남아프리카공화국",
    "au": "호주", "nz": "뉴질랜드",
    "ru": "러시아", "br": "브라질", "ar": "아르헨티나",
    "eu": "유로존",
    "00": "미상",
}

FNAME_RE = re.compile(r"^([a-z0-9]{2})_(\d{4})_(\d{2})$")


def media_type(p: Path) -> str | None:
    ext = p.suffix.lower()
    if ext in IMAGE_EXTS:
        return "image"
    if ext in VIDEO_EXTS:
        return "video"
    return None


def find_thumb(media_file: Path) -> Path:
    """비디오는 같은 stem 의 .jpg 썸네일 사용. 없으면 비디오 자체."""
    if media_type(media_file) == "video":
        for ext in (".jpg", ".jpeg", ".png", ".webp"):
            candidate = media_file.with_suffix(ext)
            if candidate.exists():
                return candidate
    return media_file


def country_label(code: str) -> str:
    return COUNTRY_NAMES.get(code, code.upper())


def load_meta(path: Path) -> dict:
    if not path.exists():
        print(f"⚠️  {path} 없음 — 빈 메타로 진행")
        return {"items": {}}
    return json.loads(path.read_text(encoding="utf-8"))


def scan(folder: Path, meta: dict, hobby: str) -> list[dict]:
    """folder 안의 미디어 파일을 스캔. 비디오 썸네일 .jpg 는 별도 항목으로 만들지 않음."""
    items_meta = meta.get("items", {})
    if not folder.exists():
        return []

    files = sorted(p for p in folder.iterdir() if p.is_file() and not p.name.startswith("."))
    # 같은 stem 의 비디오가 존재하는 이미지는 "비디오 썸네일" 로 보고 별도 항목 생성 X
    video_stems = {p.stem for p in files if media_type(p) == "video"}

    out = []
    for f in files:
        mt = media_type(f)
        if mt is None:
            continue
        # 비디오의 썸네일 이미지는 스킵 (find_thumb 가 비디오 항목에서 참조)
        if mt == "image" and f.stem in video_stems:
            continue

        m = FNAME_RE.match(f.stem)
        if not m:
            print(f"⚠️  {f.name}: 파일명 규칙 불일치 (cc_yyyy_nn). 스킵.")
            continue
        cc, year, nn = m.group(1), int(m.group(2)), m.group(3)
        meta_entry = items_meta.get(f.stem, {})

        item = {
            "id": f"{hobby}_{f.stem}",
            "type": mt,
            "src": f"media/{hobby}/{f.name}",
            "thumb": f"media/{hobby}/{find_thumb(f).name}",
            "country_code": cc.upper() if cc != "00" else "00",
            "country": meta_entry.get("country", country_label(cc)),
            "year": year if year > 0 else None,
            "tags": meta_entry.get("tags", []),
            "description": meta_entry.get("description", ""),
        }

        # 카테고리별 추가 필드
        if hobby == "diving":
            item.update({
                "location": meta_entry.get("location", ""),
                "point": meta_entry.get("point", ""),
                "lat": meta_entry.get("lat"),
                "lng": meta_entry.get("lng"),
                "date": meta_entry.get("date"),
                "depth_m": meta_entry.get("depth_m"),
            })
        elif hobby == "stamps":
            item.update({
                "face_value": meta_entry.get("face_value", ""),
            })
        elif hobby == "coins":
            item.update({
                "face_value": meta_entry.get("face_value", ""),
                "denomination_type": meta_entry.get("denomination_type", "coin"),
            })

        out.append(item)
    return out


def build(media_root: Path, data_root: Path, out_path: Path):
    diving_meta = load_meta(data_root / "diving.json")
    stamps_meta = load_meta(data_root / "stamps.json")
    coins_meta = load_meta(data_root / "coins.json")

    data = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "hobbies": {
            "freediving": {
                "name": "프리다이빙",
                "name_en": "Freediving",
                "items": scan(media_root / "diving", diving_meta, "diving"),
            },
            "stamps": {
                "name": "우표",
                "name_en": "Stamps",
                "items": scan(media_root / "stamps", stamps_meta, "stamps"),
            },
            "coins": {
                "name": "돈",
                "name_en": "Coins & Notes",
                "items": scan(media_root / "coins", coins_meta, "coins"),
            },
        },
    }

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    total = sum(len(h["items"]) for h in data["hobbies"].values())
    print(f"✅ {out_path}  —  총 {total}개 항목 인덱싱 완료")
    for k, h in data["hobbies"].items():
        print(f"   · {h['name']:8s} {len(h['items'])}개")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--media", default="media")
    ap.add_argument("--data", default="data")
    ap.add_argument("--out", default="data/index.json")
    args = ap.parse_args()
    build(Path(args.media), Path(args.data), Path(args.out))


if __name__ == "__main__":
    main()
