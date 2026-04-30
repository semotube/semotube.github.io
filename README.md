# 나의 앨범 · One Breath, One Life

프리다이빙으로 만난 시간들을 모은 개인 앨범 사이트입니다.
GitHub Pages에 그대로 올리면 `https://semotube.github.io/`에서 바로 보입니다.

---

## 📁 파일 구조

```
semotube.github.io/
├── index.html          ← 진입 페이지 (이것만 사람들이 보게 됨)
├── app.jsx             ← UI 컴포넌트 (수정할 일 거의 없음)
├── tweaks-panel.jsx    ← Tweaks 패널 (수정할 일 거의 없음)
├── data.js             ← 🔥 사진/영상/섹션 정보 — 여기만 편집!
├── photos/             ← 사진 파일들
│   └── 2025/
│       ├── maldives/
│       │   ├── 01.jpg
│       │   └── 02.jpg
│       └── hainan/
│           └── 01.jpg
└── videos/             ← 영상 파일들
    └── 2025/
        └── maldives/
            └── dive01.mp4
```

> **거의 모든 수정은 `data.js` 한 파일에서 끝납니다.**

---

## 🧭 데이터 구조 — 3단 계층

```
연도 (Year)
└── 섹션 (Section, 트립/주제)     예: "몰디브 여행", "로보 v0"
    └── 아이템 (Item, 사진/영상)   예: 사진 한 장, 영상 한 편
```

`data.js` 안에서 각 연도는 다음과 같이 생겼습니다:

```js
YEAR(2025, "해남도, 몰디브, 그리고 로보",
  "한 줄짜리 그 해 요약문.",
  [
    SECT("maldives", "몰디브 — 라이브어보드",
      "섹션의 한 줄 설명 (생략 가능).", [
      ["고래상어와의 만남", "Hanifaru Bay", "2025.07", "다이빙"],
      ["만타 트레인",       "몰디브",      "2025.07", "다이빙"],
      // ... 사진 더 추가
    ]),
    SECT("robo-v0", "로보 v0 — 초기 버전",
      "수중 카메라 자동 추적기. 거실에서 시작된 작은 프로젝트.", [
      // ...
    ]),
  ]),
```

- `SECT(id, title, summary, items)` — id는 영문 소문자 + 하이픈으로 (URL/앵커용)
- `items`는 배열. 한 항목은 두 가지 형식:
  - **사진(간단)**: `["설명", "장소", "2025.07", "태그"]`
  - **사진(상세)**: `{ type: "photo", src: "photos/...", caption, location, date, tag }`
  - **영상**: `{ type: "video", src: "videos/...mp4", poster: "photos/...jpg", caption, location, date, tag }`

---

## ➕ 사진 한 장 추가하기

### 1. 사진 파일 준비
- `photos/<연도>/<섹션id>/` 폴더에 넣습니다.
  예: `photos/2025/maldives/03.jpg`
- 권장: 가로 1600~2400px, JPEG 품질 80~85%, 한 장당 300KB~1MB.

### 2. `data.js` 편집
해당 섹션 `items` 배열 안에 줄을 추가:

```js
{ type: "photo",
  src: "photos/2025/maldives/03.jpg",
  caption: "수면으로 올라오는 길",
  location: "몰디브",
  date: "2025.07",
  tag: "다이빙" },
```

> `src`를 비워두면 (`src: ""`) 자동으로 바다 톤 플레이스홀더가 표시됩니다 — 사진을 나중에 채울 자리만 미리 만들어둘 수 있어요.

---

## 🎬 동영상 한 편 추가하기

### 1. 영상 + 썸네일 준비
- `videos/<연도>/<섹션id>/<이름>.mp4` — H.264, 1080p, ~5Mbps 추천 (HandBrake로 압축)
- `photos/<연도>/<섹션id>/<이름>-poster.jpg` — 썸네일용 정지 이미지 (선택)

> ⚠️ GitHub 단일 파일 한도는 **100MB**, 저장소 권장 한도는 **1GB**.
> 더 큰 영상은 YouTube 등에 올리고 링크하는 방식이 안전합니다.

### 2. `data.js` 편집

```js
{ type: "video",
  src: "videos/2025/maldives/whaleshark.mp4",
  poster: "photos/2025/maldives/whaleshark-poster.jpg",
  caption: "고래상어와 함께 — Hanifaru Bay",
  location: "몰디브",
  date: "2025.07",
  tag: "다이빙" },
```

영상 카드는 자동으로 ▶ 재생 아이콘과 `VIDEO` 뱃지가 붙고, 클릭하면 라이트박스에서 바로 재생됩니다.

---

## 📂 새 섹션(트립) 추가하기

같은 해 안에서 새로운 트립이나 주제를 추가하려면, `YEAR(...)` 안의 섹션 배열에 `SECT(...)`를 하나 더 끼워 넣습니다:

```js
YEAR(2025, "해남도, 몰디브, 그리고 로보", "...",
  [
    SECT("hainan",   "해남도 — 첫 중국 다이빙", "...", [ /* 아이템들 */ ]),
    SECT("maldives", "몰디브 — 라이브어보드",   "...", [ /* 아이템들 */ ]),
    SECT("robo-v0",  "로보 v0 — 초기 버전",     "...", [ /* 아이템들 */ ]),

    // ↓ 여기에 새 섹션 추가
    SECT("jeju-winter", "제주 겨울 — 짧은 트립",
      "12월의 차가운 바다.", [
      ["입수 직전", "제주", "2025.12", "다이빙"],
    ]),
  ]),
```

**섹션 id 규칙**
- 영문 소문자 + 하이픈만 사용 (예: `jeju-winter`, `pool-camp-2`)
- 같은 연도 안에서 중복 금지
- 한 번 정한 id는 가능한 한 바꾸지 않기 (URL 앵커로 쓰입니다)

---

## 📅 새 연도 추가하기

`data.js`의 `window.ALBUM_DATA = [...]` 배열에 `YEAR(...)`를 하나 더 추가합니다:

```js
YEAR(2027, "다음 해", "한 줄 요약.",
  [
    SECT("first-trip", "첫 번째 트립", "설명", [
      ["사진 1", "장소", "2027.01", "태그"],
    ]),
  ]),
```

연도 정렬은 자동으로 되니 순서는 신경 쓰지 않아도 됩니다.

---

## 🖼️ 연도 카드 커버 사진 바꾸기

기본값은 첫 번째 섹션의 첫 번째 아이템이 커버로 사용됩니다.
다른 사진을 커버로 쓰고 싶다면 `YEAR(...)` 다섯 번째 인자에 `{ section: 인덱스, item: 인덱스 }`를 넣어주세요 (둘 다 0부터 시작):

```js
YEAR(2025, "...", "...", [ /* 섹션들 */ ],
  { section: 1, item: 2 }   // 두 번째 섹션의 세 번째 아이템을 커버로
),
```

---

## 🚀 GitHub Pages 배포 / 업데이트 절차

### 처음 배포
1. https://github.com/new — 저장소 이름 **반드시** `semotube.github.io`
2. **Public** 선택, README 추가 체크
3. **Create repository**
4. 저장소 페이지에서 **Add file → Upload files** → 4개 파일 + `photos/`, `videos/` 폴더 드래그
5. **Commit changes**
6. **Settings → Pages → Source: `Deploy from a branch`, Branch: `main / (root)`**
7. 1~2분 후 `https://semotube.github.io/` 접속

### 매번 업데이트
- GitHub 웹에서 직접 파일 편집 (✏️ 아이콘) → **Commit changes**
- 또는 사진/영상 추가는 **Add file → Upload files** 후 `data.js`만 수정

> 변경이 반영되지 않으면 브라우저에서 **Ctrl/Cmd + Shift + R**로 강제 새로고침.

---

## 🎨 디자인 변경 (Tweaks)

상단 툴바의 **Tweaks** 토글을 켜면:
- 유리 효과의 **블러 강도** / **투명도**
- 바다 톤 액센트 (**심해 / 라군 / 황혼 / 오로라**)

값을 바꾸면 자동으로 `index.html`에 저장돼서 다음 방문 때도 그대로 보입니다.

---

## 🐛 자주 막히는 부분

| 증상 | 해결 |
|---|---|
| 404 페이지 | 저장소 이름이 정확히 `semotube.github.io`인지 (대소문자 포함) |
| 빈 화면 | 4개 파일이 모두 **루트**에 있는지 (폴더 안에 들어가면 안 됨) |
| 사진이 안 보임 | `data.js`의 `src` 경로와 실제 업로드 경로가 정확히 일치하는지 (대소문자 포함) |
| 변경이 반영 안 됨 | commit 후 30초~2분 기다렸다가 강제 새로고침 |
| 영상이 재생 안 됨 | mp4 (H.264) 형식인지, 100MB 미만인지 확인 |

---

## 📝 캐시 버전 올리기 (드물게)

`app.jsx`나 `data.js`를 크게 수정했는데 변경이 반영 안 될 때, `index.html`의 다음 두 줄에서 `?v=숫자`를 1씩 올려주면 강제로 최신 버전을 받습니다:

```html
<script src="data.js?v=5"></script>
<script type="text/babel" src="app.jsx?v=5"></script>
```

---

## 📜 라이선스 / 비고

이 사이트의 코드와 콘텐츠는 모두 개인용입니다. 사진과 영상은 본인 자료만 올려주세요.

— *One breath, one life.*
