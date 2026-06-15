'use client';
import React, { useRef, useEffect, useState, ReactNode } from 'react';
import Image from 'next/image';
import Icon from './icons';
import { accentStyle, ACCENT } from '@/lib/accent';
import type { AccentKey, CSSVars, FrictionConfig, Verse } from '@/lib/types';
import DB from '@/lib/data';
import { getVerset } from '@/lib/queries';

/* ---------- reveal-on-scroll ---------- */
let _io: IntersectionObserver | null = null;
if (typeof window !== 'undefined') {
  _io = new IntersectionObserver(
    (es) => { es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); _io!.unobserve(e.target); } }); },
    { threshold: 0.06, rootMargin: '0px 0px -5% 0px' }
  );
}

export function Reveal({ children, delay = 0, className = '', style, ...rest }: {
  children: ReactNode; delay?: number; className?: string; style?: React.CSSProperties; [key: string]: unknown;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const n = ref.current;
    if (!n || !_io) return;
    _io.observe(n);
    return () => _io?.unobserve(n);
  }, []);
  return (
    <div ref={ref} className={'reveal ' + className}
      style={{ transitionDelay: delay + 'ms', ...style }} {...rest as object}>
      {children}
    </div>
  );
}

/* ---------- status bar ---------- */
export function StatusBar() {
  // État vide au départ : new Date() au rendu serveur ≠ client → hydration mismatch (React #418).
  // L'heure est renseignée après le montage côté client.
  const [t, setT] = useState('');
  function fmt() { const d = new Date(); return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); }
  useEffect(() => { setT(fmt()); const i = setInterval(() => setT(fmt()), 20000); return () => clearInterval(i); }, []);
  return (
    <div className="statusbar">
      <span>{t}</span>
      <span className="sb-right">
        <Icon n="signal" size={16} sw={2} />
        <svg width="17" height="13" viewBox="0 0 17 13" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M1 5.5C3 3.5 5.5 2.5 8.5 2.5s5.5 1 7.5 3M3.2 8c1.5-1.4 3.3-2.1 5.3-2.1s3.8.7 5.3 2.1M5.6 10.4c.8-.8 1.8-1.2 2.9-1.2s2.1.4 2.9 1.2" />
          <circle cx="8.5" cy="12" r=".9" fill="currentColor" stroke="none" />
        </svg>
        <svg width="26" height="13" viewBox="0 0 26 13" fill="none">
          <rect x="1" y="1.5" width="21" height="10" rx="3" stroke="currentColor" strokeOpacity=".4" strokeWidth="1" />
          <rect x="2.6" y="3" width="16" height="7" rx="1.6" fill="currentColor" />
          <rect x="23.5" y="4.5" width="1.6" height="4" rx="1" fill="currentColor" fillOpacity=".5" />
        </svg>
      </span>
    </div>
  );
}

/* ---------- app bar ---------- */
export function AppBar({ role, initials = '', onSearch, onBell, onProfile }: {
  role: string; initials?: string; onSearch: () => void; onBell: () => void; onProfile: () => void;
}) {
  const member = role !== 'visiteur';
  return (
    <header className="appbar">
      <div className="appbar-row">
        <div className="brand">
          <Image src="/emblem.jpeg" alt="MIEC" width={80} height={80} style={{ objectFit: 'contain', borderRadius: 10 }} />
          <div>
            <div style={{ lineHeight: 1 }}>MIEC</div>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <button className="iconbtn" onClick={onSearch} aria-label="Rechercher"><Icon n="search" size={21} /></button>
        <button className="iconbtn" onClick={onBell} aria-label="Notifications">
          <Icon n="bell" size={21} />{member && <span className="dot" />}
        </button>
        {member
          ? <button onClick={onProfile} className="avatar">{initials}</button>
          : <button className="btn btn-soft btn-sm" style={accentStyle('slate')} onClick={onProfile}>Connexion</button>}
      </div>
    </header>
  );
}

/* ---------- verse marquee banner ---------- */
export function VerseBanner() {
  // « Verset du jour » = un seul verset. On part du verset par défaut comme
  // placeholder le temps de la requête, puis on charge celui du jour.
  const [v, setV] = useState<Verse>(DB.VERSES[0]);
  useEffect(() => { getVerset().then(setV); }, []);
  // Bande de largeur STABLE : 8 copies du même verset = deux moitiés
  // identiques → translateX(-50%) sans couture, et assez large pour remplir
  // l'écran (même mobile). La structure ne change jamais au chargement :
  // seul le texte change, et le key={v.r} remonte proprement la piste pour
  // repartir de translateX(0) au lieu de sauter en plein défilement.
  const run = Array.from({ length: 8 });
  return (
    <div className="verse-banner">
      <div className="vtag"><Icon n="sparkle" size={13} sw={2} />Verset</div>
      <div className="marquee">
        <div className="marquee-track" key={v.r}>
          {run.map((_, i) => (
            <span className="marquee-item" key={i}>{v.t}<span className="sep" /><b>{v.r}</b></span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- verse editorial block ---------- */
export function VerseBlock({ verse }: { verse?: { t: string; r: string } }) {
  const [v, setV] = useState(verse ?? DB.VERSES[0]);
  useEffect(() => { if (!verse) getVerset().then(setV); }, [verse]);
  return (
    <Reveal className="verse-block">
      <span className="vk">&ldquo;</span>
      <div className="vlabel"><Icon n="sparkle" size={13} sw={2} />Verset du jour</div>
      <div className="vtext">{v.t}</div>
      <div className="vref">— {v.r}</div>
    </Reveal>
  );
}

/* ---------- search bar ---------- */
export function SearchBar({ placeholder = 'Rechercher…', value, onChange, autoFocus }: {
  placeholder?: string; value: string; onChange: (v: string) => void;
  onFocus?: () => void; autoFocus?: boolean;
}) {
  return (
    <div className="searchbar">
      <Icon n="search" size={18} />
      <input placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} autoFocus={autoFocus} />
      {value ? <button className="iconbtn" style={{ width: 26, height: 26 }} onClick={() => onChange('')}><Icon n="x" size={16} /></button> : null}
    </div>
  );
}

/* ---------- chip row ---------- */
export function ChipRow({ items, active, onPick }: {
  items: (string | { v: string; l: string })[]; active: string; onPick: (v: string) => void;
}) {
  return (
    <div className="chiprow">
      {items.map(it => {
        const val = typeof it === 'string' ? it : it.v;
        const lbl = typeof it === 'string' ? it : it.l;
        return (
          <button key={val} className={'chip' + (active === val ? ' on' : '')} onClick={() => onPick(val)}>{lbl}</button>
        );
      })}
    </div>
  );
}

/* ---------- placeholder ---------- */
export function Ph({ label, style, className = '', children }: {
  label?: string; style?: React.CSSProperties; className?: string; children?: ReactNode;
}) {
  return (
    <div className={'ph ' + className} style={style}>
      {label && <span className="ph-lbl">{label}</span>}
      {children}
    </div>
  );
}

/* ---------- bottom sheet ---------- */
export function Sheet({ onClose, children, center = false }: {
  onClose: () => void; children: ReactNode; center?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="scrim" onClick={onClose}>
      <div className={'sheet' + (center ? ' center' : '')} onClick={e => e.stopPropagation()}>
        {!center && <div className="grip" />}
        {children}
      </div>
    </div>
  );
}

/* ---------- friction modal ---------- */
export function FrictionModal({ config, onCreate, onContinue, onClose }: {
  config: FrictionConfig; onCreate: () => void; onContinue: () => void; onClose: () => void;
}) {
  const ipb = config.ipb;
  return (
    <Sheet center onClose={onClose}>
      <button className="iconbtn" style={{ position: 'absolute', top: 14, right: 14 }} onClick={onClose}><Icon n="x" size={18} /></button>
      <div style={{ width: 54, height: 54, borderRadius: 16, display: 'grid', placeItems: 'center', background: 'var(--c-t)', color: 'var(--c-i)', marginBottom: 16 }}>
        <Icon n={ipb ? 'cap' : 'heart'} size={26} sw={1.8} />
      </div>
      <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.15, marginBottom: 8 }}>{config.title}</div>
      <p className="lead" style={{ margin: '0 0 20px' }}>{config.benefit}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="btn btn-primary btn-block" onClick={onCreate}>
          <Icon n={ipb ? 'cap' : 'sparkle'} size={18} />{ipb ? "M'inscrire à l'IPB" : 'Créer un compte'}
        </button>
        <button className="btn btn-ghost btn-block" onClick={onContinue}>Continuer à lire</button>
      </div>
      <p className="t3" style={{ textAlign: 'center', fontSize: 12, margin: '14px 0 0' }}>Tous les contenus restent librement accessibles.</p>
    </Sheet>
  );
}

/* ---------- tag pill ---------- */
export function Tag({ c, children, icon }: { c: AccentKey; children: ReactNode; icon?: string }) {
  return (
    <span className="tagpill" style={accentStyle(c)}>
      {icon ? <Icon n={icon} size={11} sw={2.2} /> : <span className="tdot" />}
      {children}
    </span>
  );
}

/* ---------- small bits ---------- */
export function Spinner() { return <span className="spin" />; }

export function SkeletonCard() {
  return (
    <div className="card" style={{ padding: 13, display: 'flex', gap: 13, alignItems: 'center' }}>
      <div className="sk" style={{ width: 62, height: 62, borderRadius: 14, flex: '0 0 auto' }} />
      <div style={{ flex: 1 }}>
        <div className="sk" style={{ height: 13, width: '40%', marginBottom: 9 }} />
        <div className="sk" style={{ height: 15, width: '85%', marginBottom: 7 }} />
        <div className="sk" style={{ height: 11, width: '55%' }} />
      </div>
    </div>
  );
}

export function EmptySearch({ label }: { label: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--ink-3)' }}>
      <div style={{ width: 54, height: 54, borderRadius: 16, background: 'var(--bg-soft)', display: 'grid', placeItems: 'center', margin: '0 auto 14px', color: 'var(--ink-3)' }}>
        <Icon n="search" size={24} />
      </div>
      <div style={{ fontWeight: 700, color: 'var(--ink-2)', marginBottom: 4 }}>Aucun résultat</div>
      <div style={{ fontSize: 13.5 }}>Rien ne correspond à « {label} ».</div>
    </div>
  );
}

/* ---------- highlight helper ---------- */
export function hl(text: string, q: string): ReactNode {
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark style={{ background: 'color-mix(in srgb,var(--c) 22%,transparent)', color: 'inherit', borderRadius: 3, padding: '0 1px' }}>
        {text.slice(i, i + q.length)}
      </mark>
      {text.slice(i + q.length)}
    </>
  );
}

/* ---------- toggle ---------- */
export function Toggle({ on, onTog, accent = 'pri' }: { on: boolean; onTog: () => void; accent?: AccentKey }) {
  return (
    <button onClick={onTog} style={{
      width: 46, height: 28, borderRadius: 999, flex: '0 0 auto', position: 'relative',
      background: on ? ACCENT[accent].c : 'var(--line-2)', transition: 'background .25s var(--ease)',
    } as CSSVars}>
      <span style={{
        position: 'absolute', top: 3, left: on ? 21 : 3, width: 22, height: 22, borderRadius: '50%',
        background: '#fff', boxShadow: 'var(--sh-1)', transition: 'left .25s var(--ease)',
      }} />
    </button>
  );
}

/* ---------- module hero ---------- */
export function ModuleHero({ mkey, extra }: { mkey: string; extra?: ReactNode }) {
  const m = DB.MODULES[mkey];
  return (
    <div className="hero-head" style={{ paddingTop: 16 }}>
      <Reveal>
        <div className="eyebrow" style={{ marginBottom: 9 }}>
          <span style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--c)', color: '#fff', display: 'grid', placeItems: 'center' }}>
            <Icon n={m.icon} size={15} sw={2} />
          </span>
          Module · {m.label}
        </div>
        <div className="h1" style={{ marginBottom: 5 }}>{m.label}</div>
        <p className="lead" style={{ margin: 0 }}>{m.desc}</p>
        {extra}
      </Reveal>
    </div>
  );
}

export function BootList({ n = 4 }: { n?: number }) {
  return <div className="list">{Array.from({ length: n }).map((_, i) => <SkeletonCard key={i} />)}</div>;
}

/* ---------- segmented control (for IPB) ---------- */
export function Segmented({ tabs, active, onPick }: {
  tabs: { v: string; l: string; icon: string }[];
  active: string;
  onPick: (v: string) => void;
}) {
  return (
    <div style={{ margin: '14px 16px 4px', display: 'flex', gap: 4, padding: 4, background: 'var(--bg-soft)', border: '1px solid var(--line)', borderRadius: 14 }}>
      {tabs.map(t => (
        <button key={t.v} onClick={() => onPick(t.v)} style={{
          flex: 1, height: 38, borderRadius: 10, fontSize: 13.5, fontWeight: 700, letterSpacing: '-.01em',
          transition: 'all .22s var(--ease)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          background: active === t.v ? 'var(--surface)' : 'transparent',
          color: active === t.v ? 'var(--c-i)' : 'var(--ink-3)',
          boxShadow: active === t.v ? 'var(--sh-1)' : 'none',
        }}>
          <Icon n={t.icon} size={15} sw={2} />{t.l}
        </button>
      ))}
    </div>
  );
}

/* ---------- useBoot hook ---------- */
export function useBoot(ms = 480) {
  const [r, setR] = useState(false);
  useEffect(() => { const t = setTimeout(() => setR(true), ms); return () => clearTimeout(t); }, [ms]);
  return r;
}
