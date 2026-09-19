"use client";

import { useId, useState } from "react";
import { CATEGORY_LABELS } from "@/lib/pipeline";
import { rand, fmtDate } from "@/lib/format";
import type { AnalyticsSummary, WeekBucket } from "@/lib/analytics";
import ChartIcon from "@/components/icons/ChartIcon";

// Validated via the dataviz skill's palette validator against this app's
// #050505 dark surface (node scripts/validate_palette.js) — do not tweak
// without re-running it; both pairs failed on the first (brand-literal) try.
const YOUTUBE_COLOR = "#f4432e";
const TIKTOK_COLOR = "#0ea5a5";
const CATEGORY_COLORS: Record<string, string> = {
  EDUCATIONAL: "#7c3aed",
  TECHNICAL: "#0d9488",
  LIFESTYLE: "#2563eb",
};

function fmtSigned(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toLocaleString()}`;
}

function WeeklyOutputChart({ weeks }: { weeks: WeekBucket[] }) {
  const gradId = useId();
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...weeks.map((w) => w.youtube + w.tiktok));
  const width = 640;
  const height = 180;
  const padBottom = 22;
  const gap = 6;
  const barW = (width - gap * (weeks.length - 1)) / weeks.length;
  const scale = (v: number) => (v / max) * (height - padBottom - 8);

  return (
    <div style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: "block", overflow: "visible" }} role="img" aria-label="Videos published per week, last 12 weeks">
        <defs>
          <clipPath id={gradId}>
            <rect x="0" y="0" width={width} height={height - padBottom} rx="4" />
          </clipPath>
        </defs>
        <line x1="0" y1={height - padBottom} x2={width} y2={height - padBottom} stroke="var(--line)" strokeWidth="1" />
        {weeks.map((w, i) => {
          const x = i * (barW + gap);
          const ytH = scale(w.youtube);
          const ttH = scale(w.tiktok);
          const baseY = height - padBottom;
          const isHover = hover === i;
          return (
            <g
              key={w.weekStart}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover((h) => (h === i ? null : h))}
              style={{ cursor: "pointer" }}
            >
              <rect x={x} y={0} width={barW} height={height - padBottom} fill="transparent" />
              {ttH > 0 ? (
                <rect
                  x={x}
                  y={baseY - ytH - ttH - (ytH > 0 ? 2 : 0)}
                  width={barW}
                  height={ttH}
                  rx={2}
                  fill={TIKTOK_COLOR}
                  opacity={isHover || hover === null ? 1 : 0.45}
                />
              ) : null}
              {ytH > 0 ? (
                <rect
                  x={x}
                  y={baseY - ytH}
                  width={barW}
                  height={ytH}
                  rx={2}
                  fill={YOUTUBE_COLOR}
                  opacity={isHover || hover === null ? 1 : 0.45}
                />
              ) : null}
              {ytH === 0 && ttH === 0 ? (
                <rect x={x} y={baseY - 2} width={barW} height={2} rx={1} fill="var(--line)" />
              ) : null}
              {i % 2 === 0 ? (
                <text
                  x={x + barW / 2}
                  y={height - 6}
                  textAnchor="middle"
                  fontFamily="var(--mono)"
                  fontSize="9.5"
                  fill="var(--muted)"
                >
                  {fmtDate(w.weekStart).replace(/ \d{4}$/, "")}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      {hover !== null ? (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: `${(hover / weeks.length) * 100}%`,
            transform: hover > weeks.length - 3 ? "translateX(-100%)" : "none",
            background: "var(--raised, var(--sunk))",
            border: "1px solid var(--line)",
            borderRadius: 6,
            padding: "8px 10px",
            fontSize: 12,
            fontFamily: "var(--mono)",
            color: "var(--ink)",
            pointerEvents: "none",
            whiteSpace: "nowrap",
            zIndex: 2,
          }}
        >
          <div style={{ color: "var(--muted)", marginBottom: 4 }}>Week of {fmtDate(weeks[hover].weekStart)}</div>
          <div><span style={{ color: YOUTUBE_COLOR }}>●</span> YouTube: {weeks[hover].youtube}</div>
          <div><span style={{ color: TIKTOK_COLOR }}>●</span> TikTok: {weeks[hover].tiktok}</div>
        </div>
      ) : null}
    </div>
  );
}

export default function AnalyticsView({ summary }: { summary: AnalyticsSummary }) {
  const totalCategory = summary.categoryMix.reduce((a, c) => a + c.count, 0);

  return (
    <div className="wrap">
      <header className="page-header">
        <div className="page-title">
          <span className="page-icon">
            <ChartIcon size={36} />
          </span>
          <div>
            <h1>Analytics</h1>
            <p className="sub">How the channel is actually performing — output, growth, spend, and speed</p>
          </div>
        </div>
      </header>

      <div className="stats">
        <div className="stat">
          <b>{summary.publishedLast30Days}</b>
          <span>published, last 30 days</span>
        </div>
        <div className="stat">
          <b>{summary.videosPerWeek}</b>
          <span>avg videos / week (12wk)</span>
        </div>
        <div className="stat">
          <b>{summary.avgIdeaToPublishedDays ?? "—"}</b>
          <span>
            avg days, idea → published
            {summary.cycleTimeSampleSize > 0 && summary.cycleTimeSampleSize < 5
              ? ` (n=${summary.cycleTimeSampleSize})`
              : ""}
          </span>
        </div>
        <div className="stat">
          <b>{rand(summary.avgSpendPerVideo)}</b>
          <span>avg spend / video</span>
        </div>
        <div className="stat">
          <b>{summary.subsGained30d != null ? fmtSigned(summary.subsGained30d) : "—"}</b>
          <span>subscribers gained (30d)</span>
        </div>
        <div className="stat">
          <b>{summary.followersGained30d != null ? fmtSigned(summary.followersGained30d) : "—"}</b>
          <span>followers gained (30d)</span>
        </div>
        <div className="stat">
          <b>{summary.inPipeline}</b>
          <span>in pipeline right now</span>
        </div>
        <div className="stat">
          <b>{summary.completionRatePct != null ? `${summary.completionRatePct}%` : "—"}</b>
          <span>ideas that reached published</span>
        </div>
      </div>

      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontFamily: "var(--display)", fontSize: 20, margin: "0 0 4px" }}>Weekly output</h2>
        <p className="sub" style={{ margin: "0 0 16px" }}>Videos published per week, last 12 weeks</p>
        <WeeklyOutputChart weeks={summary.weeklyOutput} />
        <div className="legend">
          <span><i className="sw" style={{ background: YOUTUBE_COLOR }} />YouTube</span>
          <span><i className="sw" style={{ background: TIKTOK_COLOR }} />TikTok</span>
        </div>
      </section>

      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontFamily: "var(--display)", fontSize: 20, margin: "0 0 4px" }}>Content mix</h2>
        <p className="sub" style={{ margin: "0 0 16px" }}>Category split across everything published</p>
        {totalCategory > 0 ? (
          <>
            <div className="pipe" aria-hidden="true">
              {summary.categoryMix
                .filter((c) => c.count > 0)
                .map((c) => (
                  <i
                    key={c.category}
                    style={{ width: `${(c.count / totalCategory) * 100}%`, background: CATEGORY_COLORS[c.category] }}
                    title={`${CATEGORY_LABELS[c.category]}: ${c.count}`}
                  />
                ))}
            </div>
            <div className="legend">
              {summary.categoryMix.map((c) => (
                <span key={c.category}>
                  <i className="sw" style={{ background: CATEGORY_COLORS[c.category] }} />
                  {CATEGORY_LABELS[c.category]} {c.count} ({Math.round((c.count / totalCategory) * 100)}%)
                </span>
              ))}
            </div>
          </>
        ) : (
          <div className="tablewrap">
            <div className="empty">Nothing published yet — this fills in once the first video or clip goes live.</div>
          </div>
        )}
      </section>
    </div>
  );
}
