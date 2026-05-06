#!/usr/bin/env python3
"""
new_item.py — 새 항목 추가용 폴더/파일명 가이드 출력기.

사용법:
  python scripts/new_item.py freediving --country philippines --location moalboal --point pescador-island --date 2025-04-01
  python scripts/new_item.py stamps     --country japan --year 2024 --theme cherry-blossom
  python scripts/new_item.py coins      --country korea --year 2025 --denomination 100won
"""
from __future__ import annotations

import argparse
import re
from pathlib import Path


def slugify(s: str) -> str:
    s = s.lower().strip()
    s = re.sub(r"[^\w\s\-]", "", s)
    s = re.sub(r"[\s_]+", "-", s)
    return s.strip("-")


def cmd_freediving(args):
    folder = Path("media/freediving") / slugify(args.country) / slugify(args.location)
    seq = args.seq or "001"
    fname = f"{args.date}_{slugify(args.point)}_{seq}.{args.ext}"
    print_paths(folder, fname, with_meta=True)


def cmd_stamps(args):
    folder = Path("media/stamps") / slugify(args.country)
    fname = f"{args.year}_{slugify(args.theme)}.{args.ext}"
    print_paths(folder, fname)


def cmd_coins(args):
    folder = Path("media/coins") / slugify(args.country)
    fname = f"{args.year}_{slugify(args.denomination)}.{args.ext}"
    print_paths(folder, fname)


def print_paths(folder: Path, fname: str, with_meta: bool = False):
    folder.mkdir(parents=True, exist_ok=True)
    full = folder / fname
    print("─" * 60)
    print(f"📁 폴더 :  {folder}/")
    print(f"📄 파일 :  {fname}")
    print(f"📍 전체 :  {full}")
    print("─" * 60)
    print("→ 위 경로에 미디어 파일을 저장하세요.")
    if with_meta:
        meta_path = folder / "meta.json"
        print(f"→ 메타데이터를 추가하려면 {meta_path} 를 편집:")
        print('   { "' + fname + '": { "lat": 9.93, "lng": 123.38, "depth_m": 18, "description": "...", "tags": ["..."] } }')
    print("→ 인덱스 갱신 :  python scripts/build_index.py")


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="hobby", required=True)

    fd = sub.add_parser("freediving")
    fd.add_argument("--country", required=True)
    fd.add_argument("--location", required=True)
    fd.add_argument("--point", required=True)
    fd.add_argument("--date", required=True, help="YYYY-MM-DD")
    fd.add_argument("--seq", default="001")
    fd.add_argument("--ext", default="jpg")
    fd.set_defaults(func=cmd_freediving)

    st = sub.add_parser("stamps")
    st.add_argument("--country", required=True)
    st.add_argument("--year", required=True, type=int)
    st.add_argument("--theme", required=True)
    st.add_argument("--ext", default="jpg")
    st.set_defaults(func=cmd_stamps)

    cn = sub.add_parser("coins")
    cn.add_argument("--country", required=True)
    cn.add_argument("--year", required=True, type=int)
    cn.add_argument("--denomination", required=True)
    cn.add_argument("--ext", default="jpg")
    cn.set_defaults(func=cmd_coins)

    args = ap.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
