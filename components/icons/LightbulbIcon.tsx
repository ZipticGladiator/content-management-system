export default function LightbulbIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 18h6M9.5 21h5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M12 2.5a6.5 6.5 0 0 0-3.8 11.8c.6.45 1 1.15 1 1.9V17h5.6v-.8c0-.75.4-1.45 1-1.9A6.5 6.5 0 0 0 12 2.5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.12"
      />
    </svg>
  );
}
