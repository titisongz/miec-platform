'use client';
import React from 'react';

const P: Record<string, React.ReactNode> = {
  book: <path d="M12 7v14M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>,
  compass: <g><circle cx="12" cy="12" r="9.5"/><path d="M16.5 7.5l-2.1 6.4-6.4 2.1 2.1-6.4z"/></g>,
  flame: <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>,
  quote: <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"/>,
  mega: <g><path d="M3 11l18-5v12L3 14z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></g>,
  cap: <g><path d="M22 10L12 5 2 10l10 5z"/><path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5"/></g>,
  folder: <path d="M3 7a2 2 0 0 1 2-2h3.9l2 2H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>,
  books: <path d="M16 6l4 13M12 5v14M8 7v12M4 5v14"/>,
  search: <g><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></g>,
  bell: <g><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9z"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></g>,
  user: <g><circle cx="12" cy="8" r="4"/><path d="M5.5 21a6.5 6.5 0 0 1 13 0"/></g>,
  home: <path d="M3 10.5L12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5"/>,
  heart: <path d="M19.5 13.6c1.4-1.5 2.5-3.1 2.5-5.1A4.5 4.5 0 0 0 12 5.6 4.5 4.5 0 0 0 2 8.5c0 2 1.1 3.6 2.5 5.1L12 21z"/>,
  bookmark: <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>,
  cr: <path d="M9 6l6 6-6 6"/>,
  cl: <path d="M15 6l-6 6 6 6"/>,
  cd: <path d="M6 9l6 6 6-6"/>,
  play: <path d="M7 4.5l13 7.5-13 7.5z" fill="currentColor" stroke="none"/>,
  dl: <path d="M12 3v12M7 11l5 5 5-5M5 21h14"/>,
  filetext: <g><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h6"/></g>,
  calendar: <g><path d="M7 3v3M17 3v3M3.5 9h17"/><rect x="3.5" y="5" width="17" height="16" rx="2.5"/></g>,
  mail: <g><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 7l8.5 6 8.5-6"/></g>,
  wa: <g><path d="M12 3a9 9 0 0 0-7.7 13.7L3 21l4.5-1.2A9 9 0 1 0 12 3z"/><path d="M8.5 9.2c0 3.6 2.7 6.3 6.3 6.3"/></g>,
  check: <path d="M5 12.5l4.5 4.5L19 6.5"/>,
  x: <path d="M6 6l12 12M18 6L6 18"/>,
  plus: <path d="M12 5v14M5 12h14"/>,
  clock: <g><circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/></g>,
  lock: <g><rect x="4.5" y="11" width="15" height="10" rx="2"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/></g>,
  ar: <path d="M5 12h14M13 6l6 6-6 6"/>,
  filter: <path d="M3 5h18l-7 8.2V19l-4 2v-7.8z"/>,
  share: <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2.5V14"/>,
  music: <g><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></g>,
  users: <g><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="8" r="4"/><path d="M21 21v-2a4 4 0 0 0-3-3.9M16 4a4 4 0 0 1 0 7.8"/></g>,
  pin: <g><path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></g>,
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>,
  star: <path d="M12 3.5l2.6 5.3 5.9.8-4.3 4.1 1 5.8L12 16.8 6.8 19.5l1-5.8L3.5 9.6l5.9-.8z"/>,
  chart: <path d="M3 21h18M7 21V11M12 21V5M17 21v-7"/>,
  award: <g><circle cx="12" cy="9" r="6"/><path d="M8.5 14L7 22l5-3 5 3-1.5-8"/></g>,
  grid: <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>,
  pen: <path d="M4 20h4L20 8l-4-4L4 16zM14 6l4 4"/>,
  info: <g><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.6h.01"/></g>,
  signal: <path d="M2 20h.01M7 20v-4M12 20v-9M17 20V7M22 20V3" stroke="currentColor"/>,
  settings: <g><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 14H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 10 4.6V4a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-1.1 2.7H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/></g>,
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>,
  history: <g><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 4v4h4M12 8v4l3 2"/></g>,
  eye: <g><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></g>,
  eyeoff: <g><path d="M9.9 5.1A9.6 9.6 0 0 1 12 5c6.5 0 10 7 10 7a16.5 16.5 0 0 1-2.6 3.4M6.6 6.6A16.4 16.4 0 0 0 2 12s3.5 7 10 7a9.6 9.6 0 0 0 4-.9"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/><path d="M3 3l18 18"/></g>,
};

export interface IconProps {
  n: string;
  size?: number;
  sw?: number;
  fill?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function Icon({ n, size = 22, sw = 1.75, fill = 'none', className = '', style }: IconProps) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill={fill} stroke="currentColor"
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      className={className} style={style}
    >
      {P[n] ?? null}
    </svg>
  );
}
