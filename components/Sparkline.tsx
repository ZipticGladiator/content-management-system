"use client";

type Props = {
  points: number[];
  target?: number;
  width?: number;
  height?: number;
};

export default function Sparkline({ points, target, width = 240, height = 48 }: Props) {
  if (points.length < 2) {
    return (
      <div style={{ height, display: "flex", alignItems: "center" }}>
        <span className="cat">Not enough history yet — check back tomorrow.</span>
      </div>
    );
  }

  const pad = 4;
  const values = target != null ? [...points, target] : points;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const toX = (i: number) => pad + (i / (points.length - 1)) * (width - pad * 2);
  const toY = (v: number) => height - pad - ((v - min) / range) * (height - pad * 2);

  const linePoints = points.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
  const lastX = toX(points.length - 1);
  const lastY = toY(points[points.length - 1]);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      {target != null ? (
        <line
          x1={pad}
          x2={width - pad}
          y1={toY(target)}
          y2={toY(target)}
          stroke="var(--muted)"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      ) : null}
      <polyline points={linePoints} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastX} cy={lastY} r={4} fill="var(--accent)" />
    </svg>
  );
}
