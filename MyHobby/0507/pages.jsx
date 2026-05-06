// pages.jsx — 카테고리별 페이지 + 지도

const { useState: useStateP, useEffect: useEffectP, useMemo: useMemoP, useRef: useRefP } = React;

// ─── 페이지 헤더 ────────────────────────────────────────────
function PageHero({ kicker, title, subtitle, count }) {
  return (
    <div className="border-b border-white/[0.06] pb-8 mb-10">
      <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/30 mb-3">{kicker}</div>
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-white">{title}</h1>
        <div className="text-[12px] font-mono text-white/40 pb-2">{count} items</div>
      </div>
      {subtitle && <p className="mt-3 text-white/50 text-[14px] max-w-xl">{subtitle}</p>}
    </div>
  );
}

// ─── 국가 필터 칩 ────────────────────────────────────────────
function CountryFilter({ items, value, onChange }) {
  const counts = useMemoP(() => {
    const c = {};
    for (const it of items) c[it.country] = (c[it.country] || 0) + 1;
    return c;
  }, [items]);
  const countries = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="flex flex-wrap gap-1.5 mb-8">
      <FilterChip active={value === null} onClick={() => onChange(null)}>
        ALL <span className="opacity-50 ml-1">{items.length}</span>
      </FilterChip>
      {countries.map(([country, count]) => {
        const code = items.find(i => i.country === country)?.country_code;
        return (
          <FilterChip key={country} active={value === country} onClick={() => onChange(country)}>
            <span className="mr-1">{flagEmoji(code)}</span>
            {country} <span className="opacity-50 ml-1">{count}</span>
          </FilterChip>
        );
      })}
    </div>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-[12px] rounded-full border transition-colors ${
        active
          ? 'bg-white text-black border-white'
          : 'border-white/10 text-white/60 hover:text-white hover:border-white/30'
      }`}
    >
      {children}
    </button>
  );
}

// ─── 프리다이빙 페이지 ────────────────────────────────────────────
function FreedivingPage({ data, onItemClick, search, tweaks }) {
  const items = data?.hobbies?.freediving?.items || [];
  const filtered = useMemoP(() => filterBySearch(items, search), [items, search]);
  const [country, setCountry] = useStateP(null);

  const countryFiltered = country ? filtered.filter(i => i.country === country) : filtered;

  // 국가별 그룹핑
  const byCountry = useMemoP(() => {
    const g = {};
    for (const it of countryFiltered) {
      const key = `${it.country_code}|${it.country}`;
      (g[key] ||= []).push(it);
    }
    return Object.entries(g).map(([k, v]) => {
      const [code, name] = k.split('|');
      return { code, name, items: v };
    }).sort((a, b) => b.items.length - a.items.length);
  }, [countryFiltered]);

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8 sm:py-12">
      <PageHero
        kicker="/ Freediving"
        title="프리다이빙"
        subtitle="국가별, 다이빙 포인트별로 정리된 수중 기록."
        count={items.length}
      />

      {tweaks.showMap && (
        <DivingMap
          items={countryFiltered.filter(i => i.lat && i.lng)}
          onItemClick={(it) => onItemClick(countryFiltered, countryFiltered.indexOf(it))}
        />
      )}

      <CountryFilter items={filtered} value={country} onChange={setCountry} />

      {byCountry.length === 0 ? (
        <EmptyState search={search} />
      ) : (
        byCountry.map(grp => {
          // 위치별 그룹핑
          const byLocation = {};
          for (const it of grp.items) {
            (byLocation[it.location || '—'] ||= []).push(it);
          }
          return (
            <section key={grp.code} className="mb-16 border-t border-white/[0.06] pt-8">
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-2xl">{flagEmoji(grp.code)}</span>
                <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight">{grp.name}</h2>
                <span className="text-[11px] font-mono text-white/30">{grp.items.length} items</span>
              </div>
              {Object.entries(byLocation).map(([loc, locItems]) => (
                <div key={loc} className="mb-8">
                  <div className="text-[11px] font-mono uppercase tracking-widest text-white/40 mb-3">
                    ─ {loc}
                  </div>
                  <ItemGrid items={locItems} all={countryFiltered} layout={tweaks.layout} density={tweaks.density} onItemClick={onItemClick} />
                </div>
              ))}
            </section>
          );
        })
      )}
    </div>
  );
}

// ─── 다이빙 지도 ────────────────────────────────────────────
function DivingMap({ items, onItemClick }) {
  // 단순 equirectangular projection (-180~180, -90~90 → 0~100%)
  const project = (lat, lng) => ({
    x: ((lng + 180) / 360) * 100,
    y: ((90 - lat) / 180) * 100,
  });

  return (
    <div className="mb-10 border border-white/[0.06] rounded-md overflow-hidden bg-white/[0.02]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06]">
        <span className="text-[11px] font-mono uppercase tracking-widest text-white/40">/ map view</span>
        <span className="text-[11px] font-mono text-white/30">{items.length} pins</span>
      </div>
      <div className="relative w-full" style={{ aspectRatio: '2.4 / 1', background: '#050505' }}>
        {/* 격자선 */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="8.333%" height="16.666%" patternUnits="userSpaceOnUse">
              <path d="M 0 0 L 100 0 M 0 0 L 0 100" stroke="rgba(255,255,255,0.04)" strokeWidth="1" fill="none" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          {/* 적도 */}
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 4" />
        </svg>

        {/* 핀 */}
        {items.map((it, i) => {
          const { x, y } = project(it.lat, it.lng);
          return (
            <button
              key={it.id}
              onClick={() => onItemClick(it)}
              className="absolute -translate-x-1/2 -translate-y-1/2 group"
              style={{ left: `${x}%`, top: `${y}%` }}
              title={`${it.country} · ${it.point}`}
            >
              <span className="absolute inset-0 w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30 animate-ping" />
              <span className="relative block w-2 h-2 rounded-full bg-white ring-2 ring-black group-hover:scale-150 transition-transform" />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 whitespace-nowrap text-[10px] font-mono text-white/0 group-hover:text-white bg-black/80 px-1.5 py-0.5 rounded transition-colors pointer-events-none">
                {it.point}
              </span>
            </button>
          );
        })}

        {items.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-white/30 text-[12px] font-mono">
            no geo-tagged items
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 우표 페이지 ────────────────────────────────────────────
function StampsPage({ data, onItemClick, search, tweaks }) {
  return <CollectiblePage
    data={data} onItemClick={onItemClick} search={search} tweaks={tweaks}
    hobbyKey="stamps" title="우표" kicker="/ Stamps"
    subtitle="국가별로 정리된 우표 컬렉션."
  />;
}

// ─── 돈 페이지 ────────────────────────────────────────────
function CoinsPage({ data, onItemClick, search, tweaks }) {
  return <CollectiblePage
    data={data} onItemClick={onItemClick} search={search} tweaks={tweaks}
    hobbyKey="coins" title="돈" kicker="/ Coins & Notes"
    subtitle="국가별 동전과 지폐 컬렉션."
  />;
}

function CollectiblePage({ data, onItemClick, search, hobbyKey, title, kicker, subtitle, tweaks }) {
  const items = data?.hobbies?.[hobbyKey]?.items || [];
  const filtered = useMemoP(() => filterBySearch(items, search), [items, search]);
  const [country, setCountry] = useStateP(null);
  const countryFiltered = country ? filtered.filter(i => i.country === country) : filtered;

  // 국가별 그룹핑
  const byCountry = useMemoP(() => {
    const g = {};
    for (const it of countryFiltered) {
      const key = `${it.country_code}|${it.country}`;
      (g[key] ||= []).push(it);
    }
    return Object.entries(g).map(([k, v]) => {
      const [code, name] = k.split('|');
      // 연도순 정렬
      v.sort((a, b) => (a.year || 0) - (b.year || 0));
      return { code, name, items: v };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [countryFiltered]);

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8 sm:py-12">
      <PageHero kicker={kicker} title={title} subtitle={subtitle} count={items.length} />
      <CountryFilter items={filtered} value={country} onChange={setCountry} />

      {byCountry.length === 0 ? (
        <EmptyState search={search} />
      ) : (
        byCountry.map(grp => (
          <section key={grp.code} className="mb-12 border-t border-white/[0.06] pt-8">
            <div className="flex items-baseline gap-3 mb-5">
              <span className="text-2xl">{flagEmoji(grp.code)}</span>
              <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight">{grp.name}</h2>
              <span className="text-[11px] font-mono text-white/30">{grp.items.length}</span>
            </div>
            <ItemGrid
              items={grp.items}
              all={countryFiltered}
              layout={tweaks.layout}
              density={tweaks.density}
              onItemClick={onItemClick}
            />
          </section>
        ))
      )}
    </div>
  );
}

// ─── 그리드 ────────────────────────────────────────────
function ItemGrid({ items, all, layout, density, onItemClick }) {
  const cols = density === 'dense'
    ? 'grid-cols-3 sm:grid-cols-5 lg:grid-cols-7'
    : density === 'spacious'
    ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
    : 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-5';

  if (layout === 'masonry') {
    return (
      <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 [&>*]:mb-3 [&>*]:break-inside-avoid">
        {items.map(it => (
          <MediaCard
            key={it.id}
            item={it}
            onClick={() => onItemClick(all, all.indexOf(it))}
          />
        ))}
      </div>
    );
  }

  if (layout === 'list') {
    return (
      <div className="space-y-px bg-white/[0.04] border border-white/[0.06] rounded-md overflow-hidden">
        {items.map(it => (
          <button
            key={it.id}
            onClick={() => onItemClick(all, all.indexOf(it))}
            className="w-full flex items-center gap-4 px-4 py-3 bg-black hover:bg-white/[0.03] transition-colors text-left"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 bg-white/[0.04] rounded-sm overflow-hidden">
              <img src={it.thumb || it.src} alt="" className="w-full h-full object-cover"
                   onError={e => { e.target.style.display = 'none'; }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-mono text-white/40 uppercase tracking-widest">
                {flagEmoji(it.country_code)} {it.country}
                {it.year && <span> · {it.year}</span>}
                {it.face_value && <span> · {it.face_value}</span>}
                {it.depth_m && <span> · {it.depth_m}m</span>}
              </div>
              <div className="text-[14px] text-white truncate mt-0.5">
                {it.description || it.point || it.id}
              </div>
            </div>
            <div className="text-[11px] font-mono text-white/30 hidden sm:block">
              {it.date ? fmtDate(it.date) : it.year}
            </div>
          </button>
        ))}
      </div>
    );
  }

  // grid (default)
  return (
    <div className={`grid ${cols} gap-3`}>
      {items.map(it => (
        <MediaCard
          key={it.id}
          item={it}
          dense={density === 'dense'}
          onClick={() => onItemClick(all, all.indexOf(it))}
        />
      ))}
    </div>
  );
}

window.FreedivingPage = FreedivingPage;
window.StampsPage = StampsPage;
window.CoinsPage = CoinsPage;
window.PageHero = PageHero;
window.ItemGrid = ItemGrid;
