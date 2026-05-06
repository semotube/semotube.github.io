// app.jsx — 메인 앱 컴포넌트
const { useState, useEffect, useMemo, useRef, useCallback } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "layout": "grid",
  "density": "comfortable",
  "showMap": true,
  "fontScale": 1
}/*EDITMODE-END*/;

// ─── 데이터 로딩 ────────────────────────────────────────────
function useData() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    fetch('data/index.json')
      .then(r => r.json())
      .then(setData)
      .catch(setError);
  }, []);
  return { data, error };
}

// ─── 유틸 ────────────────────────────────────────────
function fmtDate(s) {
  if (!s) return '';
  const [y, m, d] = s.split('-');
  return `${y}.${m}.${d}`;
}

function flagEmoji(code) {
  if (!code || code === 'EU') return '🇪🇺';
  return code.toUpperCase().replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt()));
}

// 모든 아이템을 평탄화 (홈 타임라인용)
function flattenItems(data) {
  if (!data) return [];
  const all = [];
  for (const [hobbyKey, hobby] of Object.entries(data.hobbies)) {
    for (const item of hobby.items) {
      all.push({ ...item, hobby: hobbyKey, hobbyName: hobby.name });
    }
  }
  return all.sort((a, b) => {
    const ad = a.date || (a.year ? `${a.year}-12-31` : '0000');
    const bd = b.date || (b.year ? `${b.year}-12-31` : '0000');
    return bd.localeCompare(ad);
  });
}

// ─── 헤더 ────────────────────────────────────────────
function Header({ route, navigate, search, setSearch }) {
  const tabs = [
    { id: 'home', label: 'Home', kr: '홈' },
    { id: 'freediving', label: 'Freediving', kr: '프리다이빙' },
    { id: 'stamps', label: 'Stamps', kr: '우표' },
    { id: 'coins', label: 'Coins', kr: '돈' },
  ];
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-black/70 border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between gap-4">
        <button onClick={() => navigate('home')} className="flex items-baseline gap-2 group">
          <span className="text-[15px] font-medium tracking-tight">나의취미</span>
          <span className="text-[11px] text-white/30 font-mono hidden sm:inline">/ semotube</span>
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => navigate(t.id)}
              className={`px-3 py-1.5 text-[13px] rounded-full transition-colors ${
                route.page === t.id
                  ? 'text-white bg-white/[0.08]'
                  : 'text-white/50 hover:text-white/90'
              }`}
            >
              {t.kr}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className={`flex items-center transition-all ${searchOpen ? 'w-44 sm:w-64' : 'w-9'}`}>
            <button
              onClick={() => setSearchOpen(o => !o)}
              className="w-9 h-9 flex items-center justify-center text-white/60 hover:text-white rounded-full"
              aria-label="검색"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" />
              </svg>
            </button>
            {searchOpen && (
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="국가 · 위치 · 태그..."
                className="flex-1 bg-transparent text-[13px] text-white placeholder-white/30 outline-none"
              />
            )}
          </div>
          <button
            onClick={() => setMobileNavOpen(o => !o)}
            className="md:hidden w-9 h-9 flex items-center justify-center text-white/60"
            aria-label="메뉴"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileNavOpen
                ? <path d="M18 6 6 18M6 6l12 12" />
                : <><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /></>}
            </svg>
          </button>
        </div>
      </div>

      {mobileNavOpen && (
        <nav className="md:hidden border-t border-white/[0.06] px-5 py-2 flex flex-col">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => { navigate(t.id); setMobileNavOpen(false); }}
              className={`py-3 text-left text-[14px] ${
                route.page === t.id ? 'text-white' : 'text-white/60'
              }`}
            >
              {t.kr}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}

// ─── 미디어 카드 ────────────────────────────────────────────
function MediaCard({ item, onClick, dense }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const isVideo = item.type === 'video' || item.youtubeId;

  return (
    <button
      onClick={onClick}
      className={`group relative block w-full overflow-hidden bg-white/[0.03] border border-white/[0.05] hover:border-white/20 transition-all rounded-md ${
        dense ? 'aspect-square' : 'aspect-[4/3]'
      }`}
    >
      {!errored ? (
        <img
          src={item.thumb || item.src}
          alt={item.description || item.point || ''}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
            loaded ? 'opacity-100' : 'opacity-0'
          } group-hover:scale-[1.02]`}
        />
      ) : (
        <Placeholder item={item} />
      )}

      {isVideo && (
        <div className="absolute top-2 right-2 px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-black/60 backdrop-blur text-white/90 rounded">
          ▶ video
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="text-[11px] text-white/70 font-mono uppercase tracking-wider mb-0.5">
          {flagEmoji(item.country_code)} {item.country}
        </div>
        <div className="text-[13px] text-white truncate">
          {item.point || item.description || (item.year ? `${item.year} · ${item.face_value}` : '')}
        </div>
      </div>
    </button>
  );
}

function Placeholder({ item }) {
  const seed = (item.id || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const hue = seed % 360;
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center"
      style={{
        background: `repeating-linear-gradient(45deg, hsl(0 0% 8%), hsl(0 0% 8%) 8px, hsl(0 0% 11%) 8px, hsl(0 0% 11%) 16px)`,
      }}
    >
      <div className="text-white/30 font-mono text-[10px] uppercase tracking-widest text-center px-3">
        <div>{item.country_code} · {item.type}</div>
        <div className="mt-1 text-white/20">{item.id?.slice(0, 18)}</div>
      </div>
    </div>
  );
}

// ─── 라이트박스 ────────────────────────────────────────────
function Lightbox({ items, index, onClose, onNav }) {
  const item = items[index];
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNav(1);
      if (e.key === 'ArrowLeft') onNav(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onNav]);

  if (!item) return null;
  const isVideo = item.type === 'video';
  const isYouTube = !!item.youtubeId;
  const [errored, setErrored] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col" onClick={onClose}>
      <div className="flex-1 flex items-center justify-center p-4 sm:p-12 relative" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => onNav(-1)}
          className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white/40 hover:text-white rounded-full hover:bg-white/[0.06]"
          aria-label="이전"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m15 18-6-6 6-6"/></svg>
        </button>

        <div className="max-w-5xl max-h-full flex items-center justify-center w-full">
          {isYouTube ? (
            <div className="aspect-video w-full">
              <iframe
                className="w-full h-full rounded-md"
                src={`https://www.youtube.com/embed/${item.youtubeId}?autoplay=1`}
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
          ) : isVideo ? (
            <video src={item.src} controls autoPlay className="max-h-[80vh] max-w-full rounded-md" onError={() => setErrored(true)} />
          ) : !errored ? (
            <img
              src={item.src}
              alt=""
              onError={() => setErrored(true)}
              className="max-h-[80vh] max-w-full object-contain rounded-md"
            />
          ) : (
            <div className="w-full max-w-2xl aspect-[4/3]">
              <Placeholder item={item} />
            </div>
          )}
        </div>

        <button
          onClick={() => onNav(1)}
          className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white/40 hover:text-white rounded-full hover:bg-white/[0.06]"
          aria-label="다음"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m9 18 6-6-6-6"/></svg>
        </button>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-white/60 hover:text-white rounded-full hover:bg-white/[0.06]"
          aria-label="닫기"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>

      <div className="border-t border-white/[0.06] px-5 sm:px-12 py-5 max-w-4xl mx-auto w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="text-[11px] text-white/40 font-mono uppercase tracking-widest mb-2">
              {flagEmoji(item.country_code)} {item.country}
              {item.location && <span> · {item.location}</span>}
              {item.point && <span> · {item.point}</span>}
            </div>
            <div className="text-lg sm:text-xl text-white tracking-tight">
              {item.description || item.point || `${item.country} ${item.year || ''}`}
            </div>
          </div>
          <div className="text-[12px] font-mono text-white/40 space-y-1 text-right">
            {item.date && <div>{fmtDate(item.date)}</div>}
            {item.year && !item.date && <div>{item.year}</div>}
            {item.depth_m && <div>{item.depth_m}m</div>}
            {item.face_value && <div>{item.face_value}</div>}
            <div>{index + 1} / {items.length}</div>
          </div>
        </div>
        {item.tags?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {item.tags.map(t => (
              <span key={t} className="text-[11px] font-mono text-white/40 px-2 py-0.5 border border-white/10 rounded-full">#{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 홈 (타임라인) ────────────────────────────────────────────
function HomePage({ data, onItemClick, search }) {
  const allItems = useMemo(() => flattenItems(data), [data]);
  const filtered = useMemo(() => filterBySearch(allItems, search), [allItems, search]);

  // 연도별 그룹핑
  const grouped = useMemo(() => {
    const groups = {};
    for (const it of filtered) {
      const y = it.date ? it.date.slice(0, 4) : (it.year ? String(it.year) : '?');
      (groups[y] ||= []).push(it);
    }
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const stats = useMemo(() => {
    const counts = {};
    for (const [k, h] of Object.entries(data?.hobbies || {})) {
      counts[k] = { name: h.name, count: h.items.length };
    }
    return counts;
  }, [data]);

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8 sm:py-16">
      <div className="mb-12 sm:mb-20">
        <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/30 mb-4">/ archive · 2026</div>
        <h1 className="text-4xl sm:text-6xl lg:text-7xl tracking-tight font-light leading-[1.05] text-white max-w-3xl">
          기록되지 않은 취미는<br/>
          <span className="text-white/40">사라진다.</span>
        </h1>
        <p className="mt-6 text-white/50 max-w-xl text-[15px] leading-relaxed">
          프리다이빙으로 만난 바다, 손에 쥐어진 우표와 동전.
          하나씩 모아두는 개인 아카이브.
        </p>

        <div className="mt-10 grid grid-cols-3 gap-px bg-white/[0.06] border border-white/[0.06] rounded-md overflow-hidden max-w-2xl">
          {Object.entries(stats).map(([k, v]) => (
            <div key={k} className="bg-black px-4 sm:px-6 py-5">
              <div className="text-[11px] font-mono uppercase tracking-widest text-white/40">{v.name}</div>
              <div className="mt-2 text-2xl sm:text-3xl font-light text-white tracking-tight">{v.count}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/40">/ 최근 추가</h2>
          <span className="text-[11px] font-mono text-white/30">{filtered.length} items</span>
        </div>

        {grouped.length === 0 ? (
          <EmptyState search={search} />
        ) : (
          grouped.map(([year, items]) => (
            <section key={year} className="mb-12 border-t border-white/[0.06] pt-6">
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 md:col-span-2">
                  <div className="md:sticky md:top-20">
                    <div className="text-3xl sm:text-4xl font-light text-white tracking-tight">{year}</div>
                    <div className="text-[11px] font-mono text-white/30 mt-1">{items.length} items</div>
                  </div>
                </div>
                <div className="col-span-12 md:col-span-10">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {items.map((it, i) => (
                      <MediaCard
                        key={it.id}
                        item={it}
                        onClick={() => onItemClick(filtered, filtered.indexOf(it))}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

function EmptyState({ search }) {
  return (
    <div className="border border-dashed border-white/10 rounded-md py-20 text-center">
      <div className="text-white/30 text-[13px]">
        {search ? `"${search}" 와 일치하는 항목 없음` : '아직 항목이 없습니다'}
      </div>
    </div>
  );
}

function filterBySearch(items, q) {
  if (!q) return items;
  const needle = q.toLowerCase();
  return items.filter(it => {
    const hay = [
      it.country, it.country_code, it.location, it.point,
      it.description, ...(it.tags || []),
      it.face_value, String(it.year || ''),
    ].filter(Boolean).join(' ').toLowerCase();
    return hay.includes(needle);
  });
}

window.MediaCard = MediaCard;
window.Lightbox = Lightbox;
window.Header = Header;
window.HomePage = HomePage;
window.useData = useData;
window.flattenItems = flattenItems;
window.filterBySearch = filterBySearch;
window.flagEmoji = flagEmoji;
window.fmtDate = fmtDate;
window.Placeholder = Placeholder;
window.TWEAK_DEFAULTS = TWEAK_DEFAULTS;
