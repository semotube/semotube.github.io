// app.jsx — 나의취미 갤러리 (라이트 테마, 파일명 기반)
const { useState, useEffect, useMemo, useRef, useCallback } = React;

// ─── 국가코드 → 한글명 + 국기 ─────────────────────────────
const COUNTRIES = {
  kr: ['대한민국', '🇰🇷'], jp: ['일본', '🇯🇵'], cn: ['중국', '🇨🇳'], tw: ['대만', '🇹🇼'],
  us: ['미국', '🇺🇸'], ca: ['캐나다', '🇨🇦'], mx: ['멕시코', '🇲🇽'],
  gb: ['영국', '🇬🇧'], fr: ['프랑스', '🇫🇷'], de: ['독일', '🇩🇪'], it: ['이탈리아', '🇮🇹'],
  es: ['스페인', '🇪🇸'], nl: ['네덜란드', '🇳🇱'], pt: ['포르투갈', '🇵🇹'],
  se: ['스웨덴', '🇸🇪'], no: ['노르웨이', '🇳🇴'], fi: ['핀란드', '🇫🇮'],
  ch: ['스위스', '🇨🇭'], at: ['오스트리아', '🇦🇹'], ru: ['러시아', '🇷🇺'],
  ph: ['필리핀', '🇵🇭'], id: ['인도네시아', '🇮🇩'], th: ['태국', '🇹🇭'],
  vn: ['베트남', '🇻🇳'], my: ['말레이시아', '🇲🇾'], sg: ['싱가포르', '🇸🇬'],
  in: ['인도', '🇮🇳'], eg: ['이집트', '🇪🇬'], ma: ['모로코', '🇲🇦'],
  za: ['남아프리카공화국', '🇿🇦'], au: ['호주', '🇦🇺'], nz: ['뉴질랜드', '🇳🇿'],
  br: ['브라질', '🇧🇷'], ar: ['아르헨티나', '🇦🇷'], eu: ['유로존', '🇪🇺'],
  '00': ['미상', '🏳️'],
};
const countryName = (cc) => (COUNTRIES[cc?.toLowerCase()] || [cc?.toUpperCase() || '미상', '🏳️'])[0];
const countryFlag = (cc) => (COUNTRIES[cc?.toLowerCase()] || [cc?.toUpperCase() || '미상', '🏳️'])[1];

const HOBBIES = [
  { id: 'diving', label: '다이빙' },
  { id: 'stamps', label: '우표' },
  { id: 'coins',  label: '화폐' },
];

const VIDEO_EXTS = new Set(['mp4', 'mov', 'webm', 'm4v']);
const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif']);

// ─── 파일명 → 메타 파싱 ─────────────────────────────────
//  cc_yyyy_nnnn.ext   (cc=2자, yyyy=4자, nnnn=4자)
const FNAME_RE = /^([a-z0-9]{2})_(\d{4})_(\d{4})\.([a-z0-9]+)$/i;

function parseItem(hobby, filename, thumbsByStem) {
  const m = FNAME_RE.exec(filename);
  if (!m) return null;
  const [, cc, yyyy, nnnn, ext] = m;
  const lower = ext.toLowerCase();
  const isVideo = VIDEO_EXTS.has(lower);
  const isImage = IMAGE_EXTS.has(lower);
  if (!isVideo && !isImage) return null;
  const stem = `${cc}_${yyyy}_${nnnn}`;
  return {
    id: `${hobby}_${stem}`,
    hobby,
    cc: cc.toLowerCase(),
    year: parseInt(yyyy, 10),
    seq: parseInt(nnnn, 10),
    type: isVideo ? 'video' : 'image',
    src: `media/${hobby}/${filename}`,
    thumb: isVideo ? (thumbsByStem[stem] ? `media/${hobby}/${thumbsByStem[stem]}` : `media/${hobby}/${filename}`) : `media/${hobby}/${filename}`,
    filename,
  };
}

// ─── 데이터 로드 (data/index.json: { diving:[...], stamps:[...], coins:[...] }) ──
async function loadIndex() {
  try {
    const res = await fetch('data/index.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('no index');
    const j = await res.json();
    return j;
  } catch (e) {
    console.warn('data/index.json 없음 — 데모 데이터 사용', e);
    return DEMO;
  }
}

function processFiles(hobby, files) {
  // 비디오와 동일 stem 의 이미지가 있으면 → 비디오 썸네일로 사용
  const thumbs = {};
  for (const fn of files) {
    const m = FNAME_RE.exec(fn);
    if (!m) continue;
    const ext = m[4].toLowerCase();
    if (IMAGE_EXTS.has(ext)) thumbs[`${m[1]}_${m[2]}_${m[3]}`] = fn;
  }
  // 비디오 stem 인 경우엔 그 이미지를 thumb 으로, 아니면 본인 사용
  const videoStems = new Set();
  for (const fn of files) {
    const m = FNAME_RE.exec(fn);
    if (m && VIDEO_EXTS.has(m[4].toLowerCase())) videoStems.add(`${m[1]}_${m[2]}_${m[3]}`);
  }
  const items = [];
  for (const fn of files) {
    const m = FNAME_RE.exec(fn);
    if (!m) continue;
    const stem = `${m[1]}_${m[2]}_${m[3]}`;
    const ext = m[4].toLowerCase();
    // 비디오의 썸네일 이미지는 별도 항목으로 만들지 않음
    if (IMAGE_EXTS.has(ext) && videoStems.has(stem)) continue;
    const item = parseItem(hobby, fn, thumbs);
    if (item) items.push(item);
  }
  return items;
}

// 데모 데이터 (data/index.json 부재 시)
const DEMO = {
  diving: ['kr_2024_0001.jpg', 'kr_2024_0002.jpg', 'ph_2025_0001.jpg', 'ph_2025_0002.jpg', 'ph_2025_0003.jpg', 'id_2024_0001.jpg', 'eg_2024_0001.jpg', 'eg_2024_0002.jpg', 'eg_2024_0003.jpg', 'jp_2023_0001.jpg'],
  stamps: ['kr_1957_0001.jpg', 'kr_1988_0001.jpg', 'kr_1988_0002.jpg', 'jp_1964_0001.jpg', 'us_1969_0001.jpg', 'gb_1953_0001.jpg', 'fr_1944_0001.jpg', 'de_1972_0001.jpg'],
  coins:  ['kr_1983_0001.jpg', 'kr_2007_0001.jpg', 'jp_2000_0001.jpg', 'us_1976_0001.jpg', 'eu_2002_0001.jpg', 'gb_1971_0001.jpg', 'cn_1980_0001.jpg', '00_2020_0001.jpg'],
};

// ═══════════════════════════════════════════════════════════
//  헤더 — 다이빙 / 우표 / 화폐 탭
// ═══════════════════════════════════════════════════════════
function Header({ route, navigate }) {
  return (
    <header className="sticky top-0 z-30 bg-paper/85 backdrop-blur-xl border-b border-line">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-14 sm:h-16 flex items-center">
        <nav className="flex items-center gap-1 sm:gap-2">
          {HOBBIES.map((h, i) => {
            const active = route.page === h.id;
            return (
              <React.Fragment key={h.id}>
                {i > 0 && <span className="text-line text-lg select-none">/</span>}
                <button
                  onClick={() => navigate(h.id)}
                  className={`px-2 sm:px-3 py-1.5 text-[17px] sm:text-[18px] font-semibold tracking-tight rounded-md transition-colors ${
                    active ? 'text-ink' : 'text-muted hover:text-ink2'
                  }`}>
                  {h.label}
                </button>
              </React.Fragment>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════
//  페이지 — 국가별 가로 스크롤 캐러셀
// ═══════════════════════════════════════════════════════════
function HobbyPage({ hobby, files, openLightbox }) {
  const items = useMemo(() => processFiles(hobby, files), [hobby, files]);

  // 국가별 그룹 → 항목 많은 순
  const byCountry = useMemo(() => {
    const g = {};
    for (const it of items) (g[it.cc] ||= []).push(it);
    for (const k of Object.keys(g)) g[k].sort((a, b) => (b.year - a.year) || (b.seq - a.seq));
    return Object.entries(g)
      .map(([cc, arr]) => ({ cc, items: arr }))
      .sort((a, b) => b.items.length - a.items.length);
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 text-center">
        <div className="text-muted text-[15px]">
          <code className="font-mono text-[13px] bg-paper2 px-2 py-1 rounded">media/{hobby}/</code> 폴더에 파일을 추가하세요.
        </div>
        <div className="text-muted text-[13px] mt-3 font-mono">
          파일명 규칙: <span className="text-ink">국가코드_년도_인덱스.확장자</span>
          <br/>예: kr_2026_00001.jpg
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-6 pb-24">
      {byCountry.map(grp => (
        <CountryRow key={grp.cc} hobby={hobby} cc={grp.cc} items={grp.items} openLightbox={openLightbox} />
      ))}
    </div>
  );
}

function CountryRow({ hobby, cc, items, openLightbox }) {
  const scrollerRef = useRef(null);

  return (
    <section className="mb-12">
      <div className="flex items-baseline gap-3 mb-4">
        <span className="text-2xl">{countryFlag(cc)}</span>
        <h2 className="text-[22px] sm:text-[24px] font-bold tracking-tight text-ink">{countryName(cc)}</h2>
        <span className="text-[14px] font-mono text-muted ml-auto">{items.length}</span>
      </div>
      {/* 가로 스크롤 캐러셀 — 손가락 스와이프 */}
      <div
        ref={scrollerRef}
        className="flex gap-3 overflow-x-auto snap-x-mandatory no-scrollbar -mx-5 sm:-mx-8 px-5 sm:px-8 pb-2"
        style={{ scrollPaddingLeft: '20px' }}
      >
        {items.map((it, idx) => (
          <button
            key={it.id}
            onClick={() => openLightbox(items, idx)}
            className="snap-start flex-shrink-0 group relative overflow-hidden bg-paper2 border border-line hover:border-ink2/40 transition-colors rounded-lg shadow-sm"
            style={{ width: 'min(78vw, 320px)', aspectRatio: '4/3' }}
          >
            <SmartImage src={it.thumb} item={it} />
            {it.type === 'video' && (
              <div className="absolute top-2.5 right-2.5 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider bg-ink/85 text-paper rounded">
                ▶ 동영상
              </div>
            )}
            <div className="absolute bottom-0 inset-x-0 px-3 py-2 bg-gradient-to-t from-black/40 to-transparent text-paper text-[13px] font-medium tracking-tight">
              {it.year}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function SmartImage({ src, item }) {
  const [errored, setErrored] = useState(false);
  if (errored) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-paper2 to-line text-ink2">
        <div className="text-3xl">{countryFlag(item.cc)}</div>
        <div className="mt-1.5 text-[13px] font-semibold">{countryName(item.cc)}</div>
        <div className="text-[11px] font-mono text-muted mt-0.5">{item.year} · #{String(item.seq).padStart(4, '0')}</div>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setErrored(true)}
      className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
    />
  );
}

// ═══════════════════════════════════════════════════════════
//  라이트박스 — 핀치줌 + 스와이프
// ═══════════════════════════════════════════════════════════
function Lightbox({ items, index, onClose, onIndex }) {
  const [zoom, setZoom] = useState({ scale: 1, tx: 0, ty: 0 });
  const containerRef = useRef(null);
  const stateRef = useRef({
    pointers: new Map(),    // pointerId -> {x, y}
    startDist: 0,
    startScale: 1,
    startMid: { x: 0, y: 0 },
    startTx: 0, startTy: 0,
    panStart: null,         // {x, y} for single-pointer pan when zoomed
    swipeStart: null,       // {x, y, time} for swipe-to-nav when not zoomed
    lastTap: 0,
  });

  const item = items[index];

  const reset = useCallback(() => setZoom({ scale: 1, tx: 0, ty: 0 }), []);

  useEffect(() => { reset(); }, [index, reset]);

  // 키보드 네비게이션
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && index > 0) onIndex(index - 1);
      else if (e.key === 'ArrowRight' && index < items.length - 1) onIndex(index + 1);
      else if (e.key === '0') reset();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, items.length, onClose, onIndex, reset]);

  // 포인터 기반 핀치/팬/스와이프
  const handlePointerDown = (e) => {
    const el = containerRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    const s = stateRef.current;
    s.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (s.pointers.size === 2) {
      // 핀치 시작
      const pts = [...s.pointers.values()];
      s.startDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      s.startScale = zoom.scale;
      s.startMid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      s.startTx = zoom.tx; s.startTy = zoom.ty;
      s.swipeStart = null;
    } else if (s.pointers.size === 1) {
      if (zoom.scale > 1.01) {
        s.panStart = { x: e.clientX - zoom.tx, y: e.clientY - zoom.ty };
        s.swipeStart = null;
      } else {
        s.swipeStart = { x: e.clientX, y: e.clientY, time: Date.now() };
        s.panStart = null;
        // 더블탭 → 줌
        const now = Date.now();
        if (now - s.lastTap < 300) {
          if (zoom.scale > 1.01) reset();
          else setZoom({ scale: 2.5, tx: 0, ty: 0 });
          s.lastTap = 0;
        } else {
          s.lastTap = now;
        }
      }
    }
  };

  const handlePointerMove = (e) => {
    const s = stateRef.current;
    if (!s.pointers.has(e.pointerId)) return;
    s.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (s.pointers.size === 2) {
      const pts = [...s.pointers.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const newScale = Math.min(5, Math.max(1, s.startScale * (dist / s.startDist)));
      // 핀치 중심 유지 (간이)
      setZoom({ scale: newScale, tx: s.startTx, ty: s.startTy });
    } else if (s.pointers.size === 1) {
      if (s.panStart) {
        // 줌 상태에서 팬
        setZoom(z => ({ ...z, tx: e.clientX - s.panStart.x, ty: e.clientY - s.panStart.y }));
      }
    }
  };

  const handlePointerUp = (e) => {
    const s = stateRef.current;
    const start = s.swipeStart;
    s.pointers.delete(e.pointerId);

    // 스와이프 → 네비게이션 (줌 상태 아닐 때, 단일 포인터)
    if (start && s.pointers.size === 0 && zoom.scale <= 1.01) {
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      const dt = Date.now() - start.time;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.3 && dt < 600) {
        if (dx < 0 && index < items.length - 1) onIndex(index + 1);
        else if (dx > 0 && index > 0) onIndex(index - 1);
      } else if (Math.abs(dy) > 100 && Math.abs(dy) > Math.abs(dx) * 1.5) {
        // 위/아래 스와이프 → 닫기
        onClose();
      }
    }
    s.swipeStart = null;
    s.panStart = null;
  };

  // 휠 줌 (데스크탑)
  const handleWheel = (e) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const delta = -e.deltaY * 0.005;
    setZoom(z => ({ ...z, scale: Math.min(5, Math.max(1, z.scale * (1 + delta))) }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/95 backdrop-blur-md flex flex-col" onWheel={handleWheel}>
      {/* 상단바 */}
      <div className="flex items-center justify-between px-4 sm:px-6 h-14 text-paper border-b border-paper/10">
        <div className="flex items-center gap-3 text-[14px]">
          <span className="text-xl">{countryFlag(item.cc)}</span>
          <span className="font-semibold">{countryName(item.cc)}</span>
          <span className="text-paper/60">·</span>
          <span className="font-mono">{item.year}</span>
          <span className="text-paper/60">·</span>
          <span className="font-mono text-paper/60">#{String(item.seq).padStart(4, '0')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-mono text-paper/60 mr-2">{index + 1} / {items.length}</span>
          {zoom.scale > 1.01 && (
            <button onClick={reset} className="px-3 py-1.5 text-[13px] font-medium bg-paper/15 hover:bg-paper/25 rounded-full">초기화</button>
          )}
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center hover:bg-paper/15 rounded-full" aria-label="닫기">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
      </div>

      {/* 본문 */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {item.type === 'video' ? (
            <video
              src={item.src}
              controls
              autoPlay
              playsInline
              className="lb-img max-w-full max-h-full pointer-events-auto"
              style={{ transform: `translate(${zoom.tx}px, ${zoom.ty}px) scale(${zoom.scale})` }}
            />
          ) : (
            <LightboxImage src={item.src} item={item} zoom={zoom} />
          )}
        </div>

        {/* 좌/우 화살표 (데스크탑) */}
        {index > 0 && (
          <button
            onClick={() => onIndex(index - 1)}
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-paper/15 hover:bg-paper/30 text-paper backdrop-blur"
            aria-label="이전">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
          </button>
        )}
        {index < items.length - 1 && (
          <button
            onClick={() => onIndex(index + 1)}
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-paper/15 hover:bg-paper/30 text-paper backdrop-blur"
            aria-label="다음">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        )}

        {/* 모바일 안내 — 첫 진입 시만 흐릿하게 */}
        {zoom.scale <= 1.01 && (
          <div className="sm:hidden absolute bottom-4 inset-x-0 text-center text-paper/50 text-[12px] font-mono pointer-events-none">
            ← 좌우 스와이프 · 더블탭 줌 · 두손가락 핀치 ↓ 아래로 닫기
          </div>
        )}
      </div>
    </div>
  );
}

function LightboxImage({ src, item, zoom }) {
  const [errored, setErrored] = useState(false);
  useEffect(() => { setErrored(false); }, [src]);
  if (errored) {
    return (
      <div className="lb-img pointer-events-auto w-[80vw] max-w-md aspect-[4/3] flex flex-col items-center justify-center bg-paper2 rounded-lg shadow-2xl text-ink"
        style={{ transform: `translate(${zoom.tx}px, ${zoom.ty}px) scale(${zoom.scale})` }}>
        <div className="text-5xl">{countryFlag(item.cc)}</div>
        <div className="mt-3 text-[16px] font-semibold">{countryName(item.cc)}</div>
        <div className="text-[13px] font-mono text-muted mt-1">{item.year} · #{String(item.seq).padStart(4, '0')}</div>
        <div className="text-[12px] text-muted mt-3 italic">파일을 찾을 수 없음</div>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt=""
      onError={() => setErrored(true)}
      draggable={false}
      className="lb-img pointer-events-auto max-w-full max-h-full object-contain"
      style={{ transform: `translate(${zoom.tx}px, ${zoom.ty}px) scale(${zoom.scale})` }}
    />
  );
}

// ═══════════════════════════════════════════════════════════
//  앱
// ═══════════════════════════════════════════════════════════
function App() {
  const [route, setRoute] = useState({ page: 'diving' });
  const [data, setData] = useState(null);
  const [lightbox, setLightbox] = useState(null); // { items, index }

  useEffect(() => {
    loadIndex().then(setData);
  }, []);

  // 해시 라우팅
  useEffect(() => {
    const apply = () => {
      const hash = window.location.hash.replace('#', '');
      setRoute({ page: HOBBIES.find(h => h.id === hash) ? hash : 'diving' });
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, []);

  const navigate = useCallback((page) => {
    window.location.hash = page === 'diving' ? '' : page;
    setRoute({ page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openLightbox = useCallback((items, index) => setLightbox({ items, index }), []);

  // body 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = lightbox ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [lightbox]);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted text-[14px] font-mono">불러오는 중…</div>
    );
  }

  const files = data[route.page] || [];

  return (
    <div className="min-h-screen">
      <Header route={route} navigate={navigate} />
      <main>
        <HobbyPage hobby={route.page} files={files} openLightbox={openLightbox} />
      </main>
      {lightbox && (
        <Lightbox
          items={lightbox.items}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onIndex={(i) => setLightbox(lb => ({ ...lb, index: i }))}
        />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
