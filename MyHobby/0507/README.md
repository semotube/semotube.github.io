# 나의취미 — Personal Hobby Archive

> 프리다이빙 · 우표 · 동전을 모아두는 개인 아카이브.
> GitHub Pages 배포: <https://semotube.github.io/>

미니멀 다크 모드, 흑백 타이포그래피, Tailwind CSS, 한국어 UI.
스마트폰까지 완전 반응형.

---

## ✨ 기능

- **타임라인 홈**: 모든 취미의 미디어를 연도별로 묶어서 최신순 정렬
- **프리다이빙**: 세계지도 위 다이빙 포인트 핀 + 국가 → 위치별 그리드
- **우표 / 돈**: 국가별 그리드, 발행연도순 정렬, 액면가/메타 표시
- **검색**: 국가, 위치, 태그, 설명 통합 검색
- **라이트박스**: ←/→ 키보드 네비게이션, 비디오/유튜브 재생
- **Tweaks 패널**: 그리드/메이슨리/리스트 전환, 밀도/폰트크기/지도 토글
- **자동 인덱싱**: Python 스크립트가 폴더 스캔 → `data/index.json` 자동 생성

---

## 📁 폴더 구조

```
.
├── index.html              # 메인 페이지
├── app.jsx                 # 헤더, 홈, 라이트박스, 미디어 카드
├── pages.jsx               # 카테고리 페이지 + 지도
├── tweaks-panel.jsx        # Tweaks UI
│
├── data/
│   └── index.json          # ⚙ 자동 생성됨 — 절대 수동 편집 X
│
├── media/                  # 🖼 모든 미디어가 들어가는 곳
│   ├── freediving/
│   │   └── <country>/<location>/
│   │       ├── <YYYY-MM-DD>_<point>_<NNN>.jpg|mp4|...
│   │       └── meta.json   # 선택 — 위경도/설명/태그 오버라이드
│   ├── stamps/
│   │   └── <country>/
│   │       ├── <YYYY>_<theme>.jpg
│   │       └── meta.json
│   └── coins/
│       └── <country>/
│           ├── <YYYY>_<denomination>.jpg
│           └── meta.json
│
└── scripts/
    ├── build_index.py      # 🛠 폴더 스캔 → JSON 생성
    └── new_item.py         # 🛠 새 항목용 폴더/파일명 가이드
```

### 폴더·파일명 규칙

| 항목 | 패턴 | 예시 |
| --- | --- | --- |
| 프리다이빙 폴더 | `media/freediving/<country-slug>/<location-slug>/` | `media/freediving/philippines/moalboal/` |
| 프리다이빙 파일 | `<YYYY-MM-DD>_<point-slug>_<NNN>.<ext>` | `2025-03-15_pescador-island_001.jpg` |
| 우표 폴더 | `media/stamps/<country-slug>/` | `media/stamps/korea/` |
| 우표 파일 | `<YYYY>_<theme-slug>.<ext>` | `1988_seoul-olympics.jpg` |
| 돈 폴더 | `media/coins/<country-slug>/` | `media/coins/japan/` |
| 돈 파일 | `<YYYY>_<denomination-slug>.<ext>` | `2000_2000yen-note.jpg` |

**country-slug 규칙**: 영문 소문자, 띄어쓰기 대신 `-`. 예) `korea`, `usa`, `uk`, `philippines`.
사이트가 표시할 한글 국가명/ISO 코드 매핑은 `scripts/build_index.py` 의 `COUNTRY_MAP` 딕셔너리에 있습니다 — **새 국가를 쓰려면 여기에 추가하세요.**

**지원 확장자**
- 이미지: `.jpg .jpeg .png .webp .gif .avif`
- 비디오: `.mp4 .mov .webm .m4v` (비디오와 같은 이름의 `.jpg` 가 있으면 자동으로 썸네일로 사용)

---

## 🚀 새 항목 추가하는 법

### 방법 1 — 헬퍼 스크립트로 폴더/파일명 자동 생성

```bash
# 프리다이빙
python scripts/new_item.py freediving \
  --country philippines --location moalboal \
  --point pescador-island --date 2025-04-01

# 우표
python scripts/new_item.py stamps \
  --country japan --year 2024 --theme cherry-blossom

# 동전/지폐
python scripts/new_item.py coins \
  --country korea --year 2025 --denomination 100won
```

스크립트가 폴더를 만들고 권장 파일명을 출력합니다.
출력된 경로에 미디어 파일을 저장하세요.

### 방법 2 — 수동으로 파일 추가

위의 폴더·파일명 규칙대로 직접 넣어도 됩니다.

### 메타데이터 (선택)

각 폴더에 `meta.json` 파일을 두면 파일별로 메타데이터를 더할 수 있습니다.

```jsonc
// media/freediving/philippines/moalboal/meta.json
{
  "2025-03-15_pescador-island_001.jpg": {
    "lat": 9.9333,
    "lng": 123.3833,
    "depth_m": 18,
    "description": "정어리 떼 사이로 다이빙. 시야 30m+",
    "tags": ["sardine-run", "deep-blue"]
  }
}
```

```jsonc
// media/stamps/korea/meta.json
{
  "1988_seoul-olympics.jpg": {
    "face_value": "80원",
    "description": "서울 올림픽 기념",
    "tags": ["olympics", "sport"]
  }
}
```

지원되는 키:

| 카테고리 | 키 |
| --- | --- |
| 프리다이빙 | `location`, `point`, `lat`, `lng`, `date`, `depth_m`, `description`, `tags[]` |
| 우표 | `year`, `face_value`, `description`, `tags[]` |
| 돈 | `year`, `face_value`, `denomination_type` (`coin`/`note`), `description`, `tags[]` |

### 인덱스 갱신

```bash
python scripts/build_index.py
```

이 명령이 `media/` 를 전부 스캔해서 `data/index.json` 을 다시 만듭니다.
실행 후 git 커밋·푸시하면 GitHub Pages에 반영됩니다.

```bash
git add media/ data/index.json
git commit -m "feat: add Moalboal freediving 2025-03-15"
git push
```

---

## 🆕 취미 종류 추가하기 (확장성)

새 취미(예: "음반")를 추가하려면 **3곳**을 수정합니다:

1. **폴더 생성**: `media/records/<country>/...`
2. **`scripts/build_index.py`**: `build()` 함수의 `hobbies` 딕셔너리에 새 항목 추가
   ```python
   "records": {
       "name": "음반",
       "name_en": "Records",
       "items": scan_collectibles(media_root / "records", "records") if (media_root / "records").exists() else [],
   },
   ```
3. **`app.jsx`** & **`index.html`**:
   - `Header` 의 `tabs` 배열에 `{ id: 'records', label: 'Records', kr: '음반' }` 추가
   - `index.html` 의 `App` 컴포넌트 `switch` 에 라우트 추가
   - 우표/돈과 동일한 구조면 `<CollectiblePage hobbyKey="records" .../>` 재사용 가능

---

## 🌐 비디오 처리

두 가지 방식 모두 지원합니다.

1. **GitHub 직접 업로드** — `.mp4` 파일을 그냥 폴더에 넣으세요. GitHub의 100MB 파일 제한 주의.
2. **YouTube 임베드** — `meta.json` 에서 `youtubeId` 를 지정:
   ```json
   {
     "2025-03-15_sardine-run_001.mp4": {
       "youtubeId": "dQw4w9WgXcQ"
     }
   }
   ```

---

## 🛠 로컬 미리보기

```bash
# Python 내장 서버
python -m http.server 8000
# → http://localhost:8000
```

또는 VS Code Live Server 등 어떤 정적 서버라도 OK.

---

## 📦 배포 (GitHub Pages)

이미 `semotube.github.io` 리포지토리이므로 푸시만 하면 됩니다.

```bash
git push origin main
```

---

## 📐 디자인 노트

- **폰트**: Pretendard Variable (한글) + Inter (영문) + JetBrains Mono (수치/메타)
- **컬러**: 순수 `#000` 배경 / `#fff` 전경 — 액센트는 흰색의 알파값으로만
- **그리드**: 최대 폭 1280px (`max-w-7xl`)
- **반응형 브레이크포인트**: `sm: 640px / md: 768px / lg: 1024px`
- **모바일**: 햄버거 메뉴, 2열 그리드 자동 전환, 라이트박스 풀스크린

---

## 📝 라이선스

개인 아카이브. 미디어 파일은 모두 본인 소유물.
