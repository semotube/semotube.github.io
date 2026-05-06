/* global React */
const { useState, useEffect, useMemo, useRef, useCallback } = React;

// ───────────────────────────────────────────────────────────────────
// 바다 톤 SVG 플레이스홀더 (수면→심해 그라디언트 + 빛줄기)
// ───────────────────────────────────────────────────────────────────
function Placeholder({ seed = 0, label = "PHOTO", className = "" }) {
  // 휴 200(시안)~240(딥블루) 사이 — 약간씩만 흔들림
  const hue = 200 + ((seed * 7) % 40);
  const id = `pl-${seed}-${Math.random().toString(36).slice(2, 7)}`;
  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`oklch(0.50 0.10 ${hue})`} />
          <stop offset="55%" stopColor={`oklch(0.28 0.08 ${hue + 10})`} />
          <stop offset="100%" stopColor={`oklch(0.14 0.04 ${hue + 20})`} />
        </linearGradient>
        <pattern id={id} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
          <rect width="14" height="14" fill="transparent" />
          <line x1="0" y1="0" x2="0" y2="14" stroke="rgba(180,220,255,0.10)" strokeWidth="6" />
        </pattern>
      </defs>
      <rect width="400" height="400" fill={`url(#${id}-g)`} />
      <rect width="400" height="400" fill={`url(#${id})`} />
      {/* 빛줄기 — 위에서 내려오는 god rays */}
      <g opacity="0.30">
        <polygon points="80,0 130,0 70,400 20,400" fill="rgba(220,240,255,1)" />
        <polygon points="220,0 250,0 200,400 170,400" fill="rgba(220,240,255,1)" />
        <polygon points="320,0 360,0 320,400 280,400" fill="rgba(220,240,255,1)" />
      </g>
      <text
        x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
        fill="rgba(225,240,255,0.55)" fontSize="13"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        letterSpacing="2"
      >
        {label}
      </text>
    </svg>
  );
}

// ───────────────────────────────────────────────────────────────────
// Glass — 차가운 심해 글래스
// ───────────────────────────────────────────────────────────────────
function Glass({ children, className = "", style, blur, alpha, ...rest }) {
  const blurPx = blur ?? 18;
  const a = alpha ?? 0.10;
  return (
    <div
      className={`relative rounded-2xl border border-white/10 ${className}`}
      style={{
        background: `linear-gradient(135deg, rgba(180,220,255,${a + 0.05}) 0%, rgba(120,180,230,${a}) 100%)`,
        backdropFilter: `blur(${blurPx}px) saturate(140%)`,
        WebkitBackdropFilter: `blur(${blurPx}px) saturate(140%)`,
        boxShadow:
          "0 1px 0 rgba(255,255,255,0.10) inset, 0 30px 60px -30px rgba(5,15,40,0.65), 0 8px 24px -8px rgba(5,15,40,0.40)",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// 배경 — 심해 라이트 + 떠다니는 카우스틱
// ───────────────────────────────────────────────────────────────────
function BackgroundOrbs({ accent }) {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute rounded-full" style={{
        width: 820, height: 820, left: "-14%", top: "-22%",
        background: `radial-gradient(closest-side, ${accent.a}, transparent 70%)`,
        filter: "blur(50px)", opacity: 0.55,
      }} />
      <div className="absolute rounded-full" style={{
        width: 720, height: 720, right: "-16%", top: "20%",
        background: `radial-gradient(closest-side, ${accent.b}, transparent 70%)`,
        filter: "blur(60px)", opacity: 0.50,
      }} />
      <div className="absolute rounded-full" style={{
        width: 620, height: 620, left: "20%", bottom: "-26%",
        background: `radial-gradient(closest-side, ${accent.c}, transparent 70%)`,
        filter: "blur(70px)", opacity: 0.45,
      }} />
      {/* 카우스틱 라인들 — god rays */}
      <div className="absolute inset-0 opacity-[0.06]" style={{
        background:
          "linear-gradient(105deg, transparent 0%, transparent 40%, rgba(200,230,255,0.6) 42%, transparent 44%, transparent 60%, rgba(200,230,255,0.4) 62%, transparent 64%, transparent 100%)",
      }} />
      <div className="absolute inset-0 mix-blend-overlay opacity-[0.06]" style={{
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
      }} />
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// 사진/동영상 카드
// ───────────────────────────────────────────────────────────────────
function PhotoCard({ photo, idx, onOpen, blur, alpha }) {
  const ratios = ["aspect-[4/5]", "aspect-square", "aspect-[3/4]", "aspect-[5/4]"];
  const ratio = ratios[idx % ratios.length];
  const isVideo = photo.type === "video";
  const thumbSrc = isVideo ? (photo.poster || "") : (photo.src || "");

  return (
    <button
      onClick={() => onOpen(idx)}
      className={`group relative ${ratio} w-full overflow-hidden rounded-2xl border border-white/10 text-left transition-transform duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-white/40`}
      style={{ boxShadow: "0 24px 50px -24px rgba(5,15,40,0.7)" }}
    >
      {thumbSrc ? (
        <img src={thumbSrc} alt={photo.caption} loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
      ) : (
        <Placeholder seed={idx + 1} label={isVideo ? "VIDEO" : (photo.tag?.toUpperCase() || "PHOTO")}
          className="absolute inset-0 h-full w-full" />
      )}

      {isVideo && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="grid h-14 w-14 sm:h-16 sm:w-16 place-items-center rounded-full border border-white/30 transition-transform duration-300 group-hover:scale-110"
            style={{
              background: "rgba(5,15,40,0.45)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
            }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7L8 5z" /></svg>
          </span>
        </div>
      )}

      <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <div className="rounded-xl border border-white/15 px-3 py-2"
          style={{
            background: `linear-gradient(135deg, rgba(180,220,255,${alpha + 0.06}) 0%, rgba(120,180,230,${alpha + 0.02}) 100%)`,
            backdropFilter: `blur(${blur}px) saturate(140%)`,
            WebkitBackdropFilter: `blur(${blur}px) saturate(140%)`,
          }}>
          <div className="text-[13px] font-medium text-white leading-snug line-clamp-1">{photo.caption}</div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-white/75">
            <span className="tabular-nums">{photo.date}</span>
            <span className="h-1 w-1 rounded-full bg-white/40" />
            <span className="truncate">{photo.location}</span>
          </div>
        </div>
      </div>

      <div className="absolute left-3 top-3 flex items-center gap-1.5">
        {isVideo && (
          <span className="inline-flex items-center gap-1 rounded-full border border-white/20 px-2 py-0.5 text-[10px] tracking-wider text-white"
            style={{
              background: "linear-gradient(135deg, var(--accent-1), var(--accent-2))",
              boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
            }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5z" /></svg>
            VIDEO
          </span>
        )}
        <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] tracking-wider text-white/85"
          style={{
            background: "rgba(5,15,40,0.35)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}>
          {photo.tag}
        </span>
      </div>
    </button>
  );
}

// ───────────────────────────────────────────────────────────────────
// 라이트박스 — 사진/영상
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
      <div className="absolute inset-0"
        style={{ background: "rgba(5,15,40,0.70)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)" }}
        onClick={onClose} />

      <div className="relative z-10 w-full max-w-5xl">
        <div className="grid gap-4 md:grid-cols-[1fr_320px]">
          <Glass blur={blur} alpha={alpha} className="overflow-hidden">
            <div className="relative aspect-[4/3] w-full bg-black/40">
              {photo.type === "video" ? (
                photo.src ? (
                  <video key={photo.src} src={photo.src} poster={photo.poster || undefined}
                    controls autoPlay playsInline className="h-full w-full object-contain bg-black" />
                ) : (
                  <div className="relative h-full w-full">
                    <Placeholder seed={index + 7} label="VIDEO" className="h-full w-full" />
                    <div className="absolute inset-0 grid place-items-center">
                      <div className="rounded-full border border-white/30 px-4 py-2 text-xs text-white/85"
                        style={{ background: "rgba(5,15,40,0.55)", backdropFilter: "blur(10px)" }}>
                        동영상 파일을 추가하세요 — videos/.../*.mp4
                      </div>
                    </div>
                  </div>
                )
              ) : (
                photo.src ? (
                  <img src={photo.src} alt={photo.caption} className="h-full w-full object-cover" />
                ) : (
                  <Placeholder seed={index + 7} label={photo.tag?.toUpperCase() || "PHOTO"} className="h-full w-full" />
                )
              )}
            </div>
          </Glass>

          <Glass blur={blur} alpha={alpha} className="p-5 md:p-6 flex flex-col">
            <div className="text-xs uppercase tracking-[0.2em] text-white/55 flex items-center gap-2 flex-wrap">
              <span>{year} · {photo.tag}</span>
              {photo.type === "video" && (
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] tracking-wider text-white"
                  style={{ background: "linear-gradient(135deg, var(--accent-1), var(--accent-2))" }}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5z" /></svg>
                  VIDEO
                </span>
              )}
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
              <button onClick={() => onIndex((index - 1 + photos.length) % photos.length)}
                className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/90 hover:bg-white/10 transition">
                ← 이전
              </button>
              <span className="text-xs text-white/55 tabular-nums">{index + 1} / {photos.length}</span>
              <button onClick={() => onIndex((index + 1) % photos.length)}
                className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/90 hover:bg-white/10 transition">
                다음 →
              </button>
            </div>
          </Glass>
        </div>

        <button onClick={onClose} aria-label="닫기"
          className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 grid h-10 w-10 place-items-center rounded-full border border-white/25 text-white hover:bg-black/30 transition"
          style={{ background: "rgba(5,15,40,0.55)", backdropFilter: "blur(12px)" }}>
          ✕
        </button>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// 헤더 — 깊이 표시기 포함
// ───────────────────────────────────────────────────────────────────
function Header({ blur, totalPhotos, totalYears, onHome, atHome }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5"
      style={{
        background: `linear-gradient(180deg, rgba(5,15,40,0.65), rgba(5,15,40,0.25))`,
        backdropFilter: `blur(${Math.max(blur, 14)}px) saturate(150%)`,
        WebkitBackdropFilter: `blur(${Math.max(blur, 14)}px) saturate(150%)`,
      }}>
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10 py-3">
        <button onClick={onHome} className="flex items-center gap-3 text-left">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-white/20"
            style={{ background: "conic-gradient(from 200deg, var(--accent-1), var(--accent-2), var(--accent-3), var(--accent-1))" }}>
            {/* 다이빙 마스크 실루엣 단순화 — 작은 원 안에 가로 라인 */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(5,15,40,0.85)" strokeWidth="2.2" strokeLinecap="round">
              <path d="M3 10c2-1 5-1 9-1s7 0 9 1" />
              <path d="M5 10v3a3 3 0 003 3h2a2 2 0 002-2v-1" />
              <path d="M19 10v3a3 3 0 01-3 3h-2a2 2 0 01-2-2v-1" />
            </svg>
          </span>
          <div className="leading-tight">
            <div className="text-base sm:text-lg text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
              나의 앨범
            </div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/55">
              ONE BREATH · ONE LIFE
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
            <button onClick={onHome}
              className="rounded-full border border-white/20 px-3 sm:px-4 py-1.5 text-xs sm:text-sm text-white/90 hover:bg-white/10 transition">
              ← 연도 목록
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

// ───────────────────────────────────────────────────────────────────
// 히어로
// ───────────────────────────────────────────────────────────────────
function HomeIntro({ years, blur, alpha, totalPhotos, totalDives }) {
  const span = years[years.length - 1].year - years[0].year;
  return (
    <Glass blur={blur} alpha={alpha} className="p-6 sm:p-10 lg:p-12 overflow-hidden">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="text-[10px] uppercase tracking-[0.3em] text-white/60">
            since 2018 · one breath at a time
          </div>
          <h1 className="mt-5 text-4xl sm:text-6xl lg:text-7xl text-white leading-[0.95]"
            style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400 }}>
            한 번의 숨,
            <br />
            한 번의 시간.
          </h1>
          <p className="mt-6 max-w-xl text-sm sm:text-base text-white/75 leading-relaxed">
            프리다이빙으로 만난 바다와 사람들, 그리고 그 사이의 작은 프로젝트들을 모은
            서랍입니다. 한 해는 여러 트립으로 나뉘어 있어요. 카드를 눌러
            그 시간의 깊이를 따라가 보세요.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:w-[380px]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/55">사진</div>
            <div className="mt-2 text-2xl sm:text-3xl text-white tabular-nums" style={{ fontFamily: "'Instrument Serif', serif" }}>
              {totalPhotos}
            </div>
            <div className="mt-1 text-[11px] text-white/55">장의 기억</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/55">트립</div>
            <div className="mt-2 text-2xl sm:text-3xl text-white tabular-nums" style={{ fontFamily: "'Instrument Serif', serif" }}>
              {totalDives}
            </div>
            <div className="mt-1 text-[11px] text-white/55">개의 섹션</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/55">기간</div>
            <div className="mt-2 text-2xl sm:text-3xl text-white tabular-nums" style={{ fontFamily: "'Instrument Serif', serif" }}>
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
// 연도 카드 — 첫 섹션의 첫 아이템을 커버로
// ───────────────────────────────────────────────────────────────────
function YearCard({ entry, onSelect, alpha, blur }) {
  const all = entry.sections.flatMap(s => s.items);
  const ci = entry.cover || { section: 0, item: 0 };
  const cover = entry.sections[ci.section]?.items[ci.item];
  const isVideoCover = cover?.type === "video";
  const coverSrc = isVideoCover ? (cover.poster || "") : (cover?.src || "");
  const videoCount = all.filter(p => p.type === "video").length;
  const sectionCount = entry.sections.length;

  return (
    <button onClick={() => onSelect(entry.year)}
      className="group relative aspect-[4/5] sm:aspect-[3/4] w-full overflow-hidden rounded-2xl border border-white/10 text-left transition-all duration-500 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-white/50"
      style={{ boxShadow: "0 30px 60px -30px rgba(5,15,40,0.75)" }}>
      {coverSrc ? (
        <img src={coverSrc} alt={`${entry.year} ${entry.title}`} loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.08]" />
      ) : (
        <Placeholder seed={entry.year} label={`${entry.year}`}
          className="absolute inset-0 h-full w-full transition-transform duration-[1200ms] group-hover:scale-[1.08]" />
      )}

      {/* 심해 그라디언트 오버레이 */}
      <div className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(5,15,40,0.10) 0%, rgba(5,15,40,0.20) 50%, rgba(2,8,25,0.88) 100%)" }} />

      <div className="absolute inset-x-5 top-5">
        <div className="text-5xl sm:text-6xl text-white tabular-nums leading-none"
          style={{ fontFamily: "'Instrument Serif', serif", textShadow: "0 4px 30px rgba(0,0,0,0.5)" }}>
          {entry.year}
        </div>
      </div>

      <div className="absolute right-5 top-5 flex flex-col items-end gap-1.5">
        <span className="rounded-full border border-white/20 px-2.5 py-1 text-[11px] text-white/95 tabular-nums"
          style={{ background: "rgba(255,255,255,0.10)", backdropFilter: "blur(10px)" }}>
          {all.length} 장
        </span>
        <span className="rounded-full border border-white/20 px-2.5 py-1 text-[11px] text-white/95 tabular-nums"
          style={{ background: "rgba(5,15,40,0.45)", backdropFilter: "blur(10px)" }}>
          {sectionCount} 섹션
        </span>
        {videoCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full border border-white/25 px-2 py-0.5 text-[10px] text-white tabular-nums"
            style={{ background: "linear-gradient(135deg, var(--accent-1), var(--accent-2))", boxShadow: "0 4px 12px rgba(0,0,0,0.25)" }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5z" /></svg>
            영상 {videoCount}
          </span>
        )}
      </div>

      <div className="absolute inset-x-4 bottom-4 sm:inset-x-5 sm:bottom-5">
        <div className="rounded-xl border border-white/15 px-3.5 py-2.5"
          style={{
            background: `linear-gradient(135deg, rgba(180,220,255,${alpha + 0.05}) 0%, rgba(120,180,230,${alpha + 0.01}) 100%)`,
            backdropFilter: `blur(${blur}px) saturate(140%)`,
            WebkitBackdropFilter: `blur(${blur}px) saturate(140%)`,
          }}>
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
// 홈 페이지
// ───────────────────────────────────────────────────────────────────
function HomePage({ years, onSelect, blur, alpha }) {
  const totalPhotos = years.reduce((s, y) => s + y.sections.reduce((ss, sec) => ss + sec.items.length, 0), 0);
  const totalDives = years.reduce((s, y) => s + y.sections.length, 0);
  const sorted = [...years].sort((a, b) => b.year - a.year);

  return (
    <div className="space-y-12 sm:space-y-16 pb-24">
      <HomeIntro years={years} blur={blur} alpha={alpha} totalPhotos={totalPhotos} totalDives={totalDives} />

      <section data-screen-label="All years">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-white/55">
              연도 · YEARS
            </div>
            <h2 className="mt-2 text-2xl sm:text-3xl text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
              한 해를 골라보세요
            </h2>
          </div>
          <div className="text-xs text-white/55 tabular-nums">{sorted.length} 개의 해</div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {sorted.map((y) => (
            <YearCard key={y.year} entry={y} onSelect={onSelect} alpha={alpha} blur={blur} />
          ))}
        </div>
      </section>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// 섹션 (트립) 헤더 + 그리드
// ───────────────────────────────────────────────────────────────────
function SectionBlock({ section, sectionIdx, onOpen, blur, alpha, registerRef }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) registerRef(section.id, ref.current);
  }, [section.id, registerRef]);

  const videoCount = section.items.filter(i => i.type === "video").length;

  return (
    <section ref={ref} id={`s-${section.id}`} className="scroll-mt-32 pt-2">
      <div className="mb-5 flex items-end justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-baseline gap-3">
            <span className="text-[10px] uppercase tracking-[0.25em] text-white/50 tabular-nums">
              {String(sectionIdx + 1).padStart(2, "0")}
            </span>
            <h3 className="text-xl sm:text-2xl text-white truncate" style={{ fontFamily: "'Instrument Serif', serif" }}>
              {section.title}
            </h3>
          </div>
          {section.summary && (
            <p className="mt-2 max-w-2xl text-sm text-white/65 leading-relaxed">{section.summary}</p>
          )}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-white/55">
          <span className="tabular-nums">{section.items.length} 장</span>
          {videoCount > 0 && (
            <>
              <span className="h-1 w-1 rounded-full bg-white/30" />
              <span className="tabular-nums">영상 {videoCount}</span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4">
        {section.items.map((p, i) => (
          <PhotoCard
            key={i}
            photo={p}
            idx={i}
            onOpen={(idx) => onOpen(section.id, idx)}
            blur={blur}
            alpha={alpha}
          />
        ))}
      </div>
    </section>
  );
}

// ───────────────────────────────────────────────────────────────────
// 연도 페이지
// ───────────────────────────────────────────────────────────────────
function YearPage({ entry, allYears, onSelect, onOpen, blur, alpha }) {
  const sorted = [...allYears].sort((a, b) => a.year - b.year);
  const sortedIdx = sorted.findIndex(y => y.year === entry.year);
  const prev = sorted[sortedIdx - 1];
  const next = sorted[sortedIdx + 1];
  const sectionRefs = useRef({});

  const registerRef = useCallback((id, el) => { sectionRefs.current[id] = el; }, []);
  const jumpSection = (id) => {
    const el = sectionRefs.current[id];
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <div className="pb-24" data-screen-label={`Year ${entry.year}`}>
      {/* 연도 헤더 */}
      <div className="pt-2 sm:pt-6">
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/55">
          {entry.year} · {entry.sections.length} sections
        </div>
        <div className="mt-3 flex items-baseline gap-4 sm:gap-6 flex-wrap">
          <span className="text-6xl sm:text-8xl lg:text-[10rem] text-white leading-none tabular-nums"
            style={{
              fontFamily: "'Instrument Serif', serif",
              background: "linear-gradient(180deg, #fff 25%, color-mix(in oklch, var(--accent-1) 65%, white))",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
            {entry.year}
          </span>
          <span className="text-2xl sm:text-3xl text-white/90" style={{ fontFamily: "'Instrument Serif', serif" }}>
            {entry.title}
          </span>
        </div>
        <p className="mt-5 max-w-2xl text-sm sm:text-base text-white/70 leading-relaxed">{entry.summary}</p>
      </div>

      {/* 연도 점프 칩 */}
      <div className="mt-8 flex items-center gap-2 overflow-x-auto custom-scroll pb-1">
        {sorted.map((y) => {
          const active = y.year === entry.year;
          return (
            <button key={y.year} onClick={() => onSelect(y.year)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm transition tabular-nums ${
                active ? "bg-white text-[oklch(0.18_0.05_240)]" : "border border-white/15 text-white/75 hover:bg-white/10 hover:text-white"
              }`}
              style={{ fontFamily: "'Instrument Serif', serif" }}>
              {y.year}
            </button>
          );
        })}
      </div>

      {/* 섹션 점프 — 글래스 패널 */}
      <div className="mt-6">
        <Glass blur={blur} alpha={alpha} className="p-4 sm:p-5">
          <div className="text-[10px] uppercase tracking-[0.25em] text-white/55">
            이 해의 섹션 · sections
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {entry.sections.map((s, i) => (
              <button key={s.id} onClick={() => jumpSection(s.id)}
                className="group flex items-baseline gap-2 rounded-full border border-white/15 px-3 py-1.5 text-sm text-white/85 hover:bg-white/10 hover:text-white transition">
                <span className="text-[10px] text-white/45 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <span style={{ fontFamily: "'Instrument Serif', serif" }}>{s.title}</span>
                <span className="text-[11px] text-white/45 tabular-nums">{s.items.length}</span>
              </button>
            ))}
          </div>
        </Glass>
      </div>

      {/* 섹션들 */}
      <div className="mt-10 sm:mt-14 space-y-12 sm:space-y-16">
        {entry.sections.map((s, i) => (
          <SectionBlock
            key={s.id}
            section={s}
            sectionIdx={i}
            onOpen={onOpen}
            blur={blur}
            alpha={alpha}
            registerRef={registerRef}
          />
        ))}
      </div>

      {/* 이전/다음 연도 */}
      <div className="mt-14 grid gap-3 sm:grid-cols-2">
        {prev ? (
          <button onClick={() => onSelect(prev.year)}
            className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left transition hover:bg-white/[0.08]">
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/45">← 이전 해</div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-3xl text-white tabular-nums" style={{ fontFamily: "'Instrument Serif', serif" }}>{prev.year}</span>
              <span className="text-sm text-white/70 truncate">{prev.title}</span>
            </div>
          </button>
        ) : <div />}
        {next ? (
          <button onClick={() => onSelect(next.year)}
            className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-right transition hover:bg-white/[0.08]">
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/45">다음 해 →</div>
            <div className="mt-2 flex items-baseline gap-3 justify-end">
              <span className="text-sm text-white/70 truncate">{next.title}</span>
              <span className="text-3xl text-white tabular-nums" style={{ fontFamily: "'Instrument Serif', serif" }}>{next.year}</span>
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
  const totalPhotos = years.reduce((s, y) => s + y.sections.reduce((ss, sec) => ss + sec.items.length, 0), 0);

  const parseHash = () => {
    const m = (window.location.hash || "").match(/year-(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  };
  const [activeYear, setActiveYear] = useState(parseHash);
  const [lightbox, setLightbox] = useState(null); // { sectionId, index }

  useEffect(() => {
    const onHash = () => setActiveYear(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // 바다 액센트 팔레트 (시안→딥블루)
  const accentMap = {
    abyss:    { a: "oklch(0.62 0.16 220)", b: "oklch(0.50 0.18 250)", c: "oklch(0.58 0.16 195)" }, // 심해
    lagoon:   { a: "oklch(0.78 0.14 195)", b: "oklch(0.74 0.15 175)", c: "oklch(0.72 0.16 215)" }, // 라군
    twilight: { a: "oklch(0.62 0.18 270)", b: "oklch(0.56 0.18 235)", c: "oklch(0.68 0.16 300)" }, // 황혼
    aurora:   { a: "oklch(0.74 0.15 175)", b: "oklch(0.66 0.18 270)", c: "oklch(0.74 0.16 320)" }, // 오로라
  };
  const accent = accentMap[tweaks.accent] || accentMap.abyss;

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

  const openLightbox = useCallback((sectionId, index) => {
    setLightbox({ sectionId, index });
  }, []);

  const activeEntry = activeYear ? years.find(y => y.year === activeYear) : null;
  const activeSection = lightbox && activeEntry
    ? activeEntry.sections.find(s => s.id === lightbox.sectionId)
    : null;
  const lightboxPhotos = activeSection ? activeSection.items : [];

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
          <YearPage entry={activeEntry} allYears={years} onSelect={goYear} onOpen={openLightbox}
            blur={tweaks.blur} alpha={tweaks.alpha} />
        ) : (
          <HomePage years={years} onSelect={goYear} blur={tweaks.blur} alpha={tweaks.alpha} />
        )}

        <footer className="border-t border-white/10 py-10 text-center text-xs text-white/55">
          <div style={{ fontFamily: "'Instrument Serif', serif" }} className="text-base text-white/75">
            나의 앨범 · One Breath
          </div>
          <div className="mt-2">
            프리다이빙으로 만난 시간들. {years[0].year} — {years[years.length - 1].year}.
          </div>
        </footer>
      </main>

      {lightbox && activeSection && (
        <Lightbox
          year={activeYear}
          photos={lightboxPhotos}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onIndex={(i) => setLightbox({ sectionId: lightbox.sectionId, index: i })}
          blur={tweaks.blur}
          alpha={tweaks.alpha}
        />
      )}
    </div>
  );
}

Object.assign(window, { App });
