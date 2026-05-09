# 나의취미

다이빙 · 우표 · 화폐 사진/동영상 갤러리. <https://semotube.github.io/>

라이트 테마 · 한국어 UI · Tailwind · 모바일 스와이프/핀치줌 라이트박스.

---

## 📁 구조

```
.
├── index.html
├── app.jsx
├── data/index.json          # 자동 생성 (편집 X)
├── media/
│   ├── diving/              # 다이빙 사진/동영상
│   ├── stamps/              # 우표 스캔
│   └── coins/               # 화폐 스캔
└── scripts/build_index.py   # 폴더 스캔 → data/index.json
```

## 📐 파일명 규칙

```
<국가코드 2자리>_<년도 4자리>_<인덱스 4자리>.<확장자>
```

| 항목 | 규칙 | 예시 |
| --- | --- | --- |
| 국가코드 | ISO-3166-1 alpha-2 소문자, 모르면 `00` | `kr`, `jp`, `00` |
| 년도 | 4자리, 모르면 `0000` | `2026`, `1988` |
| 인덱스 | 5자리, 같은 (국가, 년도) 안에서 자유 | `00001`, `00042` |

정렬 순서: **국가 → 년도 → 인덱스** (국가는 가나다순)

**예시**
```
media/diving/kr_2026_00001.jpg     # 한국, 2026, 1번
media/diving/ph_2025_00003.mp4     # 필리핀 2025, 3번 동영상
media/diving/ph_2025_00003.jpg     # 위 동영상의 썸네일 (자동 인식)
media/stamps/kr_1988_00001.jpg
media/coins/00_2020_00001.jpg      # 국가/년도 미상 가능
```

확장자: 이미지 `.jpg .jpeg .png .webp .gif .avif`, 비디오 `.mp4 .mov .webm .m4v`

## 🚀 새 파일 추가 워크플로우

```bash
# 1. 규칙대로 파일을 폴더에 넣기
cp my-photo.jpg media/diving/kr_2026_00001.jpg

# 2. 인덱스 재생성
python scripts/build_index.py

# 3. 푸시
git add . && git commit -m "add" && git push
```

## ✋ 모바일 제스처

- 그리드: **좌우 스와이프** — 같은 국가의 다른 사진 둘러보기
- 라이트박스(전체화면):
  - **좌우 스와이프** → 이전/다음
  - **두 손가락 핀치** → 확대/축소
  - **더블탭** → 2.5배 줌 토글
  - **위/아래 스와이프** → 닫기
- 키보드: `←` `→` 이동, `Esc` 닫기, `0` 줌 초기화

## 🆕 취미 종류 추가

1. `media/<새이름>/` 폴더 생성
2. `app.jsx` 의 `HOBBIES` 배열, `scripts/build_index.py` 의 `HOBBIES` 리스트에 추가
