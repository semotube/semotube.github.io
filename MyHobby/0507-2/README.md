# 나의취미 — Personal Hobby Archive

> 프리다이빙 · 우표 · 동전을 모아두는 개인 아카이브.
> GitHub Pages: <https://semotube.github.io/>

다크 모드, 노안 친화 대비/폰트, Tailwind CSS, 한국어 UI, 모바일 완전 반응형.

---

## ✨ 기능

- **프리다이빙**: 세계지도 위 다이빙 포인트 핀 + 국가→위치별 그리드
- **우표**: 천공된 우표 카드, 국가별 그리드, 발행연도순 정렬
- **돈**: 동전(원형) / 지폐(직사각형), 길로셰 패턴 배경
- **검색**: 국가·위치·태그·설명 통합 검색
- **라이트박스**: ←/→ 키보드 네비게이션, 비디오/유튜브 재생
- **Tweaks 패널**: 그리드/메이슨리/리스트, 밀도/폰트크기/지도 토글
- **자동 인덱싱**: Python 스크립트가 폴더 스캔 + 메타파일 머지 → `data/index.json`

---

## 📁 폴더 구조

```
.
├── index.html              # 메인 페이지
├── app.jsx                 # 헤더, 라이트박스, 미디어 카드
├── pages.jsx               # 카테고리 페이지 + 지도
├── tweaks-panel.jsx        # Tweaks UI
│
├── data/
│   ├── diving.json         # ✏ 다이빙 메타데이터 (수동 편집)
│   ├── stamps.json         # ✏ 우표 메타데이터 (수동 편집)
│   ├── coins.json          # ✏ 동전/지폐 메타데이터 (수동 편집)
│   └── index.json          # ⚙ build_index.py 가 자동 생성 (편집 X)
│
├── media/                  # 🖼 모든 미디어
│   ├── diving/             # 프리다이빙 사진/동영상
│   ├── stamps/             # 우표 스캔 이미지
│   └── coins/              # 동전·지폐 스캔 이미지
│
└── scripts/
    ├── build_index.py      # 🛠 폴더 스캔 + 메타 머지 → index.json
    └── new_item.py         # 🛠 새 파일명 자동 추천 + 빈 메타 항목 추가
```

---

## 📐 파일명 규칙

```
<국가코드 2자리>_<년도 4자리>_<일련번호 2자리>.<확장자>
```

| 항목 | 규칙 | 예시 |
| --- | --- | --- |
| 국가코드 | 영문 소문자 2자리 (ISO-3166-1 alpha-2) — 모르면 `00` | `kr`, `jp`, `ph`, `00` |
| 년도 | 4자리 — 모르면 `0000` | `2026`, `1988`, `0000` |
| 일련번호 | 2자리, 같은 (국가, 년도) 안에서 01부터 증가 | `01`, `02`, `99` |

**예시**
```
media/diving/ph_2025_01.jpg      # 필리핀, 2025년 1번
media/diving/kr_2024_03.mp4      # 한국, 2024년 3번 (영상)
media/diving/kr_2024_03.jpg      # 위 영상의 썸네일 (자동 인식)
media/stamps/kr_1988_01.jpg      # 한국, 1988년
media/coins/00_2020_01.jpg       # 국가 미상, 2020년
media/coins/jp_0000_01.jpg       # 일본, 년도 미상
```

**지원 확장자**
- 이미지: `.jpg .jpeg .png .webp .gif .avif`
- 비디오: `.mp4 .mov .webm .m4v` — 같은 stem 의 `.jpg` 가 있으면 썸네일로 자동 사용

---

## 🚀 새 항목 추가하는 법

### 방법 1 — 헬퍼 스크립트 (권장)

```bash
# 다이빙
python scripts/new_item.py diving --cc ph --year 2025

# 우표
python scripts/new_item.py stamps --cc kr --year 1988

# 돈
python scripts/new_item.py coins --cc 00 --year 0000
```

스크립트가 다음을 자동으로 처리합니다:
1. 같은 (국가, 년도) 의 다음 일련번호 계산 → 권장 파일명 출력
2. `data/<hobby>.json` 의 `items` 에 빈 메타 항목 추가

출력된 경로에 미디어 파일을 저장하고, `data/<hobby>.json` 을 열어 메타데이터를 채우면 됩니다.

### 방법 2 — 수동

위 규칙대로 파일을 직접 `media/<hobby>/` 에 넣고, `data/<hobby>.json` 의 `items` 에 항목을 추가하세요.

---

## 📝 메타데이터 편집

키는 **확장자를 뺀 파일명** 그대로입니다 (예: `ph_2025_01.jpg` → `ph_2025_01`).

### `data/diving.json`

```jsonc
{
  "items": {
    "ph_2025_01": {
      "country": "필리핀",
      "location": "Moalboal",
      "point": "Pescador Island",
      "lat": 9.9333,
      "lng": 123.3833,
      "date": "2025-03-15",
      "depth_m": 18,
      "description": "정어리 떼 사이로 다이빙",
      "tags": ["sardine-run"]
    }
  }
}
```

### `data/stamps.json`

```jsonc
{
  "items": {
    "kr_1988_01": {
      "country": "대한민국",
      "face_value": "80원",
      "description": "서울 올림픽 기념",
      "tags": ["olympics"]
    }
  }
}
```

### `data/coins.json`

```jsonc
{
  "items": {
    "kr_1983_01": {
      "country": "대한민국",
      "face_value": "500원",
      "denomination_type": "coin",   // "coin" 또는 "note"
      "description": "현행 500원 동전 첫 발행",
      "tags": ["coin"]
    }
  }
}
```

> `country` 를 비워두면 `build_index.py` 가 국가코드(`kr` → 대한민국)에서 자동 채워줍니다.
> 새 국가코드를 쓰려면 `scripts/build_index.py` 의 `COUNTRY_NAMES` 에 추가하세요.

---

## 🔄 인덱스 갱신 + 배포

```bash
# 1. 인덱스 재생성
python scripts/build_index.py

# 2. 커밋·푸시 (GitHub Pages 자동 반영)
git add media/ data/ && git commit -m "feat: add new items" && git push
```

---

## 🆕 취미 종류 추가하기

새 취미(예: "음반")를 추가하려면 **3곳**을 수정합니다:

1. **폴더 생성**: `media/records/`
2. **메타파일 생성**: `data/records.json` (`{"items": {}}`)
3. **`scripts/build_index.py` 수정**: `build()` 의 `hobbies` 딕셔너리에 항목 추가
   ```python
   "records": {
       "name": "음반", "name_en": "Records",
       "items": scan(media_root / "records", load_meta(data_root / "records.json"), "records"),
   },
   ```
4. **`new_item.py` 수정**: `choices=[...]` 에 `"records"` 추가, `DEFAULTS` 에 기본 메타 추가
5. **UI 수정**: `app.jsx` `Header.tabs` 와 `index.html` `App switch` 에 라우트 추가

---

## 🌐 비디오 처리

- **GitHub 직접 업로드** — `.mp4` 파일을 그냥 폴더에 넣으세요. GitHub 100MB 제한 주의.
- **YouTube 임베드** — 메타데이터에 `"youtubeId": "dQw4w9WgXcQ"` 추가하면 라이트박스에서 임베드 재생.

---

## 🛠 로컬 미리보기

```bash
python -m http.server 8000   # → http://localhost:8000
```

---

## 📐 디자인 노트

- **폰트**: Pretendard Variable (한글) + Inter (영문) + Cormorant Garamond (세리프) + JetBrains Mono
- **컬러**: 카테고리별 분리된 톤 — 다이빙(딥블루), 우표(세피아), 돈(딥그린)
- **노안 친화**: 본문 17px 기본, 텍스트 알파 0.7+ 유지, 굵은 가중치
- **반응형**: 640 / 768 / 1024 브레이크포인트, 모바일 햄버거 메뉴, 2열 그리드 자동 전환
