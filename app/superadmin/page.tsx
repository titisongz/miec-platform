'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AIcon from '@/components/admin/icon';
import { getSuperAdminStats, getRecentSignups, type Profile } from '@/lib/admin-queries';

type Stats = { members: number; resps: number; superadmins: number; students: number; prieres: number; pendingTem: number };

const ROLE_LABEL: Record<string, string> = { super_admin: 'Super Admin', responsable: 'Responsable', membre: 'Membre', visiteur: 'Visiteur' };
const ROLE_CLASS: Record<string, string> = { super_admin: 'red', responsable: 'amber', membre: 'neutral', visiteur: 'neutral' };

function relDate(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "aujourd'hui";
  if (d === 1) return 'hier';
  return `il y a ${d} j`;
}

export default function PageSADashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getSuperAdminStats(), getRecentSignups(7)]).then(([s, r]) => {
      setStats(s); setRecent(r); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { l: 'Membres total', v: stats.members, i: 'group', c: '--sa-red', ct: '--sa-red-t', ci: '--sa-red-i', delta: null },
    { l: 'Responsables', v: stats.resps, i: 'shield', c: '#E2A93F', ct: '#FFF8E7', ci: '#7A5218', delta: null },
    { l: 'Super Admins', v: stats.superadmins, i: 'lock', c: '#7C5BC9', ct: '#F2EEFB', ci: '#5C3FA3', delta: null },
    { l: 'Étudiants IPB', v: stats.students, i: 'cap', c: '#2F8F66', ct: '#ECF6F1', ci: '#1E6E4D', delta: null },
  ] : [];

  const shortcuts = [
    { key: 'responsables', label: 'Gérer les responsables', icon: 'shield', sub: 'Promouvoir ou révoquer des comptes' },
    { key: 'membres',      label: 'Annuaire des membres',   icon: 'group',  sub: 'Voir et modifier tous les profils' },
    { key: 'parametres',   label: 'Paramètres globaux',     icon: 'gear',   sub: 'Feature flags et configuration' },
    { key: 'logs',         label: 'Journal de sécurité',    icon: 'history',sub: 'Audit des actions sensibles' },
  ];

  return (
    <div className="sa-page wide sa-pagefade">
      {/* Page header */}
      <div className="sa-pagehead">
        <div className="phi"><AIcon n="chart" size={22} /></div>
        <div className="phd">
          <div className="phey"><span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--sa-red)' }} />Panneau système</div>
          <h1>Tableau de bord</h1>
          <p className="sub">Vue globale de la plateforme MIEC — membres, rôles, activité récente.</p>
        </div>
        <div className="acts">
          <Link href="/admin" className="sa-btn sa-btn-ghost" style={{ fontSize: 13 }}>
            <AIcon n="arrow" size={15} />Back-office
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
          {[1,2,3,4].map(i => <div key={i} className="sa-sk" style={{ height: 100, borderRadius: 16 }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
          {statCards.map(s => (
            <div key={s.l} className="sa-stat" style={{ '--c-t': s.ct, '--c-i': s.ci } as React.CSSProperties}>
              <div className="glow" />
              <div className="si"><AIcon n={s.i} size={20} /></div>
              <div className="st">{s.v}</div>
              <div className="sl">{s.l}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Santé du système */}
          <div className="sa-panel">
            <div className="sa-panel-head">
              <div className="phi"><AIcon n="chart" size={14} /></div>
              <div className="pht">Santé du système</div>
              <div className="phs">Temps réel</div>
            </div>
            <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { n: 'Supabase (base de données)', s: 'ok', v: 'Opérationnel' },
                { n: 'Authentification',           s: 'ok', v: 'Opérationnel' },
                { n: 'Resend (emails)',             s: 'ok', v: 'Opérationnel' },
                { n: 'Stockage fichiers',           s: 'ok', v: 'Opérationnel' },
              ].map(h => (
                <div key={h.n} className="sa-health">
                  <span className={`hi ${h.s}`} />
                  <span className="hn">{h.n}</span>
                  <span className="hv">{h.v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Alertes à traiter */}
          {stats && (stats.pendingTem > 0) && (
            <div className="sa-danger">
              <div className="sa-danger-head">
                <span className="dico"><AIcon n="bell" size={14} /></span>
                <span className="dt">Éléments en attente</span>
              </div>
              <div className="ds">
                {stats.pendingTem > 0 && <span>{stats.pendingTem} témoignage{stats.pendingTem > 1 ? 's' : ''} attend{stats.pendingTem > 1 ? 'ent' : ''} validation.</span>}
              </div>
              <Link href="/admin/temoignages" className="sa-btn sa-btn-ghost" style={{ fontSize: 13 }}>
                <AIcon n="arrow" size={15} />Traiter dans le back-office
              </Link>
            </div>
          )}

          {/* Inscriptions récentes */}
          <div className="sa-panel">
            <div className="sa-panel-head">
              <div className="phi"><AIcon n="group" size={14} /></div>
              <div className="pht">Inscriptions récentes</div>
              <div className="phs">7 derniers jours · {recent.length} compte{recent.length !== 1 ? 's' : ''}</div>
            </div>
            {loading ? (
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1,2,3].map(i => <div key={i} className="sa-sk" style={{ height: 44, borderRadius: 10 }} />)}
              </div>
            ) : recent.length === 0 ? (
              <div className="sa-empty" style={{ padding: 32 }}>
                <div className="et">Aucune inscription cette semaine</div>
              </div>
            ) : (
              <table className="sa-tbl">
                <thead><tr><th>Membre</th><th>Email</th><th>Rôle</th><th>Date</th></tr></thead>
                <tbody>
                  {recent.map(p => (
                    <tr key={p.id}>
                      <td><div className="sa-tprime">{p.nom_complet || '—'}</div></td>
                      <td><span style={{ fontSize: 12.5, color: 'var(--ink-3)', fontWeight: 600 }}>{p.email}</span></td>
                      <td><span className={`sa-role ${p.role}`}>{ROLE_LABEL[p.role] ?? p.role}</span></td>
                      <td style={{ width: 110 }}><span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>{relDate(p.created_at)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Shortcuts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 4 }}>
            Actions rapides
          </div>
          {shortcuts.map(s => (
            <Link key={s.key} href={`/superadmin/${s.key}`}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, textDecoration: 'none', transition: 'box-shadow .18s, transform .18s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--sh-2)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = ''; (e.currentTarget as HTMLElement).style.transform = ''; }}>
              <span style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--sa-red-t)', color: 'var(--sa-red-i)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <AIcon n={s.icon} size={16} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{s.label}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 500, marginTop: 2 }}>{s.sub}</div>
              </div>
              <AIcon n="chevron" size={14} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
