#!/usr/bin/env python3
"""
build_index.py — media/{diving,stamps,coins}/ 폴더를 스캔해 data/index.json 생성.

파일명 규칙:
  <국가코드 2자리>_<년도 4자리>_<인덱스 5자리>.<확장자>
  예: kr_2026_00001.jpg, 00_2020_00001.mp4

- 국가코드 모르면 '00'
- 년도 모르면 '0000'
- 인덱스는 같은 (국가, 년도) 안에서 1부터 자유롭게 (순차 권장)

비디오와 같은 stem 의 .jpg 가 있으면 자동으로 비디오 썸네일로 사용됨.
"""
from __future__ import annotations
import json, re
from pathlib import Path

FNAME_RE = re.compile(r"^[a-z0-9]{2}_\d{4}_\d{5}\.(jpg|jpeg|png|webp|gif|avif|mp4|mov|webm|m4v)$", re.I)

HOBBIES = ["diving", "stamps", "coins"]

def scan(folder: Path) -> list[str]:
    if not folder.exists():
        return []
    files = []
    for p in sorted(folder.iterdir()):
        if not p.is_file() or p.name.startswith("."):
            continue
        if FNAME_RE.match(p.name):
            files.append(p.name)
        else:
            print(f"⚠️  {p.name}: 파일명 규칙 불일치 → 스킵 (cc_yyyy_nnnn.ext)")
    return files

def main():
    media_root = Path("media")
    out = {h: scan(media_root / h) for h in HOBBIES}
    out_path = Path("data/index.json")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    total = sum(len(v) for v in out.values())
    print(f"✅ {out_path}  —  {total}개 파일 인덱싱")
    for h in HOBBIES:
        print(f"   · {h:8s} {len(out[h])}개")

if __name__ == "__main__":
    main()
