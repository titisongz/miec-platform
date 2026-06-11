'use client';
import React, { ReactNode, useEffect, useRef, useState, useCallback } from 'react';
import AIcon from './icon';
import { validatePhotos, MAX_PHOTO_MB } from '@/lib/storage';

// ── Accent map ────────────────────────────────────────────────────────────────

export const AACCENT: Record<string, { c: string; t: string; i: string }> = {
  ens:   { c: '#2F8F66', t: '#ECF6F1', i: '#1E6E4D' },
  eva:   { c: '#DD8A3C', t: '#FBF1E5', i: '#B26A22' },
  pri:   { c: '#3E72CE', t: '#ECF1FB', i: '#2C56A6' },
  tem:   { c: '#CB5249', t: '#FBEDEC', i: '#A53A33' },
  ann:   { c: '#4B5563', t: '#F4F5F6', i: '#374151' },
  ipb:   { c: '#7C5BC9', t: '#F2EEFB', i: '#5C3FA3' },
  res:   { c: '#C2912F', t: '#F8F1E0', i: '#946C16' },
  slate: { c: '#3C4654', t: '#F4F5F6', i: '#374151' },
};

export function aStyle(k: string): React.CSSProperties {
  const a = AACCENT[k] ?? AACCENT.slate;
  return { '--c': a.c, '--c-t': a.t, '--c-i': a.i } as React.CSSProperties;
}

// ── Reveal on scroll ──────────────────────────────────────────────────────────

export function Reveal({ children, delay = 0, className = '', style, ...rest }: {
  children: ReactNode; delay?: number; className?: string; style?: React.CSSProperties; [k: string]: unknown;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const n = ref.current; if (!n) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { n.classList.add('vis'); io.disconnect(); } },
      { threshold: 0.05, rootMargin: '0px 0px -4% 0px' }
    );
    io.observe(n);
    const tm = setTimeout(() => { if (!n.classList.contains('vis')) n.classList.add('vis'); }, 320 + Math.min(delay, 400));
    return () => { clearTimeout(tm); io.disconnect(); };
  }, [delay]);
  return (
    <div ref={ref} className={'a-reveal ' + className}
      style={{ transitionDelay: delay + 'ms', ...style }} {...rest as object}>
      {children}
    </div>
  );
}

// ── Form controls ─────────────────────────────────────────────────────────────

export function Field({ label, hint, opt, children, icon, style }: {
  label?: string; hint?: string; opt?: string; children: ReactNode;
  icon?: string; style?: React.CSSProperties;
}) {
  return (
    <label className="a-fld" style={style}>
      {label && (
        <span className="lab">
          {icon && <AIcon n={icon} size={14} sw={2} />}
          {label}
          {opt && <span className="opt">· {opt}</span>}
        </span>
      )}
      {children}
      {hint && <span className="hint">{hint}</span>}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="a-in" {...props} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="a-ta" {...props} />;
}

export function Select({ children, ...p }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return <select className="a-sel" {...p}>{children}</select>;
}

// Sélecteur de photos : aperçus (URLs déjà uploadées + nouveaux fichiers),
// ajout/suppression, validation nombre + taille. L'image n'est jamais recadrée.
function Thumb({ src, onRemove }: { src: string; onRemove: () => void }) {
  return (
    <span style={{ position: 'relative', width: 76, height: 76, borderRadius: 10, overflow: 'hidden', flex: '0 0 auto', border: '1px solid var(--line)' }}>
      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      <button type="button" onClick={onRemove} aria-label="Retirer"
        style={{ position: 'absolute', top: 3, right: 3, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,.6)', color: '#fff', display: 'grid', placeItems: 'center' }}>
        <AIcon n="x" size={13} sw={2.4} />
      </button>
    </span>
  );
}

export function MediaPicker({ urls, files, onUrls, onFiles, max = 5 }: {
  urls: string[]; files: File[];
  onUrls: (u: string[]) => void; onFiles: (f: File[]) => void; max?: number;
}) {
  const [err, setErr] = useState('');
  const total = urls.length + files.length;
  function add(list: FileList | null) {
    if (!list || list.length === 0) return;
    const picked = Array.from(list);
    const e = validatePhotos(picked, total);
    if (e) { setErr(e); return; }
    setErr('');
    onFiles([...files, ...picked]);
  }
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        {urls.map((u, i) => <Thumb key={'u' + i} src={u} onRemove={() => onUrls(urls.filter((_, j) => j !== i))} />)}
        {files.map((f, i) => <Thumb key={'f' + i} src={URL.createObjectURL(f)} onRemove={() => onFiles(files.filter((_, j) => j !== i))} />)}
        {total < max && (
          <label style={{ width: 76, height: 76, borderRadius: 10, border: '1.5px dashed var(--line-2)', display: 'grid', placeItems: 'center', color: 'var(--ink-3)', cursor: 'pointer', flex: '0 0 auto' }}>
            <AIcon n="upload" size={20} />
            <input type="file" accept="image/*" multiple={max > 1} style={{ display: 'none' }}
              onChange={e => { add(e.target.files); e.target.value = ''; }} />
          </label>
        )}
      </div>
      {err && <div style={{ color: '#dc2626', fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>{err}</div>}
      <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
        {max > 1 ? `Jusqu'à ${max} photos` : '1 photo'} · {MAX_PHOTO_MB} Mo max · affichée sans recadrage.
      </div>
    </div>
  );
}

export function Toggle({ on, onTog }: { on: boolean; onTog: () => void }) {
  return (
    <button type="button" className={'a-tog' + (on ? ' on' : '')} onClick={onTog}>
      <span className="kn" />
    </button>
  );
}

export function Seg({ tabs, active, onPick, fill = false }: {
  tabs: { v: string; l: string; icon?: string; n?: number }[];
  active: string; onPick: (v: string) => void; fill?: boolean;
}) {
  return (
    <div className={'a-seg' + (fill ? ' fill' : '')}>
      {tabs.map(t => (
        <button key={t.v} className={active === t.v ? 'on' : ''} onClick={() => onPick(t.v)}>
          {t.icon && <AIcon n={t.icon} size={15} sw={2} />}
          {t.l}
          {t.n != null && <span style={{ fontWeight: 800, opacity: .7 }}>{t.n}</span>}
        </button>
      ))}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────

export function Badge({ tone = '', icon, dot = true, children }: {
  tone?: string; icon?: string; dot?: boolean; children: ReactNode;
}) {
  return (
    <span className={'a-badge ' + tone}>
      {icon ? <AIcon n={icon} size={11} sw={2.4} /> : (dot && <span className="bdot" />)}
      {children}
    </span>
  );
}

// ── Placeholder ───────────────────────────────────────────────────────────────

export function Ph({ label, style, className = '', children }: {
  label?: string; style?: React.CSSProperties; className?: string; children?: ReactNode;
}) {
  return (
    <div className={'a-ph ' + className} style={style}>
      {label && <span className="ph-lbl">{label}</span>}
      {children}
    </div>
  );
}

// ── Page header ───────────────────────────────────────────────────────────────

export function PageHead({ accent = 'slate', icon, eyebrow, title, sub, children }: {
  accent?: string; icon?: string; eyebrow?: ReactNode; title: string;
  sub?: string; children?: ReactNode;
}) {
  return (
    <Reveal className="a-phead" style={aStyle(accent)}>
      {icon && (
        <span className="picon"><AIcon n={icon} size={25} /></span>
      )}
      <div style={{ minWidth: 0 }}>
        {eyebrow && <div className="a-eyebrow" style={{ marginBottom: 7 }}>{eyebrow}</div>}
        <h1>{title}</h1>
        {sub && <div className="psub">{sub}</div>}
      </div>
      {children && <div className="pacts">{children}</div>}
    </Reveal>
  );
}

// ── Panel (card section) ──────────────────────────────────────────────────────

export function Panel({ accent, icon, title, actions, children, style, bodyStyle, pad = true }: {
  accent?: string; icon?: string; title?: string; actions?: ReactNode;
  children: ReactNode; style?: React.CSSProperties; bodyStyle?: React.CSSProperties; pad?: boolean;
}) {
  return (
    <div className="a-card" style={{ ...(accent ? aStyle(accent) : {}), ...style }}>
      {title != null && (
        <div className="a-card-h">
          {icon && (
            <span style={{ width: 30, height: 30, borderRadius: 9, display: 'grid', placeItems: 'center', background: 'var(--c-t)', color: 'var(--c-i)', flex: '0 0 auto' }}>
              <AIcon n={icon} size={16} />
            </span>
          )}
          <h3>{title}</h3>
          {actions}
        </div>
      )}
      <div className={pad ? 'a-card-b' : ''} style={bodyStyle}>{children}</div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export function Modal({ onClose, accent = 'slate', icon, title, children, footer, wide = false }: {
  onClose?: () => void; accent?: string; icon?: string; title?: string;
  children: ReactNode; footer?: ReactNode; wide?: boolean;
}) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="a-scrim" onClick={onClose}>
      <div className={'a-modal' + (wide ? ' wide' : '')} style={aStyle(accent)} onClick={e => e.stopPropagation()}>
        {title != null && (
          <div className="a-modal-h">
            {icon && <span className="mi"><AIcon n={icon} size={20} /></span>}
            <h3>{title}</h3>
            <button className="a-iact" onClick={onClose}><AIcon n="x" size={18} /></button>
          </div>
        )}
        <div className="a-modal-b">{children}</div>
        {footer && <div className="a-modal-f">{footer}</div>}
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

export interface Toast { id: string; msg: string; accent: string }

export function useToasts(): [Toast[], (msg: string, accent?: string) => void] {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((msg: string, accent = 'slate') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, msg, accent }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2400);
  }, []);
  return [toasts, push];
}

export function ToastHost({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="a-toastwrap">
      {toasts.map(t => (
        <div className="a-toast" key={t.id} style={aStyle(t.accent)}>
          <span className="ti"><AIcon n="check" size={14} sw={2.6} /></span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ── Misc ──────────────────────────────────────────────────────────────────────

export function Spinner() { return <span className="a-spin" />; }

export function Empty({ icon = 'search', title, sub }: { icon?: string; title: string; sub?: string }) {
  return (
    <div className="a-empty">
      <div className="ei"><AIcon n={icon} size={26} /></div>
      <div className="et">{title}</div>
      {sub && <div style={{ fontSize: 13.5 }}>{sub}</div>}
    </div>
  );
}

export function SkeletonRows({ n = 4 }: { n?: number }) {
  return (
    <div className="a-card" style={{ padding: 0, overflow: 'hidden' }}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 16px', borderBottom: i < n - 1 ? '1px solid var(--line)' : 'none' }}>
          <div className="a-sk" style={{ width: 38, height: 38, borderRadius: 10, flex: '0 0 auto' }} />
          <div style={{ flex: 1 }}>
            <div className="a-sk" style={{ height: 13, width: '45%', marginBottom: 8 }} />
            <div className="a-sk" style={{ height: 11, width: '28%' }} />
          </div>
          <div className="a-sk" style={{ height: 24, width: 70, borderRadius: 999 }} />
        </div>
      ))}
    </div>
  );
}
