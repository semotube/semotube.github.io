// pages.jsx — 카테고리별 페이지 (노안 친화 톤다운, 히어로 제거, 1-2줄 설명)

const { useState: useStateP, useEffect: useEffectP, useMemo: useMemoP, useRef: useRefP } = React;

// ═══════════════════════════════════════════════════════════
//  공통 — 간단 인트로 (히어로 대체)
// ═══════════════════════════════════════════════════════════
function PageIntro({ title, subtitle, theme }) {
  const titleColor = {
    diving: 'text-cyan-100',
    stamps: 'text-amber-100',
    coins: 'text-emerald-100',
  }[theme];
  const subColor = {
    diving: 'text-cyan-200/70',
    stamps: 'text-amber-200/70',
    coins: 'text-emerald-200/70',
  }[theme];
  return (
    <div className="pt-8 sm:pt-10 pb-6">
      <h1 className={`text-2xl sm:text-3xl font-medium tracking-tight ${titleColor}`}>{title}</h1>
      <p className={`mt-2 text-[15px] sm:text-base leading-relaxed ${subColor}`}>{subtitle}</p>
    </div>
  );
}

// 국가 필터
function CountryFilter({ items, value, onChange, theme = 'diving' }) {
  const counts = useMemoP(() => {
    const c = {};
    for (const it of items) c[it.country] = (c[it.country] || 0) + 1;
    return c;
  }, [items]);
  const countries = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  const baseStyle = {
    diving: 'border-cyan-300/30 text-cyan-100/80 hover:text-cyan-50 hover:border-cyan-300/60',
    stamps: 'border-amber-200/30 text-amber-100/80 hover:text-amber-50 hover:border-amber-200/60',
    coins:  'border-emerald-300/30 text-emerald-100/80 hover:text-emerald-50 hover:border-emerald-300/60',
  }[theme];
  const activeStyle = {
    diving: 'bg-cyan-200 text-slate-950 border-cyan-200',
    stamps: 'bg-amber-100 text-stone-950 border-amber-100',
    coins:  'bg-emerald-200 text-emerald-950 border-emerald-200',
  }[theme];

  return (
    <div className="flex flex-wrap gap-2 mb-8 pt-4 border-t border-white/5">
      <button onClick={() => onChange(null)}
        className={`px-4 py-2 text-[14px] font-medium rounded-full border transition-colors ${value === null ? activeStyle : baseStyle}`}>
        ALL <span className="opacity-70 ml-1.5">{items.length}</span>
      </button>
      {countries.map(([country, count]) => {
        const code = items.find(i => i.country === country)?.country_code;
        const active = value === country;
        return (
          <button key={country} onClick={() => onChange(country)}
            className={`px-4 py-2 text-[14px] font-medium rounded-full border transition-colors ${active ? activeStyle : baseStyle}`}>
            <span className="mr-1.5">{flagEmoji(code)}</span>
            {country} <span className="opacity-70 ml-1">{count}</span>
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  🌊 프리다이빙
// ═══════════════════════════════════════════════════════════
function FreedivingPage({ data, onItemClick, search, tweaks }) {
  const items = data?.hobbies?.freediving?.items || [];
  const filtered = useMemoP(() => filterBySearch(items, search), [items, search]);
  const [country, setCountry] = useStateP(null);
  const countryFiltered = country ? filtered.filter(i => i.country === country) : filtered;

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
    <div className="relative min-h-screen" style={{
      background: 'linear-gradient(180deg, #04101c 0%, #07182a 50%, #04101c 100%)',
    }}>
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pb-20">
        <PageIntro
          title="프리다이빙"
          subtitle="국가와 다이빙 포인트별로 정리한 수중 사진·영상 기록."
          theme="diving"
        />

        <CountryFilter items={filtered} value={country} onChange={setCountry} theme="diving" />

        {/* {tweaks.showMap && (
          <DivingMap
            items={countryFiltered.filter(i => i.lat && i.lng)}
            onItemClick={(it) => onItemClick(countryFiltered, countryFiltered.indexOf(it))}
          />
        )} */}

        {byCountry.length === 0 ? (
          <DivingEmpty search={search} />
        ) : (
          byCountry.map(grp => {
            const byLocation = {};
            for (const it of grp.items) (byLocation[it.location || '—'] ||= []).push(it);
            return (
              <section key={grp.code} className="mb-14">
                <div className="flex items-baseline gap-3 mb-5 border-b border-cyan-300/15 pb-3">
                  <span className="text-2xl">{flagEmoji(grp.code)}</span>
                  <h2 className="text-2xl font-medium text-cyan-50 tracking-tight">{grp.name}</h2>
                  <span className="text-[13px] font-mono text-cyan-200/50 ml-auto">{grp.items.length}</span>
                </div>
                {Object.entries(byLocation).map(([loc, locItems]) => (
                  <div key={loc} className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="text-[13px] font-medium uppercase tracking-wider text-cyan-200/80">
                        {loc}
                      </div>
                      <div className="flex-1 h-px bg-cyan-300/10" />
                      <div className="text-[12px] font-mono text-cyan-200/40">{locItems.length}</div>
                    </div>
                    <DivingGrid items={locItems} all={countryFiltered} onItemClick={onItemClick} layout={tweaks.layout} />
                  </div>
                ))}
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}

function DivingGrid({ items, all, onItemClick, layout }) {
  if (layout === 'list') {
    return (
      <div className="space-y-px bg-cyan-400/[0.04] border border-cyan-300/15 rounded-md overflow-hidden">
        {items.map(it => (
          <button key={it.id} onClick={() => onItemClick(all, all.indexOf(it))}
            className="w-full flex items-center gap-4 px-4 py-3 bg-[#06182a]/80 hover:bg-cyan-500/[0.08] transition-colors text-left">
            <div className="w-16 h-16 flex-shrink-0 bg-cyan-400/[0.06] rounded-sm overflow-hidden">
              <img src={it.thumb || it.src} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display='none'}/>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium text-cyan-200/80 uppercase tracking-wider">
                {flagEmoji(it.country_code)} {it.point}
              </div>
              <div className="text-[15px] text-cyan-50 truncate mt-1">{it.description || it.point}</div>
            </div>
            <div className="text-right">
              {it.depth_m && <div className="text-[20px] font-medium text-cyan-100">{it.depth_m}<span className="text-[12px] text-cyan-300/60 ml-0.5">m</span></div>}
              <div className="text-[12px] font-mono text-cyan-200/50 mt-0.5">{fmtDate(it.date)}</div>
            </div>
          </button>
        ))}
      </div>
    );
  }
  if (layout === 'masonry') {
    return (
      <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 [&>*]:mb-3 [&>*]:break-inside-avoid">
        {items.map(it => <DivingCard key={it.id} item={it} onClick={() => onItemClick(all, all.indexOf(it))} />)}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {items.map(it => <DivingCard key={it.id} item={it} onClick={() => onItemClick(all, all.indexOf(it))} />)}
    </div>
  );
}

function DivingCard({ item, onClick }) {
  const [errored, setErrored] = useStateP(false);
  const isVideo = item.type === 'video' || item.youtubeId;
  return (
    <button onClick={onClick}
      className="group relative block w-full overflow-hidden bg-cyan-400/[0.05] border border-cyan-300/15 hover:border-cyan-200/50 transition-all rounded-md aspect-[4/3]">
      {!errored ? (
        <img src={item.thumb || item.src} alt="" loading="lazy" onError={() => setErrored(true)}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" />
      ) : (
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 50% 100%, #08405c 0%, #04101c 70%)',
        }}>
          <svg className="absolute inset-x-0 bottom-0 w-full h-1/2" viewBox="0 0 100 50" preserveAspectRatio="none">
            <path d="M0 25 Q 25 15 50 25 T 100 25 V 50 H 0 Z" fill="rgba(103,232,249,0.12)"/>
            <path d="M0 30 Q 25 20 50 30 T 100 30 V 50 H 0 Z" fill="rgba(103,232,249,0.06)"/>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center px-3">
            <div className="text-[12px] font-medium text-cyan-200/80 uppercase tracking-wider">{item.point}</div>
            {item.depth_m && <div className="text-3xl font-light text-cyan-50">{item.depth_m}<span className="text-[12px] text-cyan-300/60 ml-1">m</span></div>}
          </div>
        </div>
      )}
      {isVideo && (
        <div className="absolute top-2 right-2 px-2 py-1 text-[11px] font-medium uppercase tracking-wider bg-[#04101c]/85 backdrop-blur text-cyan-100 rounded ring-1 ring-cyan-300/40">
          ▶ video
        </div>
      )}
      {item.depth_m && (
        <div className="absolute top-2 left-2 px-2 py-1 text-[11px] font-medium bg-[#04101c]/85 backdrop-blur text-cyan-100 rounded ring-1 ring-cyan-300/40">
          {item.depth_m}m
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-[#04101c] via-[#04101c]/80 to-transparent">
        <div className="text-[12px] text-cyan-200/80 font-medium uppercase tracking-wider">
          {flagEmoji(item.country_code)} {item.country}
        </div>
        <div className="text-[14px] text-cyan-50 truncate mt-0.5 font-medium">{item.point}</div>
      </div>
    </button>
  );
}

function DivingEmpty({ search }) {
  return (
    <div className="border border-dashed border-cyan-300/25 rounded-md py-20 text-center bg-cyan-400/[0.03]">
      <div className="text-cyan-200/60 text-[14px]">
        {search ? `"${search}" 와 일치하는 다이빙 기록 없음` : '아직 등록된 다이빙 기록이 없습니다'}
      </div>
    </div>
  );
}

function DivingMap({ items, onItemClick }) {
  const project = (lat, lng) => ({ x: ((lng + 180) / 360) * 100, y: ((90 - lat) / 180) * 100 });
  return (
    <div className="mb-10 border border-cyan-300/20 rounded-md overflow-hidden bg-[#06182a]/60 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-cyan-300/15">
        <span className="text-[13px] font-medium uppercase tracking-wider text-cyan-200/80">지도</span>
        <span className="text-[12px] font-mono text-cyan-200/50">{items.length} 포인트</span>
      </div>
      <div className="relative w-full" style={{ aspectRatio: '2.4 / 1', background: 'radial-gradient(ellipse at center, #07304a 0%, #04101c 100%)' }}>
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <defs>
            <pattern id="dgrid" width="8.333%" height="16.666%" patternUnits="userSpaceOnUse">
              <path d="M 0 0 L 100 0 M 0 0 L 0 100" stroke="rgba(103,232,249,0.1)" strokeWidth="1" fill="none" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dgrid)" />
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(103,232,249,0.2)" strokeDasharray="2 4" />
        </svg>
        {items.map(it => {
          const { x, y } = project(it.lat, it.lng);
          return (
            <button key={it.id} onClick={() => onItemClick(it)}
              className="absolute -translate-x-1/2 -translate-y-1/2 group"
              style={{ left: `${x}%`, top: `${y}%` }} title={`${it.country} · ${it.point}`}>
              <span className="absolute inset-0 w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/40 animate-ping" />
              <span className="relative block w-2.5 h-2.5 rounded-full bg-cyan-200 ring-2 ring-[#04101c] group-hover:scale-150 transition-transform" />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 whitespace-nowrap text-[11px] font-medium text-cyan-200/0 group-hover:text-cyan-50 bg-[#04101c]/95 px-2 py-0.5 rounded transition-colors pointer-events-none">
                {it.point}
              </span>
            </button>
          );
        })}
        {items.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-cyan-200/40 text-[13px]">위치 정보 없음</div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  ✉️  우표
// ═══════════════════════════════════════════════════════════

const STAMP_FILES = Array.from({ length: 91 }, (_, i) =>
  `kr_2026_${String(i + 1).padStart(5, '0')}.jpg`
);

function StampsPage() {
  return (
    <div className="relative min-h-screen" style={{
      background: 'radial-gradient(ellipse at top, #1a140d 0%, #100c08 50%, #060503 100%)',
    }}>
      <div className="relative w-full px-5 sm:px-8 pb-20">
        <PageIntro
          title="우표"
          subtitle="국가별로 정리한 우표 컬렉션. 종이로 보내는 작은 그림."
          theme="stamps"
        />
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 xl:grid-cols-10 gap-4">
          {STAMP_FILES.map(file => (
            <StampCard key={file} file={file} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StampCard({ file }) {
  return (
    <div className="flex flex-col">
      <div className="relative bg-amber-50/95 p-2 shadow-xl"
        style={{
          maskImage: `radial-gradient(circle 4px at 4px 4px, transparent 3.5px, black 4px)`,
          maskSize: '11px 11px',
          WebkitMaskImage: `radial-gradient(circle 4px at 4px 4px, transparent 3.5px, black 4px)`,
          WebkitMaskSize: '11px 11px',
        }}>
        <div className="relative aspect-[3/4] border border-stone-800/30 overflow-hidden">
          <img src={`media/stamps/${file}`} alt={file} loading="lazy"
            className="absolute inset-0 w-full h-full object-cover" />
        </div>
      </div>
      <div className="mt-1.5 px-0.5">
        <div className="text-[10px] font-mono text-amber-200/60 truncate">{file}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  💰 돈
// ═══════════════════════════════════════════════════════════
function CoinsPage({ data, onItemClick, search, tweaks }) {
  const items = data?.hobbies?.coins?.items || [];
  const filtered = useMemoP(() => filterBySearch(items, search), [items, search]);
  const [country, setCountry] = useStateP(null);
  const countryFiltered = country ? filtered.filter(i => i.country === country) : filtered;

  const byCountry = useMemoP(() => {
    const g = {};
    for (const it of countryFiltered) {
      const key = `${it.country_code}|${it.country}`;
      (g[key] ||= []).push(it);
    }
    return Object.entries(g).map(([k, v]) => {
      const [code, name] = k.split('|');
      v.sort((a, b) => (a.year || 0) - (b.year || 0));
      return { code, name, items: v };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [countryFiltered]);

  return (
    <div className="relative min-h-screen" style={{
      background: 'radial-gradient(ellipse at top left, #081a10 0%, #050d08 50%, #030604 100%)',
    }}>
      <GuillochePattern />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pb-20">
        <PageIntro
          title="돈"
          subtitle="국가별로 정리한 동전과 지폐 컬렉션. 작은 조판 예술."
          theme="coins"
        />

        <CountryFilter items={filtered} value={country} onChange={setCountry} theme="coins" />

        {byCountry.length === 0 ? (
          <CoinsEmpty search={search} />
        ) : (
          byCountry.map(grp => (
            <section key={grp.code} className="mb-14">
              <div className="flex items-baseline gap-3 mb-6 border-b-2 border-double border-emerald-300/20 pb-3">
                <span className="text-2xl">{flagEmoji(grp.code)}</span>
                <h2 className="text-2xl font-serif text-emerald-50 tracking-tight">{grp.name}</h2>
                <span className="text-[13px] font-mono text-emerald-200/50 ml-auto">{grp.items.length}</span>
              </div>
              <CoinsGrid items={grp.items} all={countryFiltered} onItemClick={onItemClick} layout={tweaks.layout} />
            </section>
          ))
        )}
      </div>
    </div>
  );
}

function GuillochePattern() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.04]" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="guilloche" width="120" height="120" patternUnits="userSpaceOnUse">
          {Array.from({length: 8}).map((_, i) => (
            <circle key={i} cx="60" cy="60" r={5 + i*7} stroke="rgb(110,231,183)" fill="none" strokeWidth="0.4"/>
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#guilloche)"/>
    </svg>
  );
}

function CoinsGrid({ items, all, onItemClick, layout }) {
  if (layout === 'list') {
    return (
      <div className="border border-emerald-300/20 rounded-sm overflow-hidden divide-y divide-emerald-300/15">
        {items.map(it => (
          <button key={it.id} onClick={() => onItemClick(all, all.indexOf(it))}
            className="w-full flex items-center gap-4 px-4 py-3 hover:bg-emerald-500/[0.06] transition-colors text-left">
            <div className="w-14 h-14 flex-shrink-0 bg-emerald-900/30 rounded-full overflow-hidden ring-1 ring-emerald-300/25">
              <img src={it.thumb || it.src} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display='none'}/>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-emerald-200/80 uppercase tracking-wider">
                {it.year} · {it.denomination_type}
              </div>
              <div className="text-[15px] font-serif text-emerald-50 truncate mt-1">{it.description}</div>
            </div>
            <div className="text-right">
              <div className="font-serif text-emerald-100 text-lg">{it.face_value}</div>
            </div>
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
      {items.map(it => <CoinCard key={it.id} item={it} onClick={() => onItemClick(all, all.indexOf(it))} />)}
    </div>
  );
}

function CoinCard({ item, onClick }) {
  const [errored, setErrored] = useStateP(false);
  const isNote = item.denomination_type === 'note';
  return (
    <button onClick={onClick} className="group block w-full">
      <div className={`relative w-full transition-all group-hover:-translate-y-1 duration-300 ${
        isNote ? 'aspect-[16/9]' : 'aspect-square'
      }`}>
        {!errored ? (
          <div className={`absolute inset-0 overflow-hidden shadow-xl ring-1 ring-emerald-300/25 ${
            isNote ? 'rounded-sm' : 'rounded-full'
          }`}>
            <img src={item.thumb || item.src} alt="" loading="lazy" onError={() => setErrored(true)}
              className="w-full h-full object-cover" />
          </div>
        ) : (
          isNote ? <NotePlaceholder item={item} /> : <CoinPlaceholder item={item} />
        )}
        <div className={`absolute ${isNote ? 'top-2 left-2' : 'top-1.5 left-1/2 -translate-x-1/2'} px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-emerald-950/85 text-emerald-100 rounded-sm ring-1 ring-emerald-300/40`}>
          {item.denomination_type === 'note' ? 'NOTE' : 'COIN'}
        </div>
      </div>
      <div className="mt-3 px-1 text-center">
        <div className="font-serif text-emerald-50 text-lg leading-tight">{item.face_value}</div>
        <div className="text-[12px] font-medium uppercase tracking-wider text-emerald-200/70 mt-1">
          {flagEmoji(item.country_code)} {item.year}
        </div>
        <div className="text-[13px] font-serif italic text-emerald-100/70 truncate mt-0.5">{item.description}</div>
      </div>
    </button>
  );
}

function CoinPlaceholder({ item }) {
  return (
    <div className="absolute inset-0 rounded-full flex items-center justify-center"
      style={{ background: 'radial-gradient(circle at 30% 30%, #1c4a30 0%, #061a0e 70%)' }}>
      <div className="absolute inset-3 rounded-full border-2 border-dashed border-emerald-300/40"/>
      <div className="text-center text-emerald-50 px-2">
        <div className="font-serif text-xl">{item.face_value}</div>
        <div className="text-[10px] font-mono tracking-widest mt-1 text-emerald-200/70">{item.year}</div>
      </div>
    </div>
  );
}

function NotePlaceholder({ item }) {
  return (
    <div className="absolute inset-0 rounded-sm overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a2c1b 0%, #144028 50%, #0a2c1b 100%)' }}>
      <div className="absolute inset-1.5 border border-emerald-300/35">
        <div className="absolute inset-1 flex items-center justify-between px-3">
          <div className="text-emerald-50 text-center">
            <div className="font-serif text-2xl leading-none">{item.face_value}</div>
            <div className="text-[10px] font-mono tracking-widest mt-1 text-emerald-200/70">{item.year}</div>
          </div>
          <div className="w-12 h-12 rounded-full border border-emerald-300/40 flex items-center justify-center">
            <span className="font-serif italic text-emerald-100/80">{item.country_code}</span>
          </div>
          <div className="text-emerald-50 text-center">
            <div className="font-serif text-2xl leading-none">{item.face_value}</div>
            <div className="text-[10px] font-mono tracking-widest mt-1 text-emerald-200/70">{item.country_code}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CoinsEmpty({ search }) {
  return (
    <div className="border-2 border-dashed border-emerald-300/20 rounded-sm py-20 text-center">
      <div className="text-emerald-200/60 text-[14px] font-serif italic">
        {search ? `"${search}"에 해당하는 항목 없음` : '아직 등록된 화폐가 없습니다'}
      </div>
    </div>
  );
}

window.FreedivingPage = FreedivingPage;
window.StampsPage = StampsPage;
window.CoinsPage = CoinsPage;
