export default function VehicleSilhouette({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 220"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="vehicle-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e7e9e8" />
          <stop offset="100%" stopColor="#aeb4b1" />
        </linearGradient>
        <linearGradient id="vehicle-window" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8f0f3" />
          <stop offset="100%" stopColor="#9aaab0" />
        </linearGradient>
      </defs>
      <path
        d="M40 150C40 120 60 100 100 95L140 60C150 48 168 42 190 42H240C262 42 278 50 288 62L320 95C360 100 370 120 370 150V165C370 172 365 176 358 176H300C295 186 285 192 272 192C259 192 249 186 244 176H156C151 186 141 192 128 192C115 192 105 186 100 176H52C45 176 40 172 40 165V150Z"
        fill="url(#vehicle-body)"
        stroke="#68716d"
        strokeWidth="1.5"
      />
      <path d="M150 62C156 54 168 50 182 50H238C252 50 262 56 268 66L292 96H128L150 62Z" fill="url(#vehicle-window)" stroke="#87918d" strokeWidth="1" />
      <line x1="200" y1="50" x2="200" y2="96" stroke="#87918d" strokeWidth="1.5" />
      <path d="M66 109H333" stroke="#8c9591" strokeWidth="1" opacity=".65" />
      <circle cx="128" cy="176" r="26" fill="#383f3c" />
      <circle cx="128" cy="176" r="14" fill="#79817d" />
      <circle cx="128" cy="176" r="6" fill="#cbd0ce" />
      <circle cx="272" cy="176" r="26" fill="#383f3c" />
      <circle cx="272" cy="176" r="14" fill="#79817d" />
      <circle cx="272" cy="176" r="6" fill="#cbd0ce" />
      <rect x="48" y="120" width="14" height="10" rx="2" fill="#f6d66d" stroke="#a57916" strokeWidth=".5" />
      <rect x="338" y="120" width="14" height="10" rx="2" fill="#e99c98" stroke="#934440" strokeWidth=".5" />
      <rect x="48" y="135" width="10" height="4" rx="1" fill="#727b77" />
      <rect x="342" y="135" width="10" height="4" rx="1" fill="#727b77" />
    </svg>
  );
}
