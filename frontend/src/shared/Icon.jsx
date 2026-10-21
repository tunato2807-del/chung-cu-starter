import React from "react";

const paths = {
  building: "M3 21h18M5 21V5l7-2v18M12 9h7v12M8 7v1m0 3v1m0 3v1m7-4h1m-1 4h1",
  dashboard: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  message:
    "M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-2 2V11.5a9.5 9.5 0 0 1 19 0ZM7 9h10M7 13h7",
  home: "m3 10 9-7 9 7M5 9v12h14V9M9 21v-7h6v7",
  map: "m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Zm6-3v15m6-12v15",
  layers: "m12 3 10 5-10 5L2 8l10-5ZM2 12l10 5 10-5M2 16l10 5 10-5",
  key: "M15 13a5 5 0 1 0-4-4L3 17v4h4v-3h3l5-5Z",
  users:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.9M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-7a4 4 0 0 1 0 8",
  car: "m5 7 2-4h10l2 4m-16 9V9l2-2h14l2 2v7H3Zm2 0v4m14-4v4M6 11h2m8 0h2",
  tool: "m14 6 4 4 3-3a7 7 0 0 1-9 9l-6 6-4-4 6-6a7 7 0 0 1 9-9l-3 3Z",
  calendar: "M4 5h16v16H4zM4 10h16M8 3v4m8-4v4M8 14h2m4 0h2m-8 3h2",
  receipt: "M5 3h14v19l-3-2-4 2-4-2-3 2V3Zm3 5h8m-8 4h8m-8 4h4",
  meter: "M4 18a9 9 0 1 1 16 0H4Zm8-5 4-5M7 9l1 1m9 4h1m-12 0h1m5-9v1",
  chart: "M3 3v18h18M7 16v-5m5 5V7m5 9v-8",
  wallet:
    "M20 8H5a2 2 0 0 1 0-4h13v4M3 6v13a2 2 0 0 0 2 2h15V8Zm17 5h-5v4h5m-2-2h.01",
  file: "M14 2H5v20h14V7l-5-5Zm0 0v6h5M8 12h8m-8 4h8",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4",
  qr: "M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h2v2h-2zM21 15v6h-6m-3-9h1M3 12h6m3-9v6m0 6v6m6-9h3",
  user: "M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2M12 9a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5-2 5 5",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  external: "M14 3h7v7m0-7L10 14M10 3H3v18h18v-7",
  logout: "M9 3H3v18h6m-1-9h13m-5-5 5 5-5 5",
  menu: "M4 6h16M4 12h16M4 18h16",
  chevron: "m6 9 6 6 6-6",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  eyeOff:
    "m3 3 18 18M9 5.5a11 11 0 0 1 3-.5c6 0 10 7 10 7a22 22 0 0 1-3 3.8M6 6.3A23 23 0 0 0 2 12s4 7 10 7a11 11 0 0 0 5-1.3M10 10a3 3 0 0 0 4 4",
  shield: "m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6l9-4Zm-4 10 3 3 5-6",
  refresh:
    "M20 7V3m0 4h-4M4 17v4m0-4h4M4 9a8 8 0 0 1 14-5l2 3M4 17l2 3a8 8 0 0 0 14-5",
  previous: "m14 6-6 6 6 6",
  next: "m10 6 6 6-6 6",
  pause: "M8 5v14M16 5v14",
  play: "m8 4 12 8-12 8V4Z",
};

export default function Icon({ name, size = 20, className = "" }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[name] || paths.building} />
    </svg>
  );
}
