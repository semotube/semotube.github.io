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
//  cc_yyyy_nnnnn.ext   (cc=2자, yyyy=4자, nnnnn=5자)
const FNAME_RE = /^([a-z0-9]{2})_(\d{4})_(\d{5})\.([a-z0-9]+)$/i;

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

// ─── 데이터 로드 ────────────────────────────────────────────
async function loadIndex() {
  const url = 'data/index.json';
  const t0 = performance.now();
  try {
    const res = await fetch(url + '?t=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const j = await res.json();
    return { data: j, source: url, error: null, ms: Math.round(performance.now() - t0) };
  } catch (e) {
    console.warn('data/index.json 로드 실패 — 데모 사용', e);
    return { data: DEMO, source: '(데모 폴백)', error: String(e.message || e), ms: Math.round(performance.now() - t0) };
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

function Header({ route, navigate, counts }) {
  return (
    <header className="sticky top-0 z-30 bg-paper/85 backdrop-blur-xl border-b border-line">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-14 sm:h-16 flex items-center">
        <nav className="flex items-center gap-1 sm:gap-2">
          {HOBBIES.map((h, i) => {
            const active = route.page === h.id;
            const n = counts?.[h.id] ?? 0;
            return (
              <React.Fragment key={h.id}>
                {i > 0 && <span className="text-line text-lg select-none">/</span>}
                <button
                  onClick={() => navigate(h.id)}
                  className={`px-2 sm:px-3 py-1.5 text-[17px] sm:text-[18px] font-semibold tracking-tight rounded-md transition-colors ${
                    active ? 'text-ink' : 'text-muted hover:text-ink2'
                  }`}>
                  {h.label}<span className={`ml-0.5 text-[12px] sm:text-[13px] font-mono font-medium ${active ? 'text-muted' : 'text-muted/70'}`}>({n})</span>
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
          <br/>예: kr_2026_0001.jpg
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
        <div className="text-[11px] font-mono text-muted mt-0.5">{item.year} · #{String(item.seq).padStart(5, '0')}</div>
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
//  라이트박스 — 가로 스크롤스냅 + 핀치줌
// ═══════════════════════════════════════════════════════════
function Lightbox({ items, index, onClose, onIndex }) {
  const scrollerRef = useRef(null);
  const [zoomedIdx, setZoomedIdx] = useState(-1);
  const item = items[index];

  // 외부에서 index 변경 시(키보드/화살표) 해당 패널로 스크롤
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const target = el.children[index];
    if (target) {
      const targetLeft = target.offsetLeft;
      if (Math.abs(el.scrollLeft - targetLeft) > 4) {
        el.scrollTo({ left: targetLeft, behavior: 'smooth' });
      }
    }
  }, [index]);

  // 스크롤 → index 동기화 (스냅 정착 후)
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const w = el.clientWidth;
        const i = Math.round(el.scrollLeft / w);
        if (i !== index && i >= 0 && i < items.length) onIndex(i);
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => { el.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, [index, items.length, onIndex]);

  // 키보드
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && index > 0) onIndex(index - 1);
      else if (e.key === 'ArrowRight' && index < items.length - 1) onIndex(index + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, items.length, onClose, onIndex]);

  const isZoomed = zoomedIdx === index;

  return (
    <div className="fixed inset-0 z-50 bg-ink/95 backdrop-blur-md flex flex-col">
      {/* 상단바 */}
      <div className="flex items-center justify-between px-4 sm:px-6 h-14 text-paper border-b border-paper/10 shrink-0">
        <div className="flex items-center gap-3 text-[14px] min-w-0">
          <span className="text-xl">{countryFlag(item.cc)}</span>
          <span className="font-semibold truncate">{countryName(item.cc)}</span>
          <span className="text-paper/60">·</span>
          <span className="font-mono">{item.year}</span>
          <span className="text-paper/60 hidden sm:inline">·</span>
          <span className="font-mono text-paper/60 hidden sm:inline">#{String(item.seq).padStart(5, '0')}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[13px] font-mono text-paper/60 mr-2">{index + 1} / {items.length}</span>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center hover:bg-paper/15 rounded-full" aria-label="닫기">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
      </div>

      {/* 본문 — 가로 스크롤스냅 */}
      <div className="flex-1 relative min-h-0">
        <div
          ref={scrollerRef}
          className={`absolute inset-0 flex no-scrollbar ${isZoomed ? 'overflow-hidden' : 'overflow-x-auto overflow-y-hidden snap-x-mandatory'}`}
          style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
        >
          {items.map((it, i) => (
            <LightboxPanel
              key={i}
              item={it}
              active={i === index}
              zoomed={zoomedIdx === i}
              setZoomed={(z) => setZoomedIdx(z ? i : -1)}
            />
          ))}
        </div>

        {/* 좌/우 화살표 (데스크탑) */}
        {index > 0 && !isZoomed && (
          <button onClick={() => onIndex(index - 1)}
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-paper/15 hover:bg-paper/30 text-paper backdrop-blur z-10"
            aria-label="이전">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
          </button>
        )}
        {index < items.length - 1 && !isZoomed && (
          <button onClick={() => onIndex(index + 1)}
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-paper/15 hover:bg-paper/30 text-paper backdrop-blur z-10"
            aria-label="다음">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        )}

        {!isZoomed && (
          <div className="sm:hidden absolute bottom-3 inset-x-0 text-center text-paper/50 text-[11px] font-mono pointer-events-none">
            ← 좌우 스와이프 · 더블탭/핀치 줌
          </div>
        )}
      </div>
    </div>
  );
}

function LightboxPanel({ item, active, zoomed, setZoomed }) {
  const [zoom, setZoom] = useState({ scale: 1, tx: 0, ty: 0 });
  const ref = useRef(null);
  const stateRef = useRef({ pointers: new Map(), startDist: 0, startScale: 1, startTx: 0, startTy: 0, panStart: null, lastTap: 0 });

  // 다른 패널로 이동하면 줌 리셋
  useEffect(() => { if (!active) { setZoom({ scale: 1, tx: 0, ty: 0 }); setZoomed(false); } }, [active, setZoomed]);

  const reset = () => { setZoom({ scale: 1, tx: 0, ty: 0 }); setZoomed(false); };

  const onPointerDown = (e) => {
    if (item.type === 'video') return;
    const el = ref.current; if (!el) return;
    el.setPointerCapture(e.pointerId);
    const s = stateRef.current;
    s.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (s.pointers.size === 2) {
      const pts = [...s.pointers.values()];
      s.startDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      s.startScale = zoom.scale; s.startTx = zoom.tx; s.startTy = zoom.ty;
    } else if (s.pointers.size === 1) {
      if (zoom.scale > 1.01) {
        s.panStart = { x: e.clientX - zoom.tx, y: e.clientY - zoom.ty };
      } else {
        const now = Date.now();
        if (now - s.lastTap < 300) {
          if (zoom.scale > 1.01) reset();
          else { setZoom({ scale: 2.5, tx: 0, ty: 0 }); setZoomed(true); }
          s.lastTap = 0;
        } else { s.lastTap = now; }
      }
    }
  };

  const onPointerMove = (e) => {
    const s = stateRef.current;
    if (!s.pointers.has(e.pointerId)) return;
    s.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (s.pointers.size === 2) {
      const pts = [...s.pointers.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const newScale = Math.min(5, Math.max(1, s.startScale * (dist / s.startDist)));
      setZoom({ scale: newScale, tx: s.startTx, ty: s.startTy });
      setZoomed(newScale > 1.01);
    } else if (s.pointers.size === 1 && s.panStart) {
      setZoom(z => ({ ...z, tx: e.clientX - s.panStart.x, ty: e.clientY - s.panStart.y }));
    }
  };

  const onPointerUp = (e) => {
    const s = stateRef.current;
    s.pointers.delete(e.pointerId);
    if (s.pointers.size === 0) s.panStart = null;
    if (zoom.scale <= 1.01) setZoomed(false);
  };

  return (
    <div
      className="shrink-0 w-full h-full flex items-center justify-center snap-center relative"
      style={{ touchAction: zoomed ? 'none' : 'pan-x' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      ref={ref}
    >
      {item.type === 'video' ? (
        <video src={item.src} controls autoPlay={active} playsInline className="max-w-full max-h-full" />
      ) : (
        <LightboxImage src={item.src} item={item} zoom={zoom} />
      )}
      {zoomed && active && (
        <button onClick={reset}
          className="absolute top-3 right-3 px-3 py-1.5 text-[12px] font-medium bg-paper/15 hover:bg-paper/25 rounded-full text-paper backdrop-blur">
          줌 초기화
        </button>
      )}
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
        <div className="text-[13px] font-mono text-muted mt-1">{item.year} · #{String(item.seq).padStart(5, '0')}</div>
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
  const [load, setLoad] = useState(null);
  const [lightbox, setLightbox] = useState(null); // { items, index }

  useEffect(() => {
    loadIndex().then(setLoad);
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

  const counts = useMemo(() => {
    if (!load?.data) return {};
    const c = {};
    for (const h of HOBBIES) c[h.id] = processFiles(h.id, load.data[h.id] || []).length;
    return c;
  }, [load]);

  if (!load) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted text-[14px] font-mono">불러오는 중…</div>
    );
  }

  const files = load.data[route.page] || [];

  return (
    <div className="min-h-screen">
      <Header route={route} navigate={navigate} counts={counts} />
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
