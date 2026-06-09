'use client';
import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import AIcon from '@/components/admin/icon';
import { ToastHost, useToasts, aStyle } from '@/components/admin/ui';
import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/lib/types';
import './admin.css';

// ── Nav config ────────────────────────────────────────────────────────────────

const NAV_MAIN = [
  { key: 'dashboard', label: 'Tableau de bord', icon: 'grid', ac: '#E2A93F' },
];
const NAV_MODULES = [
  { key: 'verset',         label: 'Verset du jour',  icon: 'sparkle', ac: '#E2A93F' },
  { key: 'enseignements',  label: 'Enseignements',   icon: 'book',    ac: '#2F8F66' },
  { key: 'temoignages',    label: 'Témoignages',     icon: 'quote',   ac: '#CB5249' },
  { key: 'evangelisation', label: 'Évangélisation',  icon: 'compass', ac: '#DD8A3C' },
  { key: 'priere',         label: 'Prière',          icon: 'flame',   ac: '#3E72CE' },
  { key: 'annonces',       label: 'Annonces',        icon: 'mega',    ac: '#4B5563' },
  { key: 'ipb',            label: 'IPB',             icon: 'cap',     ac: '#7C5BC9' },
  { key: 'ressources',     label: 'Ressources',      icon: 'folder',  ac: '#C2912F' },
  { key: 'librairie',      label: 'Librairie',       icon: 'books',   ac: '#C2912F' },
];
const NAV_COMMS = [
  { key: 'notifications', label: 'Notifications', icon: 'bell', ac: '#4B5563' },
  { key: 'newsletter',    label: 'Newsletter',    icon: 'mail', ac: '#3E72CE' },
];

const PAGE_META: Record<string, { title: string; accent: string; group?: string }> = {
  dashboard:      { title: 'Tableau de bord', accent: 'slate' },
  verset:         { title: 'Verset du jour',  accent: 'slate',  group: 'Modules' },
  enseignements:  { title: 'Enseignements',   accent: 'ens',    group: 'Modules' },
  temoignages:    { title: 'Témoignages',     accent: 'tem',    group: 'Modules' },
  evangelisation: { title: 'Évangélisation',  accent: 'eva',    group: 'Modules' },
  priere:         { title: 'Prière',          accent: 'pri',    group: 'Modules' },
  annonces:       { title: 'Annonces',        accent: 'ann',    group: 'Modules' },
  ipb:            { title: 'IPB',             accent: 'ipb',    group: 'Modules' },
  ressources:     { title: 'Ressources',      accent: 'res',    group: 'Modules' },
  librairie:      { title: 'Librairie',       accent: 'res',    group: 'Modules' },
  notifications:  { title: 'Notifications',   accent: 'ann',    group: 'Communication' },
  newsletter:     { title: 'Newsletter',      accent: 'pri',    group: 'Communication' },
};

// ── Nav item ──────────────────────────────────────────────────────────────────

function NavItem({ item, active }: { item: { key: string; label: string; icon: string; ac: string }; active: boolean }) {
  return (
    <Link href={`/admin/${item.key === 'dashboard' ? '' : item.key}`}
      className={'a-navitem mod' + (active ? ' on' : '')}
      style={{ '--ac': item.ac } as React.CSSProperties}>
      <span className="nico"><AIcon n={item.icon} size={15} /></span>
      <span className="ntxt">{item.label}</span>
    </Link>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({ page, profile, onLogout }: {
  page: string; profile: UserProfile | null; onLogout: () => void;
}) {
  const initials = profile
    ? profile.nom_complet.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase()
    : '?';
  const roleLabel = profile?.role === 'super_admin' ? 'Responsable principal' : 'Responsable de module';

  return (
    <aside className="a-side">
      <div className="a-side-brand">
        <Image src="/emblem.jpeg" alt="MIEC" width={34} height={34} style={{ borderRadius: 9, background: '#fff', padding: 3 }} />
        <div>
          <div className="bt">MIEC</div>
          <div className="bs">Back-office</div>
        </div>
      </div>

      <div className="a-side-tag">
        <span className="lk"><AIcon n="shield" size={14} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="tt">Espace responsables</div>
          <div className="ts">Gestion de contenu</div>
        </div>
      </div>

      <div className="a-side-scroll">
        {NAV_MAIN.map(it => <NavItem key={it.key} item={it} active={page === it.key} />)}
        <div className="a-side-lbl">Modules</div>
        {NAV_MODULES.map(it => <NavItem key={it.key} item={it} active={page === it.key} />)}
        <div className="a-side-lbl">Communication</div>
        {NAV_COMMS.map(it => <NavItem key={it.key} item={it} active={page === it.key} />)}
      </div>

      <div className="a-side-foot">
        <span className="av">{initials}</span>
        <div className="fi">
          <div className="fn">{profile?.nom_complet ?? '…'}</div>
          <div className="fr">{roleLabel}</div>
        </div>
        <button className="fx" title="Déconnexion" onClick={onLogout}>
          <AIcon n="logout" size={17} />
        </button>
      </div>
    </aside>
  );
}

// ── Breadcrumb ────────────────────────────────────────────────────────────────

function Crumb({ page }: { page: string }) {
  const m = PAGE_META[page] ?? { title: '', accent: 'slate' };
  return (
    <div className="a-crumb" style={aStyle(m.accent)}>
      <span>Back-office</span>
      {m.group && (
        <>
          <AIcon n="cr" size={13} />
          <span>{m.group}</span>
        </>
      )}
      <AIcon n="cr" size={13} />
      <span className="cc"><span className="cdot" />{m.title}</span>
    </div>
  );
}

// ── Loading / Access denied screens ──────────────────────────────────────────

function Checking() {
  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#1B1E25', fontFamily: 'system-ui, sans-serif' }}>
      <span style={{ width: 22, height: 22, borderRadius: '50%', border: '2.4px solid rgba(226,169,63,.3)', borderTopColor: '#E2A93F', animation: 'spin .7s linear infinite', display: 'inline-block' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function AccessDenied({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#1B1E25', fontFamily: 'system-ui, sans-serif', color: '#EAECF1', flexDirection: 'column', gap: 16, textAlign: 'center', padding: 24 }}>
      <div style={{ width: 60, height: 60, borderRadius: 16, background: 'rgba(203,82,73,.18)', display: 'grid', placeItems: 'center', color: '#CB5249', marginBottom: 4 }}>
        <AIcon n="lock" size={28} />
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.02em' }}>Accès refusé</div>
      <p style={{ margin: 0, fontSize: 14, color: '#A6ACBC', lineHeight: 1.55, maxWidth: 340 }}>
        Le back-office est réservé aux responsables et pasteurs. Votre compte n&apos;a pas les droits nécessaires.
      </p>
      <button onClick={onBack} style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 8, height: 42, padding: '0 20px', borderRadius: 12, background: '#fff', color: '#23262E', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>
        <AIcon n="ar" size={16} style={{ transform: 'rotate(180deg)' }} />
        Retour à l&apos;accueil
      </button>
    </div>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<'checking' | 'ok' | 'denied'>('checking');
  const [toasts, pushToast] = useToasts();

  // Determine current page key from pathname
  const page = (() => {
    const seg = pathname.replace(/^\/admin\/?/, '').split('/')[0];
    return seg || 'dashboard';
  })();

  const m = PAGE_META[page] ?? { title: '', accent: 'slate' };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setStatus('denied'); return; }
      const { data } = await supabase
        .from('profiles')
        .select('id, nom_complet, role, etudiant_ipb')
        .eq('id', session.user.id)
        .maybeSingle();
      if (!data || (data.role !== 'responsable' && data.role !== 'super_admin')) {
        setStatus('denied');
      } else {
        setProfile(data as UserProfile);
        setStatus('ok');
      }
    });
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/');
  }

  if (status === 'checking') return <Checking />;
  if (status === 'denied') return <AccessDenied onBack={() => router.push('/')} />;

  return (
    <div className="admin-shell">
      <Sidebar page={page} profile={profile} onLogout={handleLogout} />
      <div className="a-main">
        {/* topbar */}
        <div className="a-topbar" style={aStyle(m.accent)}>
          <Crumb page={page} />
          <span className="grow" />
          <div className="a-tb-search">
            <AIcon n="search" size={17} />
            <input placeholder="Rechercher dans le back-office…" />
          </div>
          <button className="a-tb-icon" onClick={() => pushToast('Aucune nouvelle notification', 'ann')}>
            <AIcon n="bell" size={19} />
          </button>
          <span className="a-tb-modepill"><span className="pdot" />BACK-OFFICE</span>
        </div>
        {/* content */}
        <div className="a-content">
          {children}
        </div>
      </div>
      <ToastHost toasts={toasts} />
    </div>
  );
}
