/* global React */
const { useState, useEffect, useMemo, useRef, useCallback } = React;

// ───────────────────────────────────────────────────────────────────
// 따뜻한 노을 톤 플레이스홀더 — 실제 사진이 없을 때
// ───────────────────────────────────────────────────────────────────
function Placeholder({ seed = 0, label = "PHOTO", className = "" }) {
  // 노을 팔레트: 30(앰버) ~ 350(핑크) 사이 휴
  const hue = 25 + ((seed * 17) % 50);
  const id = `pl-${seed}-${Math.random().toString(36).slice(2, 7)}`;
  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={`oklch(0.55 0.14 ${hue})`} />
          <stop offset="60%" stopColor={`oklch(0.36 0.10 ${hue + 20})`} />
          <stop offset="100%" stopColor={`oklch(0.22 0.06 ${hue + 40})`} />
        </linearGradient>
        <pattern id={id} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width="14" height="14" fill="transparent" />
          <line x1="0" y1="0" x2="0" y2="14" stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
        </pattern>
      </defs>
      <rect width="400" height="400" fill={`url(#${id}-g)`} />
      <rect width="400" height="400" fill={`url(#${id})`} />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="rgba(255,255,255,0.55)"
        fontSize="13"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        letterSpacing="2"
      >
        {label}
      </text>
    </svg>
  );
}

// ───────────────────────────────────────────────────────────────────
// 공통 Glass — 노을 톤에 어울리는 따뜻한 글래스
// ───────────────────────────────────────────────────────────────────
function Glass({ children, className = "", style, blur, alpha, ...rest }) {
  const blurPx = blur ?? 18;
  const a = alpha ?? 0.08;
  return (
    <div
      className={`relative rounded-2xl border border-white/10 ${className}`}
      style={{
        background: `linear-gradient(135deg, rgba(255,225,200,${a + 0.04}) 0%, rgba(255,200,210,${a}) 100%)`,
        backdropFilter: `blur(${blurPx}px) saturate(140%)`,
        WebkitBackdropFilter: `blur(${blurPx}px) saturate(140%)`,
        boxShadow:
          "0 1px 0 rgba(255,255,255,0.10) inset, 0 30px 60px -30px rgba(40,10,20,0.55), 0 8px 24px -8px rgba(40,10,20,0.35)",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// 노을 배경 — 떠다니는 따뜻한 오브
// ───────────────────────────────────────────────────────────────────
function BackgroundOrbs({ accent }) {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div
        className="absolute rounded-full"
        style={{
          width: 820,
          height: 820,
          left: "-14%",
          top: "-22%",
          background: `radial-gradient(closest-side, ${accent.a}, transparent 70%)`,
          filter: "blur(50px)",
          opacity: 0.55,
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 720,
          height: 720,
          right: "-16%",
          top: "20%",
          background: `radial-gradient(closest-side, ${accent.b}, transparent 70%)`,
          filter: "blur(60px)",
          opacity: 0.50,
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 620,
          height: 620,
          left: "20%",
          bottom: "-26%",
          background: `radial-gradient(closest-side, ${accent.c}, transparent 70%)`,
          filter: "blur(70px)",
          opacity: 0.45,
        }}
      />
      {/* 미세 입자 */}
      <div
        className="absolute inset-0 mix-blend-overlay opacity-[0.07]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// 사진 카드 (그리드 셀)
// ───────────────────────────────────────────────────────────────────
function PhotoCard({ photo, idx, onOpen, blur, alpha }) {
  const ratios = ["aspect-[4/5]", "aspect-square", "aspect-[3/4]", "aspect-[5/4]"];
  const ratio = ratios[idx % ratios.length];
  return (
    <button
      onClick={() => onOpen(idx)}
      className={`group relative ${ratio} w-full overflow-hidden rounded-2xl border border-white/10 text-left transition-transform duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-white/40`}
      style={{ boxShadow: "0 24px 50px -24px rgba(40,10,20,0.6)" }}
    >
      {photo.src ? (
        <img
          src={photo.src}
          alt={photo.caption}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
        />
      ) : (
        <Placeholder seed={idx + 1} label={photo.tag?.toUpperCase() || "PHOTO"} className="absolute inset-0 h-full w-full" />
      )}

      {/* 호버 정보 카드 */}
      <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <div
          className="rounded-xl border border-white/15 px-3 py-2"
          style={{
            background: `linear-gradient(135deg, rgba(255,230,210,${alpha + 0.06}) 0%, rgba(255,200,210,${alpha + 0.02}) 100%)`,
            backdropFilter: `blur(${blur}px) saturate(140%)`,
            WebkitBackdropFilter: `blur(${blur}px) saturate(140%)`,
          }}
        >
          <div className="text-[13px] font-medium text-white leading-snug line-clamp-1">
            {photo.caption}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-white/75">
            <span className="tabular-nums">{photo.date}</span>
            <span className="h-1 w-1 rounded-full bg-white/40" />
            <span className="truncate">{photo.location}</span>
          </div>
        </div>
      </div>

      {/* 코너 태그 */}
      <div className="absolute left-3 top-3">
        <span
          className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] tracking-wider text-white/85"
          style={{
            background: "rgba(40,15,20,0.30)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          {photo.tag}
        </span>
      </div>
    </button>
  );
}

// ───────────────────────────────────────────────────────────────────
// 라이트박스
// ───────────────────────────────────────────────────────────────────
function Lightbox({ year, photos, index, onClose, onIndex, blur, alpha }) {
  const photo = photos[index];

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onIndex((index - 1 + photos.length) % photos.length);
      if (e.key === "ArrowRight") onIndex((index + 1) % photos.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, photos.length, onClose, onIndex]);

  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
      <div
        className="absolute inset-0"
        style={{
          background: "rgba(30,8,15,0.65)",
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
        }}
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-5xl">
        <div className="grid gap-4 md:grid-cols-[1fr_320px]">
          <Glass blur={blur} alpha={alpha} className="overflow-hidden">
            <div className="relative aspect-[4/3] w-full">
              {photo.src ? (
                <img src={photo.src} alt={photo.caption} className="h-full w-full object-cover" />
              ) : (
                <Placeholder seed={index + 7} label={photo.tag?.toUpperCase() || "PHOTO"} className="h-full w-full" />
              )}
            </div>
          </Glass>

          <Glass blur={blur} alpha={alpha} className="p-5 md:p-6 flex flex-col">
            <div className="text-xs uppercase tracking-[0.2em] text-white/55">
              {year} · {photo.tag}
            </div>
            <h3 className="mt-2 text-2xl font-medium text-white leading-snug" style={{ fontFamily: "'Instrument Serif', serif" }}>
              {photo.caption}
            </h3>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
                <dt className="text-white/60">날짜</dt>
                <dd className="text-white/95 tabular-nums">{photo.date}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
                <dt className="text-white/60">장소</dt>
                <dd className="text-white/95 text-right">{photo.location}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
                <dt className="text-white/60">태그</dt>
                <dd className="text-white/95">#{photo.tag}</dd>
              </div>
            </dl>

            <div className="mt-auto flex items-center justify-between pt-6">
              <button
                onClick={() => onIndex((index - 1 + photos.length) % photos.length)}
                className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/90 hover:bg-white/10 transition"
              >
                ← 이전
              </button>
              <span className="text-xs text-white/55 tabular-nums">
                {index + 1} / {photos.length}
              </span>
              <button
                onClick={() => onIndex((index + 1) % photos.length)}
                className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/90 hover:bg-white/10 transition"
              >
                다음 →
              </button>
            </div>
          </Glass>
        </div>

        <button
          onClick={onClose}
          aria-label="닫기"
          className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 grid h-10 w-10 place-items-center rounded-full border border-white/25 text-white hover:bg-black/30 transition"
          style={{
            background: "rgba(30,8,15,0.55)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// 헤더
// ───────────────────────────────────────────────────────────────────
function Header({ blur, totalPhotos, totalYears, onHome, atHome }) {
  return (
    <header
      className="sticky top-0 z-40 border-b border-white/5"
      style={{
        background: `linear-gradient(180deg, rgba(28,10,18,0.55), rgba(28,10,18,0.20))`,
        backdropFilter: `blur(${Math.max(blur, 14)}px) saturate(150%)`,
        WebkitBackdropFilter: `blur(${Math.max(blur, 14)}px) saturate(150%)`,
      }}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10 py-3">
        <button onClick={onHome} className="flex items-center gap-3 text-left">
          <span
            className="grid h-9 w-9 place-items-center rounded-full border border-white/20"
            style={{
              background:
                "conic-gradient(from 200deg, var(--accent-1), var(--accent-2), var(--accent-3), var(--accent-1))",
            }}
          >
            <span className="h-3 w-3 rounded-full" style={{ background: "rgba(28,10,18,0.85)" }} />
          </span>
          <div className="leading-tight">
            <div
              className="text-base sm:text-lg text-white"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              나의 앨범
            </div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/50">
              A LIFE IN PHOTOGRAPHS
            </div>
          </div>
        </button>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 text-xs text-white/65">
            <span className="tabular-nums">{totalPhotos} 장</span>
            <span className="h-1 w-1 rounded-full bg-white/30" />
            <span className="tabular-nums">{totalYears} 개의 해</span>
          </div>
          {!atHome && (
            <button
              onClick={onHome}
              className="rounded-full border border-white/20 px-3 sm:px-4 py-1.5 text-xs sm:text-sm text-white/90 hover:bg-white/10 transition"
            >
              ← 연도 목록
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

// ───────────────────────────────────────────────────────────────────
// 히어로 — 인트로 카드
// ───────────────────────────────────────────────────────────────────
function HomeIntro({ years, blur, alpha }) {
  const totalPhotos = years.reduce((s, y) => s + y.photos.length, 0);
  const span = years[years.length - 1].year - years[0].year;

  return (
    <Glass blur={blur} alpha={alpha} className="p-6 sm:p-10 lg:p-12 overflow-hidden">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="text-[10px] uppercase tracking-[0.3em] text-white/55">
            since 1971 · 한 사람의 시간들
          </div>
          <h1
            className="mt-5 text-4xl sm:text-6xl lg:text-7xl text-white leading-[0.95]"
            style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400 }}
          >
            오래된 사진들이
            <br />
            나에게 말을 건다.
          </h1>
          <p className="mt-6 max-w-xl text-sm sm:text-base text-white/75 leading-relaxed">
            오래 간직하고 싶은 순간들을 모은 작은 서랍입니다. 흑백 필름의 첫 장부터
            어제 찍은 사진까지, 시간이 지나도 흐려지지 않을 장면들을 연도별로 담았습니다.
            카드를 눌러 그 해의 사진을 펼쳐보세요.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:w-[380px]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/50">사진</div>
            <div
              className="mt-2 text-2xl sm:text-3xl text-white tabular-nums"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              {totalPhotos}
            </div>
            <div className="mt-1 text-[11px] text-white/55">장의 기억</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/50">연도</div>
            <div
              className="mt-2 text-2xl sm:text-3xl text-white tabular-nums"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              {years.length}
            </div>
            <div className="mt-1 text-[11px] text-white/55">개의 해</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/50">기간</div>
            <div
              className="mt-2 text-2xl sm:text-3xl text-white tabular-nums"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              {span}
            </div>
            <div className="mt-1 text-[11px] text-white/55">년의 시간</div>
          </div>
        </div>
      </div>
    </Glass>
  );
}

// ───────────────────────────────────────────────────────────────────
// 연도 카드 — 커버 이미지
// ───────────────────────────────────────────────────────────────────
function YearCard({ entry, onSelect, alpha, blur }) {
  const cover = entry.photos[entry.cover ?? 0];
  const seed = entry.year;
  return (
    <button
      onClick={() => onSelect(entry.year)}
      className="group relative aspect-[4/5] sm:aspect-[3/4] w-full overflow-hidden rounded-2xl border border-white/10 text-left transition-all duration-500 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-white/50"
      style={{ boxShadow: "0 30px 60px -30px rgba(40,10,20,0.7)" }}
    >
      {cover?.src ? (
        <img
          src={cover.src}
          alt={`${entry.year} ${entry.title}`}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.08]"
        />
      ) : (
        <Placeholder seed={seed} label={`${entry.year}`} className="absolute inset-0 h-full w-full transition-transform duration-[1200ms] group-hover:scale-[1.08]" />
      )}

      {/* 노을 그라디언트 오버레이 */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background:
            "linear-gradient(180deg, rgba(40,10,20,0.10) 0%, rgba(40,10,20,0.20) 50%, rgba(20,5,10,0.85) 100%)",
        }}
      />

      {/* 연도 (큰 디스플레이) */}
      <div className="absolute inset-x-5 top-5">
        <div
          className="text-5xl sm:text-6xl text-white tabular-nums leading-none"
          style={{
            fontFamily: "'Instrument Serif', serif",
            textShadow: "0 4px 30px rgba(0,0,0,0.4)",
          }}
        >
          {entry.year}
        </div>
      </div>

      {/* 사진 수 뱃지 */}
      <div className="absolute right-5 top-5">
        <span
          className="rounded-full border border-white/20 px-2.5 py-1 text-[11px] text-white/95 tabular-nums"
          style={{
            background: "rgba(255,255,255,0.10)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
        >
          {entry.photos.length} 장
        </span>
      </div>

      {/* 정보 — 글래스 카드 */}
      <div className="absolute inset-x-4 bottom-4 sm:inset-x-5 sm:bottom-5">
        <div
          className="rounded-xl border border-white/15 px-3.5 py-2.5"
          style={{
            background: `linear-gradient(135deg, rgba(255,230,210,${alpha + 0.05}) 0%, rgba(255,200,210,${alpha + 0.01}) 100%)`,
            backdropFilter: `blur(${blur}px) saturate(140%)`,
            WebkitBackdropFilter: `blur(${blur}px) saturate(140%)`,
          }}
        >
          <div className="text-base sm:text-lg text-white leading-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>
            {entry.title}
          </div>
          <div className="mt-0.5 text-[11px] sm:text-xs text-white/75 leading-snug line-clamp-1">
            {entry.summary}
          </div>
        </div>
      </div>
    </button>
  );
}

// ───────────────────────────────────────────────────────────────────
// 홈 페이지 — 연도 선택 그리드
// ───────────────────────────────────────────────────────────────────
function HomePage({ years, onSelect, blur, alpha }) {
  // 시기별로 묶음: 과거 / 최근 10년
  const recentStart = Math.max(...years.map(y => y.year)) - 10;
  const recent = years.filter(y => y.year > recentStart).sort((a, b) => b.year - a.year);
  const past = years.filter(y => y.year <= recentStart).sort((a, b) => a.year - b.year);

  return (
    <div className="space-y-12 sm:space-y-16 pb-24">
      <HomeIntro years={years} blur={blur} alpha={alpha} />

      {/* 최근 */}
      <section data-screen-label="Recent years">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">
              최근 · RECENT
            </div>
            <h2
              className="mt-2 text-2xl sm:text-3xl text-white"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              가까운 시간들
            </h2>
          </div>
          <div className="text-xs text-white/55 tabular-nums">
            {recent.length} 개의 해
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {recent.map((y) => (
            <YearCard key={y.year} entry={y} onSelect={onSelect} alpha={alpha} blur={blur} />
          ))}
        </div>
      </section>

      {/* 과거 */}
      {past.length > 0 && (
        <section data-screen-label="Past years">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">
                지난 시간 · ARCHIVE
              </div>
              <h2
                className="mt-2 text-2xl sm:text-3xl text-white"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                오래된 시간들
              </h2>
            </div>
            <div className="text-xs text-white/55 tabular-nums">
              {past.length} 개의 해
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {past.map((y) => (
              <YearCard key={y.year} entry={y} onSelect={onSelect} alpha={alpha} blur={blur} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// 연도 페이지 — 사진 그리드
// ───────────────────────────────────────────────────────────────────
function YearPage({ entry, allYears, onSelect, onOpen, blur, alpha }) {
  const idx = allYears.findIndex(y => y.year === entry.year);
  const sorted = [...allYears].sort((a, b) => a.year - b.year);
  const sortedIdx = sorted.findIndex(y => y.year === entry.year);
  const prev = sorted[sortedIdx - 1];
  const next = sorted[sortedIdx + 1];

  return (
    <div className="pb-24" data-screen-label={`Year ${entry.year}`}>
      {/* 연도 헤더 */}
      <div className="pt-2 sm:pt-6">
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/55">
          {entry.year} · {entry.photos.length} photographs
        </div>
        <div className="mt-3 flex items-baseline gap-4 sm:gap-6 flex-wrap">
          <span
            className="text-6xl sm:text-8xl lg:text-[10rem] text-white leading-none tabular-nums"
            style={{
              fontFamily: "'Instrument Serif', serif",
              background:
                "linear-gradient(180deg, #fff 25%, color-mix(in oklch, var(--accent-1) 65%, white))",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {entry.year}
          </span>
          <span
            className="text-2xl sm:text-3xl text-white/90"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            {entry.title}
          </span>
        </div>
        <p className="mt-5 max-w-2xl text-sm sm:text-base text-white/70 leading-relaxed">
          {entry.summary}
        </p>
      </div>

      {/* 빠른 연도 점프 (사이드와 별개로 상단에) */}
      <div className="mt-8 mb-8 flex items-center gap-2 overflow-x-auto custom-scroll pb-1">
        {sorted.map((y) => {
          const active = y.year === entry.year;
          return (
            <button
              key={y.year}
              onClick={() => onSelect(y.year)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm transition tabular-nums ${
                active
                  ? "bg-white text-[oklch(0.20_0.05_25)]"
                  : "border border-white/15 text-white/75 hover:bg-white/10 hover:text-white"
              }`}
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              {y.year}
            </button>
          );
        })}
      </div>

      {/* 사진 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4">
        {entry.photos.map((p, i) => (
          <PhotoCard key={i} photo={p} idx={i} onOpen={onOpen} blur={blur} alpha={alpha} />
        ))}
      </div>

      {/* 이전/다음 연도 */}
      <div className="mt-14 grid gap-3 sm:grid-cols-2">
        {prev ? (
          <button
            onClick={() => onSelect(prev.year)}
            className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left transition hover:bg-white/[0.08]"
          >
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/45">
              ← 이전 해
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <span
                className="text-3xl text-white tabular-nums"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                {prev.year}
              </span>
              <span className="text-sm text-white/70 truncate">{prev.title}</span>
            </div>
          </button>
        ) : <div />}
        {next ? (
          <button
            onClick={() => onSelect(next.year)}
            className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-right transition hover:bg-white/[0.08]"
          >
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/45">
              다음 해 →
            </div>
            <div className="mt-2 flex items-baseline gap-3 justify-end">
              <span className="text-sm text-white/70 truncate">{next.title}</span>
              <span
                className="text-3xl text-white tabular-nums"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                {next.year}
              </span>
            </div>
          </button>
        ) : <div />}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// 메인 App
// ───────────────────────────────────────────────────────────────────
function App({ tweaks, setTweak }) {
  const data = window.ALBUM_DATA;
  const years = useMemo(() => [...data].sort((a, b) => a.year - b.year), [data]);
  const totalPhotos = years.reduce((s, y) => s + y.photos.length, 0);

  // URL hash 라우팅 — 새로고침해도 유지
  const parseHash = () => {
    const m = (window.location.hash || "").match(/year-(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  };
  const [activeYear, setActiveYear] = useState(parseHash);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    const onHash = () => setActiveYear(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // 노을 액센트 팔레트
  const accentMap = {
    sunset: { a: "oklch(0.74 0.18 40)",  b: "oklch(0.72 0.17 15)",  c: "oklch(0.74 0.16 340)" }, // 오렌지/핑크
    peach:  { a: "oklch(0.82 0.13 55)",  b: "oklch(0.78 0.13 25)",  c: "oklch(0.76 0.14 350)" }, // 부드러운 복숭아
    coral:  { a: "oklch(0.72 0.18 25)",  b: "oklch(0.70 0.18 5)",   c: "oklch(0.74 0.16 320)" }, // 진한 산호
    golden: { a: "oklch(0.80 0.16 70)",  b: "oklch(0.74 0.17 35)",  c: "oklch(0.74 0.14 350)" }, // 황금 노을
  };
  const accent = accentMap[tweaks.accent] || accentMap.sunset;

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--accent-1", accent.a);
    root.style.setProperty("--accent-2", accent.b);
    root.style.setProperty("--accent-3", accent.c);
  }, [accent]);

  const goYear = useCallback((year) => {
    window.location.hash = `year-${year}`;
    setActiveYear(year);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const goHome = useCallback(() => {
    history.pushState("", "", window.location.pathname + window.location.search);
    setActiveYear(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const openLightbox = useCallback((index) => {
    if (activeYear) setLightbox({ year: activeYear, index });
  }, [activeYear]);

  const activeEntry = activeYear ? years.find(y => y.year === activeYear) : null;
  const lightboxPhotos = lightbox
    ? years.find((y) => y.year === lightbox.year)?.photos || []
    : [];

  return (
    <div className="min-h-screen text-white">
      <BackgroundOrbs accent={accent} />
      <Header
        blur={tweaks.blur}
        totalPhotos={totalPhotos}
        totalYears={years.length}
        onHome={goHome}
        atHome={!activeEntry}
      />

      <main className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10 pt-6 sm:pt-10">
        {activeEntry ? (
          <YearPage
            entry={activeEntry}
            allYears={years}
            onSelect={goYear}
            onOpen={openLightbox}
            blur={tweaks.blur}
            alpha={tweaks.alpha}
          />
        ) : (
          <HomePage
            years={years}
            onSelect={goYear}
            blur={tweaks.blur}
            alpha={tweaks.alpha}
          />
        )}

        <footer className="border-t border-white/10 py-10 text-center text-xs text-white/50">
          <div style={{ fontFamily: "'Instrument Serif', serif" }} className="text-base text-white/75">
            나의 앨범
          </div>
          <div className="mt-2">
            오래 간직하고 싶은 사진들. 1971 — {years[years.length - 1].year}.
          </div>
        </footer>
      </main>

      {lightbox && (
        <Lightbox
          year={lightbox.year}
          photos={lightboxPhotos}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onIndex={(i) => setLightbox({ year: lightbox.year, index: i })}
          blur={tweaks.blur}
          alpha={tweaks.alpha}
        />
      )}
    </div>
  );
}

Object.assign(window, { App });
