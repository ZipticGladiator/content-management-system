export default function WalletIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7a2 2 0 0 1 2-2h11a1 1 0 0 1 1 1v2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14.5 13.5h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
