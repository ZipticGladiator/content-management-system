export default function PaperclipIcon({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ verticalAlign: "-1px" }}
    >
      <path
        d="M8 12.5l6.5-6.5a3 3 0 0 1 4.24 4.24L11 18a5 5 0 0 1-7.07-7.07l7.07-7.07"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
