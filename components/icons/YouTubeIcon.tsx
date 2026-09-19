export default function YouTubeIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={(size * 34) / 48}
      viewBox="0 0 48 34"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M47 5.3a6 6 0 0 0-4.2-4.2C39 0 24 0 24 0S9 0 5.2 1.1A6 6 0 0 0 1 5.3 62 62 0 0 0 0 17a62 62 0 0 0 1 11.7 6 6 0 0 0 4.2 4.2C9 34 24 34 24 34s15 0 18.8-1.1a6 6 0 0 0 4.2-4.2A62 62 0 0 0 48 17a62 62 0 0 0-1-11.7z"
        fill="#FF0000"
      />
      <path d="M19 24.5V9.5L32 17z" fill="#fff" />
    </svg>
  );
}
