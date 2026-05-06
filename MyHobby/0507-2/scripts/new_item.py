#!/usr/bin/env python3
"""
new_item.py — 새 파일명 자동 추천 + data/<hobby>.json 에 빈 메타 항목 추가.

사용법:
  python scripts/new_item.py diving --cc ph --year 2025
  python scripts/new_item.py stamps --cc kr --year 1988
  python scripts/new_item.py coins  --cc 00 --year 0000

→ media/<hobby>/ 폴더 안 같은 (cc, year) 의 다음 일련번호를 자동 계산해서
   파일명을 출력하고, data/<hobby>.json items 에 빈 항목을 추가.
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

FNAME_RE = re.compile(r"^([a-z0-9]{2})_(\d{4})_(\d{2})\..+$")

DEFAULTS = {
    "diving": {
        "country": "", "location": "", "point": "",
        "lat": None, "lng": None, "date": "", "depth_m": None,
        "description": "", "tags": [],
    },
    "stamps": {
        "country": "", "face_value": "", "description": "", "tags": [],
    },
    "coins": {
        "country": "", "face_value": "", "denomination_type": "coin",
        "description": "", "tags": [],
    },
}


def next_seq(folder: Path, cc: str, year: str) -> str:
    if not folder.exists():
        return "01"
    used = []
    for f in folder.iterdir():
        m = FNAME_RE.match(f.name)
        if m and m.group(1) == cc and m.group(2) == year:
            used.append(int(m.group(3)))
    n = (max(used) + 1) if used else 1
    return f"{n:02d}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("hobby", choices=["diving", "stamps", "coins"])
    ap.add_argument("--cc", required=True, help="국가코드 2자리 (예: kr, ph, 00)")
    ap.add_argument("--year", required=True, help="년도 4자리 (예: 2025, 0000)")
    ap.add_argument("--ext", default="jpg")
    ap.add_argument("--media", default="media")
    ap.add_argument("--data", default="data")
    args = ap.parse_args()

    cc = args.cc.lower()
    if not re.match(r"^[a-z0-9]{2}$", cc):
        ap.error(f"국가코드는 2자리 영문/숫자: '{args.cc}'")
    year = args.year
    if not re.match(r"^\d{4}$", year):
        ap.error(f"년도는 4자리 숫자: '{args.year}'")

    folder = Path(args.media) / args.hobby
    folder.mkdir(parents=True, exist_ok=True)
    seq = next_seq(folder, cc, year)
    stem = f"{cc}_{year}_{seq}"
    fname = f"{stem}.{args.ext}"
    full = folder / fname

    print("─" * 60)
    print(f"📁 폴더 :  {folder}/")
    print(f"📄 파일 :  {fname}")
    print(f"📍 전체 :  {full}")
    print("─" * 60)
    print("→ 위 경로에 미디어 파일을 저장하세요.")

    # data/<hobby>.json 에 빈 메타 항목 추가
    data_path = Path(args.data) / f"{args.hobby}.json"
    if data_path.exists():
        meta = json.loads(data_path.read_text(encoding="utf-8"))
    else:
        meta = {"_comment": f"{args.hobby} metadata", "items": {}}
    meta.setdefault("items", {})
    if stem not in meta["items"]:
        meta["items"][stem] = DEFAULTS[args.hobby].copy()
        data_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"✏  {data_path} 에 '{stem}' 빈 항목 추가됨 — 메타데이터를 채워주세요.")
    else:
        print(f"ℹ  {data_path} 에 이미 '{stem}' 존재 — 그대로 사용.")

    print("→ 인덱스 갱신 :  python scripts/build_index.py")


if __name__ == "__main__":
    main()
