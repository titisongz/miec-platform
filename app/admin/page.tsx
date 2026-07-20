'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AIcon from '@/components/admin/icon';
import { Reveal, Badge, Panel, aStyle, useToasts, ToastHost } from '@/components/admin/ui';
import { getAdminStats } from '@/lib/admin-queries';
import { getModuleCounts } from '@/lib/queries';

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ accent, icon, value, label, delta, delay }: {
  accent: string; icon: string; value: string | number; label: string;
  delta?: string; delay?: number;
}) {
  return (
    <Reveal className="a-stat" delay={delay} style={aStyle(accent)}>
      <span className="glow" />
      <span className="si"><AIcon n={icon} size={20} /></span>
      <div className="sv">{value}</div>
      <div className="sl">{label}</div>
      {delta && <div className="sd"><AIcon n="trend" size={13} sw={2.2} />{delta}</div>}
    </Reveal>
  );
}

// ── Module bar ────────────────────────────────────────────────────────────────

// `key` = clé renvoyée par getModuleCounts() (lib/queries.ts), qui fait un
// count() exact sur la table Supabase correspondante.
const MODULES_BAR = [
  { key: 'enseignements',  mod: 'Enseignements', c: 'ens', icon: 'book' },
  { key: 'temoignages',    mod: 'Témoignages',   c: 'tem', icon: 'quote' },
  { key: 'annonces',       mod: 'Annonces',      c: 'ann', icon: 'mega' },
  { key: 'priere',         mod: 'Prière',        c: 'pri', icon: 'flame' },
  { key: 'evangelisation', mod: 'Évangélisation',c: 'eva', icon: 'compass' },
  { key: 'ressources',     mod: 'Ressources',    c: 'res', icon: 'folder' },
  { key: 'librairie',      mod: 'Librairie',     c: 'res', icon: 'books' },
  { key: 'ipb',            mod: 'IPB · Cours',   c: 'ipb', icon: 'cap' },
];

function ModuleBar({ m, max, delay, n }: { m: typeof MODULES_BAR[0]; max: number; delay: number; n: number }) {
  const pct = max > 0 ? Math.round((n / max) * 100) : 0;
  return (
    <Reveal delay={delay} style={{ ...aStyle(m.c), display: 'flex', alignItems: 'center', gap: 13, padding: '9px 0' }}>
      <span style={{ width: 30, height: 30, borderRadius: 9, display: 'grid', placeItems: 'center', background: 'var(--c-t)', color: 'var(--c-i)', flex: '0 0 auto' }}>
        <AIcon n={m.icon} size={16} />
      </span>
      <span style={{ width: 128, flex: '0 0 auto', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{m.mod}</span>
      <span style={{ flex: 1, height: 9, borderRadius: 5, background: 'var(--bg-soft)', overflow: 'hidden' }}>
        <span style={{ display: 'block', height: '100%', width: pct + '%', background: 'var(--c)', borderRadius: 5, transition: 'width 1s var(--ease-out)' }} />
      </span>
      <span style={{ width: 42, textAlign: 'right', fontWeight: 800, fontSize: 14, color: 'var(--c-i)', flex: '0 0 auto' }}>{n}</span>
    </Reveal>
  );
}

// ── Dashboard page ────────────────────────────────────────────────────────────

export default function PageDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ members: 0, students: 0, contenus: 0, prieres: 0, pendingTem: 0 });
  const [toasts, pushToast] = useToasts();
  // new Date() hors rendu serveur : l'heure du serveur ≠ client → hydration mismatch (React #418).
  const [hour, setHour] = useState(12);
  const greet = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bel après-midi' : 'Bonsoir';

  // Contenus par module : vrais count() Supabase (une requête head:true par
  // table), et non plus des valeurs de démonstration codées en dur.
  const [moduleCounts, setModuleCounts] = useState<Record<string, number>>({});
  const maxMod = Math.max(1, ...MODULES_BAR.map(m => moduleCounts[m.key] ?? 0));

  const refresh = useCallback(() => Promise.all([
    getAdminStats().then(setStats).catch(() => {}),
    getModuleCounts().then(setModuleCounts).catch(() => {}),
  ]), []);

  useEffect(() => {
    setHour(new Date().getHours());
    refresh();
  }, [refresh]);

  const SHORTCUTS = [
    ['verset',         'sparkle', 'slate', 'Verset du jour'],
    ['enseignements',  'book',    'ens',   'Nouvel enseignement'],
    ['notifications',  'bell',    'ann',   'Envoyer une notif'],
    ['newsletter',     'mail',    'pri',   'Rédiger la lettre'],
  ] as const;

  return (
    <div className="a-page wide a-pagefade">
      {/* page header */}
      <Reveal className="a-phead" style={aStyle('slate')}>
        <span className="picon"><AIcon n="grid" size={25} /></span>
        <div style={{ minWidth: 0 }}>
          <div className="a-eyebrow" style={{ marginBottom: 7 }}>
            <AIcon n="shield" size={12} sw={2.2} />Espace responsables
          </div>
          <h1>{greet}.</h1>
          <div className="psub">Voici l&apos;état de la communauté et les éléments qui requièrent votre attention aujourd&apos;hui.</div>
        </div>
        <div className="pacts">
          <button className="a-btn a-btn-ghost a-btn-sm" onClick={() => { refresh(); pushToast('Données actualisées', 'slate'); }}>
            <AIcon n="refresh" size={16} />Actualiser
          </button>
        </div>
      </Reveal>

      {/* à traiter */}
      <div className="a-eyebrow" style={{ color: 'var(--ink-3)', marginBottom: 12 }}>À traiter</div>
      <div className="a-statgrid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 14 }}>
        <Reveal style={aStyle('tem')}>
          <button className="a-card tap" style={{ width: '100%', textAlign: 'left', padding: 18, display: 'flex', alignItems: 'center', gap: 15 }}
            onClick={() => router.push('/admin/temoignages')}>
            <span style={{ width: 48, height: 48, borderRadius: 13, display: 'grid', placeItems: 'center', background: 'var(--c-t)', color: 'var(--c-i)', flex: '0 0 auto' }}>
              <AIcon n="quote" size={24} />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 3 }}>
                <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1 }}>{stats.pendingTem}</span>
                <Badge tone="amber" icon="clock">En attente</Badge>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-2)' }}>Témoignages à valider</div>
            </div>
            <AIcon n="cr" size={20} style={{ color: 'var(--c-i)' }} />
          </button>
        </Reveal>
        <Reveal delay={60} style={aStyle('pri')}>
          <button className="a-card tap" style={{ width: '100%', textAlign: 'left', padding: 18, display: 'flex', alignItems: 'center', gap: 15 }}
            onClick={() => router.push('/admin/priere')}>
            <span style={{ width: 48, height: 48, borderRadius: 13, display: 'grid', placeItems: 'center', background: 'var(--c-t)', color: 'var(--c-i)', flex: '0 0 auto' }}>
              <AIcon n="flame" size={24} />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 3 }}>
                <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1 }}>{stats.prieres}</span>
                <Badge tone="blue" dot>Sujets actifs</Badge>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-2)' }}>Sujets de prière</div>
            </div>
            <AIcon n="cr" size={20} style={{ color: 'var(--c-i)' }} />
          </button>
        </Reveal>
      </div>

      {/* statistiques */}
      <div className="a-eyebrow" style={{ color: 'var(--ink-3)', margin: '24px 0 12px' }}>Statistiques</div>
      <div className="a-statgrid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <StatCard accent="pri"   icon="users"  value={stats.members}  label="Membres inscrits"     delay={0} />
        <StatCard accent="ipb"   icon="cap"    value={stats.students} label="Étudiants IPB actifs"  delay={60} />
        <StatCard accent="ens"   icon="layout" value={stats.contenus} label="Enseignements publiés" delay={120} />
        <StatCard accent="slate" icon="flame"  value={stats.prieres}  label="Sujets de prière"     delay={180} />
      </div>

      {/* deux colonnes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr .85fr', gap: 18, marginTop: 18, alignItems: 'start' }}>
        {/* contenus par module */}
        <Panel accent="slate" icon="chart" title="Contenus par module">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {MODULES_BAR.map((m, i) => (
              <ModuleBar key={m.key} m={m} n={moduleCounts[m.key] ?? 0} max={maxMod} delay={i * 40} />
            ))}
          </div>
        </Panel>

        {/* raccourcis */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="a-eyebrow" style={{ color: 'var(--ink-3)', marginBottom: 4 }}>Raccourcis</div>
          {SHORTCUTS.map((s, i) => (
            <Reveal key={i} delay={i * 40} style={aStyle(s[2])}>
              <button className="a-card tap" style={{ width: '100%', padding: '14px 15px', display: 'flex', alignItems: 'center', gap: 13 }}
                onClick={() => router.push('/admin/' + s[0])}>
                <span style={{ width: 38, height: 38, borderRadius: 11, display: 'grid', placeItems: 'center', background: 'var(--c-t)', color: 'var(--c-i)', flex: '0 0 auto' }}>
                  <AIcon n={s[1]} size={19} />
                </span>
                <span style={{ fontWeight: 700, fontSize: 13.5, letterSpacing: '-.01em', flex: 1, textAlign: 'left' }}>{s[3]}</span>
                <AIcon n="cr" size={16} style={{ color: 'var(--ink-3)' }} />
              </button>
            </Reveal>
          ))}
        </div>
      </div>

      <ToastHost toasts={toasts} />
    </div>
  );
}
