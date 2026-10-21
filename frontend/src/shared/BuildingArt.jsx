import React, { useId } from "react";

// Minh họa trang trí bằng SVG, hoạt động cả khi không có kết nối Internet.
export default function BuildingArt() {
  const id = useId();
  return (
    <svg
      className="building-art"
      viewBox="0 0 480 400"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient
          id={id}
          x1="100"
          y1="60"
          x2="400"
          y2="370"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#e1efe9" />
          <stop offset="1" stopColor="#b5d6c6" />
        </linearGradient>
      </defs>
      <circle cx="254" cy="199" r="167" fill={`url(#${id})`} />
      <circle cx="370" cy="84" r="31" fill="#e8bd78" />
      <path
        d="M40 343h400M65 355h350"
        stroke="#8fb6a4"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M106 343V129l126-34v248" fill="#fff" />
      <path d="m232 95 54 32v216h-54" fill="#c8dfd3" />
      <path d="M168 113V61l131-26v308H168" fill="#f8fbf9" />
      <path d="m299 35 61 36v272h-61" fill="#1c665c" />
      <path d="M168 61 299 35l61 36-132 27-60-37Z" fill="#e7f0eb" />
      <path
        d="m180 89 106-22M180 139l106-22M180 189l106-22M180 239l106-22M180 289l106-22"
        stroke="#d9e8e0"
        strokeWidth="2"
      />
      {[0, 1, 2, 3, 4].map((row) => (
        <g key={row}>
          {[0, 1, 2].map((column) => (
            <path
              key={column}
              d={`m${184 + column * 35} ${102 + row * 50 - column * 7} 21-4v25l-21 4v-25Z`}
              fill={row === 2 && column === 1 ? "#e9c78f" : "#7eaaa0"}
            />
          ))}
          {[0, 1].map((column) => (
            <path
              key={column}
              d={`m${312 + column * 23} ${94 + row * 48 + column * 12} 12 7v23l-12-7V${94 + row * 48 + column * 12}Z`}
              fill="#72a79b"
            />
          ))}
        </g>
      ))}
      <path d="M231 343v-30l27-5v35" fill="#236d60" />
      {[0, 1, 2, 3].map((row) => (
        <path
          key={row}
          d={`m120 ${160 + row * 39} 22-6v19l-22 6v-19Z`}
          fill="#a6c5b7"
        />
      ))}
      <path d="M80 343v-61m313 61v-48" stroke="#386959" strokeWidth="5" />
      <path
        d="M80 235c-34 35-37 68 0 68s33-36 0-68Zm313 17c-27 29-31 58 0 58s28-29 0-58Z"
        fill="#4d8e71"
      />
      <path
        d="M93 343h50m220 0h41"
        stroke="#386959"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <rect
        x="18"
        y="165"
        width="122"
        height="58"
        rx="14"
        fill="white"
        stroke="#dbe9e1"
      />
      <circle cx="46" cy="194" r="14" fill="#e6f3ec" />
      <path
        d="m39 194 5 5 9-10"
        stroke="#25765b"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M71 187h48m-48 12h33"
        stroke="#b0c7bc"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}
