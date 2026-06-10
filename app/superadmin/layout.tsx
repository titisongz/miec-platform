'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AIcon from '@/components/admin/icon';
import './superadmin.css';

// ── Nav structure ──────────────────────────────────────────────────────────

type NavEntry = { key: string; label: string; icon: string; danger?: boolean };

const NAV: NavEntry[] = [
  { key: '',              label: 'Tableau de bord',   icon: 'chart'  },
  { key: 'responsables',  label: 'Responsables',       icon: 'shield' },
  { key: 'membres',       label: 'Membres',            icon: 'group'  },
  { key: 'etudiants',     label: 'Étudiants IPB',      icon: 'cap'    },
];

const NAV_SYSTEM: NavEntry[] = [
  { key: 'parametres',    label: 'Paramètres globaux', icon: 'gear'   },
  { key: 'integrations',  label: 'Intégrations',       icon: 'link'   },
  { key: 'logs',          label: 'Journal de sécurité',icon: 'history', danger: true },
];

const PAGE_TITLE: Record<string, string> = {
  '':             'Tableau de bord',
  responsables:   'Responsables',
  membres:        'Membres',
  etudiants:      'Étudiants IPB',
  parametres:     'Paramètres globaux',
  integrations:   'Intégrations',
  logs:           'Journal de sécurité',
};

const PAGE_ICON: Record<string, string> = {
  '':             'chart',
  responsables:   'shield',
  membres:        'group',
  etudiants:      'cap',
  parametres:     'gear',
  integrations:   'link',
  logs:           'history',
};

// ── NavItem ────────────────────────────────────────────────────────────────

function NavItem({ entry, segment }: { entry: NavEntry; segment: string }) {
  const active = segment === entry.key;
  return (
    <Link href={`/superadmin${entry.key ? '/' + entry.key : ''}`}
      className={'sa-navitem' + (active ? ' on' : '') + (entry.danger ? ' danger' : '')}>
      <span className="ni"><AIcon n={entry.icon} size={16} /></span>
      <span className="nl">{entry.label}</span>
    </Link>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────

function Sidebar({ nom, onLogout }: { nom: string; onLogout: () => void }) {
  const pathname = usePathname();
  const segment = pathname.replace('/superadmin', '').replace(/^\//, '');

  const initials = nom ? nom.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : 'SA';

  return (
    <aside className="sa-side">
      <div className="sa-brand">
        <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--sa-red)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <AIcon n="shield" size={18} style={{ color: '#fff' }} />
        </div>
        <div>
          <div className="bt">MIEC</div>
          <div className="bs">Super Admin</div>
        </div>
      </div>

      <div className="sa-tag">
        <span className="tico"><AIcon n="lock" size={13} /></span>
        <div>
          <div className="ti">CONTRÔLE TOTAL</div>
          <div className="ts">Accès privilégié · niveau 3</div>
        </div>
      </div>

      <nav className="sa-nav">
        <div className="sa-nav-label">Comptes & membres</div>
        {NAV.map(e => <NavItem key={e.key} entry={e} segment={segment} />)}

        <div className="sa-nav-label" style={{ marginTop: 8 }}>Système</div>
        {NAV_SYSTEM.map(e => <NavItem key={e.key} entry={e} segment={segment} />)}
      </nav>

      <div className="sa-foot">
        <div className="sa-foot-user">
          <span className="av">{initials}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="un">{nom || 'Super Admin'}</div>
            <div className="ur">Super Admin</div>
          </div>
          <button onClick={onLogout} title="Déconnexion" style={{ color: 'var(--d-ink-3)', padding: 4 }}>
            <AIcon n="logout" size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}

// ── Topbar crumb ───────────────────────────────────────────────────────────

function Crumb({ segment }: { segment: string }) {
  const title = PAGE_TITLE[segment] ?? segment;
  const icon = PAGE_ICON[segment] ?? 'shield';
  return (
    <div className="sa-crumb">
      <span className="ico"><AIcon n={icon} size={15} /></span>
      <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Superadmin</span>
      <span className="slash">/</span>
      <span>{title}</span>
    </div>
  );
}

// ── Layout ─────────────────────────────────────────────────────────────────

type Status = 'checking' | 'ok' | 'denied';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('checking');
  const [nom, setNom] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const segment = pathname.replace('/superadmin', '').replace(/^\//, '');

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push('/'); return; }

        const { data: profile } = await supabase
          .from('profiles')
          .select('nom_complet, role')
          .eq('id', session.user.id)
          .single();

        if (!profile || profile.role !== 'super_admin') {
          setStatus('denied');
          return;
        }
        setNom(profile.nom_complet ?? '');
        setStatus('ok');
      } catch {
        setStatus('denied');
      }
    })();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/');
  }

  if (status === 'checking') {
    return (
      <div className="sa-checking">
        <div className="spin" />
        <p>Vérification des droits…</p>
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div className="sa-denied">
        <div className="di"><AIcon n="lock" size={26} /></div>
        <h2>Accès refusé</h2>
        <p>Cette zone est réservée aux super administrateurs de la plateforme MIEC.</p>
        <button className="sa-btn sa-btn-primary" style={{ marginTop: 8 }} onClick={() => router.push('/admin')}>
          <AIcon n="arrow" size={16} />Retour au back-office
        </button>
      </div>
    );
  }

  return (
    <div className="sa-shell">
      <Sidebar nom={nom} onLogout={handleLogout} />
      <div className="sa-main">
        <header className="sa-topbar">
          <Crumb segment={segment} />
          <div className="sa-topbar-search">
            <span className="si"><AIcon n="search" size={14} /></span>
            <input placeholder="Rechercher un membre, un log…" />
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="sa-modepill">
              <span className="dot" />
              SUPER ADMIN
            </div>
          </div>
        </header>
        <main className="sa-content">
          {children}
        </main>
      </div>
    </div>
  );
}
