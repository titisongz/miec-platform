'use client';
import React, { useEffect, useState, useMemo } from 'react';
import AIcon from '@/components/admin/icon';
import { getAllProfiles, setEtudiantIPB, logAction, type Profile } from '@/lib/admin-queries';
import { supabase } from '@/lib/supabase';
import { useToasts, ToastHost } from '@/components/superadmin/ui';

type Enrollment = { profile_id: string; cours_code: string; cours_titre: string; created_at: string };

export default function PageEtudiants() {
  const [all, setAll] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [enrollments, setEnrollments] = useState<Record<string, Enrollment[]>>({});
  const [toasts, push] = useToasts();

  useEffect(() => {
    (async () => {
      try {
        const [profiles, { data: enr }] = await Promise.all([
          getAllProfiles(),
          supabase.from('ipb_inscriptions')
            .select('profile_id, cours:ipb_cours(code, titre), created_at')
            .eq('statut', 'accepte'),
        ]);
        setAll(profiles);
        const map: Record<string, Enrollment[]> = {};
        for (const e of (enr ?? [])) {
          const cours = (e.cours as unknown) as { code: string; titre: string } | null;
          if (!map[e.profile_id]) map[e.profile_id] = [];
          map[e.profile_id].push({ profile_id: e.profile_id, cours_code: cours?.code ?? '', cours_titre: cours?.titre ?? '', created_at: e.created_at });
        }
        setEnrollments(map);
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  const students = useMemo(() => all.filter(p => p.etudiant_ipb).filter(p =>
    !q || p.nom_complet.toLowerCase().includes(q.toLowerCase()) || p.email.toLowerCase().includes(q.toLowerCase())
  ), [all, q]);

  const nonStudents = useMemo(() => all.filter(p => !p.etudiant_ipb).filter(p =>
    q ? p.nom_complet.toLowerCase().includes(q.toLowerCase()) || p.email.toLowerCase().includes(q.toLowerCase()) : false
  ), [all, q]);

  async function toggle(p: Profile, val: boolean) {
    try {
      await setEtudiantIPB(p.id, val);
      await logAction(val ? 'ipb_grant' : 'ipb_revoke', p.nom_complet);
      setAll(all.map(x => x.id === p.id ? { ...x, etudiant_ipb: val } : x));
      push(val ? `Statut IPB accordé à ${p.nom_complet}` : `Statut IPB retiré à ${p.nom_complet}`);
    } catch { push('Erreur'); }
  }

  return (
    <div className="sa-page wide sa-pagefade">
      <div className="sa-pagehead">
        <div className="phi"><AIcon n="cap" size={22} /></div>
        <div className="phd">
          <div className="phey"><span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--sa-red)' }} />Institut Protestant de la Bible</div>
          <h1>Étudiants IPB</h1>
          <p className="sub">Gérez le statut étudiant IPB des membres. Activez ou retirez l'accès aux cours selon les inscriptions.</p>
        </div>
        <div className="acts">
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-3)' }}>{students.length} étudiant{students.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 360, marginBottom: 20 }}>
        <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)', pointerEvents: 'none' }}>
          <AIcon n="search" size={14} />
        </span>
        <input className="sa-in" style={{ paddingLeft: 34 }} value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher un membre…" />
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3,4].map(i => <div key={i} className="sa-sk" style={{ height: 70, borderRadius: 12 }} />)}
        </div>
      ) : (
        <>
          <div className="sa-panel" style={{ marginBottom: 24 }}>
            <div className="sa-panel-head">
              <div className="phi"><AIcon n="cap" size={14} /></div>
              <div className="pht">Étudiants actifs</div>
              <div className="phs">{students.length} comptes avec statut IPB</div>
            </div>
            {students.length === 0 ? (
              <div className="sa-empty" style={{ padding: 32 }}>
                <div className="et">{q ? 'Aucun résultat' : 'Aucun étudiant IPB'}</div>
              </div>
            ) : (
              <table className="sa-tbl">
                <thead><tr><th></th><th>Étudiant</th><th>Email</th><th>Cours suivis</th><th>Statut IPB</th></tr></thead>
                <tbody>
                  {students.map(p => {
                    const cours = enrollments[p.id] ?? [];
                    return (
                      <tr key={p.id}>
                        <td style={{ width: 44 }}>
                          <span style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(44,143,102,.12)', color: '#1E6E4D', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12.5 }}>
                            {p.nom_complet ? p.nom_complet[0].toUpperCase() : '?'}
                          </span>
                        </td>
                        <td><div className="sa-tprime">{p.nom_complet || '—'}</div></td>
                        <td><span style={{ fontSize: 12.5, color: 'var(--ink-3)', fontWeight: 600 }}>{p.email}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                            {cours.length === 0
                              ? <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>—</span>
                              : cours.map(c => <span key={c.cours_code} className="sa-codepill" style={{ background: 'rgba(44,143,102,.1)', color: '#1E6E4D' }}>{c.cours_code}</span>)}
                          </div>
                        </td>
                        <td style={{ width: 100 }}>
                          <label className="sa-toggle">
                            <input type="checkbox" checked={true} onChange={() => toggle(p, false)} />
                            <span className="tk" style={{'--sa-red': '#2F8F66'} as React.CSSProperties} />
                          </label>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Non-students (shown only when searching) */}
          {q && nonStudents.length > 0 && (
            <div className="sa-panel">
              <div className="sa-panel-head">
                <div className="phi" style={{ background: 'var(--bg-soft)', color: 'var(--ink-3)' }}><AIcon n="group" size={14} /></div>
                <div className="pht">Membres sans statut IPB</div>
                <div className="phs">correspondant à « {q} »</div>
              </div>
              <table className="sa-tbl">
                <thead><tr><th></th><th>Membre</th><th>Email</th><th>Activer IPB</th></tr></thead>
                <tbody>
                  {nonStudents.slice(0, 5).map(p => (
                    <tr key={p.id}>
                      <td style={{ width: 44 }}>
                        <span style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--bg-soft)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12.5, border: '1px solid var(--line)' }}>
                          {p.nom_complet ? p.nom_complet[0].toUpperCase() : '?'}
                        </span>
                      </td>
                      <td><div className="sa-tprime">{p.nom_complet || '—'}</div></td>
                      <td><span style={{ fontSize: 12.5, color: 'var(--ink-3)', fontWeight: 600 }}>{p.email}</span></td>
                      <td style={{ width: 120 }}>
                        <label className="sa-toggle">
                          <input type="checkbox" checked={false} onChange={() => toggle(p, true)} />
                          <span className="tk" />
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <ToastHost toasts={toasts} />
    </div>
  );
}
