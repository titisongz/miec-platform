import type React from 'react';
import type { AccentKey, CSSVars } from './types';

export const ACCENT: Record<AccentKey, { c: string; t: string; i: string }> = {
  ens:   { c: '#2F8F66', t: '#ECF6F1', i: '#1E6E4D' },
  eva:   { c: '#DD8A3C', t: '#FBF1E5', i: '#B26A22' },
  pri:   { c: '#3E72CE', t: '#ECF1FB', i: '#2C56A6' },
  tem:   { c: '#CB5249', t: '#FBEDEC', i: '#A53A33' },
  ann:   { c: '#4B5563', t: '#F4F5F6', i: '#374151' },
  ipb:   { c: '#7C5BC9', t: '#F2EEFB', i: '#5C3FA3' },
  res:   { c: '#C2912F', t: '#F8F1E0', i: '#946C16' },
  slate: { c: '#3C4654', t: '#F4F5F6', i: '#374151' },
};

export function accentStyle(key: AccentKey): CSSVars {
  const a = ACCENT[key] || ACCENT.slate;
  return { '--c': a.c, '--c-t': a.t, '--c-i': a.i };
}

export const RES_ICON: Record<string, string> = {
  pdf: 'filetext', audio: 'music', partition: 'music', plan: 'calendar',
};

export const INP_STYLE: React.CSSProperties = {
  width: '100%', height: 48, padding: '0 15px', borderRadius: 12,
  border: '1px solid var(--line-2)', fontSize: 15, outline: 'none', background: 'var(--bg)',
};
