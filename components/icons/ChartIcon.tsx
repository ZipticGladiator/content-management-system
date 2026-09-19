export default function ChartIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3.5 20.5V4M3.5 20.5H21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="6.5" y="13" width="3" height="7.5" rx="0.8" fill="currentColor" fillOpacity="0.85" />
      <rect x="12" y="9" width="3" height="11.5" rx="0.8" fill="currentColor" fillOpacity="0.85" />
      <rect x="17.5" y="5.5" width="3" height="15" rx="0.8" fill="currentColor" fillOpacity="0.85" />
    </svg>
  );
}
