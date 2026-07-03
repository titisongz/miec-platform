'use client';
import React, { useEffect, useState, useMemo } from 'react';
import AIcon from '@/components/admin/icon';
import { getAllProfiles, setProfileActif, setEtudiantIPB, logAction, type Profile } from '@/lib/admin-queries';

function useToasts() {
  const [toasts, setToasts] = useState<{ id: number; msg: string; out?: boolean }[]>([]);
  function push(msg: string) {
    const id = Date.now();
    setToasts(t => [...t, { id, msg }]);
    setTimeout(() => setToasts(t => t.map(x => x.id === id ? { ...x, out: true } : x)), 3200);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }
  return [toasts, push] as const;
}

function ConfirmModal({ profile, onClose, onConfirm }: { profile: Profile; onClose: () => void; onConfirm: () => void }) {
  const [checked, setChecked] = useState(false);
  const [typed, setTyped] = useState('');
  const valid = checked && typed === profile.nom_complet;
  return (
    <div className="sa-scrim" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sa-modal danger" style={{ maxWidth: 480 }}>
        <div className="sa-modal-head">
          <div className="mhi danger-ico"><AIcon n="trash" size={17} /></div>
          <div>
            <div className="mht">Désactiver le compte</div>
            <div className="mhs">{profile.nom_complet}</div>
          </div>
          <button className="mhx" onClick={onClose}><AIcon n="x" size={16} /></button>
        </div>
        <div className="sa-modal-body">
          <div className="sa-confirm-warn">
            <p>Le compte de <strong>{profile.nom_complet}</strong> sera marqué comme désactivé. Cette action est journalisée.</p>
          </div>
          <label className="sa-confirm-check">
            <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} />
            <span>Je comprends que cette action est <strong>irréversible</strong> sans intervention manuelle.</span>
          </label>
          <div className="sa-confirm-name">
            <span className="lab">Tapez <strong>« {profile.nom_complet} »</strong> pour confirmer</span>
            <input value={typed} onChange={e => setTyped(e.target.value)} className={typed === profile.nom_complet ? 'valid' : ''} placeholder={profile.nom_complet} autoFocus />
          </div>
        </div>
        <div className="sa-modal-foot">
          <button className="sa-btn sa-btn-ghost" onClick={onClose}>Annuler</button>
          <button className="sa-btn sa-btn-danger" disabled={!valid} onClick={onConfirm}>
            <AIcon n="trash" size={16} />Désactiver le compte
          </button>
        </div>
      </div>
    </div>
  );
}

const ROLE_LABEL: Record<string, string> = { super_admin: 'Super Admin', responsable: 'Responsable', membre: 'Membre' };

export default function PageMembres() {
  const [all, setAll] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [ipbFilter, setIpbFilter] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [deactivate, setDeactivate] = useState<Profile | null>(null);
  const [toasts, push] = useToasts();

  useEffect(() => {
    getAllProfiles().then(p => { setAll(p); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => all.filter(p => {
    if (roleFilter && p.role !== roleFilter) return false;
    if (ipbFilter === 'oui' && !p.etudiant_ipb) return false;
    if (ipbFilter === 'non' && p.etudiant_ipb) return false;
    if (statutFilter === 'actif' && !p.actif) return false;
    if (statutFilter === 'inactif' && p.actif) return false;
    if (q) {
      const lq = q.toLowerCase();
      return p.nom_complet.toLowerCase().includes(lq) || p.email.toLowerCase().includes(lq);
    }
    return true;
  }), [all, q, roleFilter, ipbFilter, statutFilter]);

  async function doDeactivate() {
    if (!deactivate) return;
    try {
      await setProfileActif(deactivate.id, false);
      await logAction('deactivate', deactivate.nom_complet, 'compte désactivé (actif → false)');
      setAll(all.map(x => x.id === deactivate.id ? { ...x, actif: false } : x));
      push(`Compte désactivé : ${deactivate.nom_complet}`);
    } catch { push('Erreur'); }
    setDeactivate(null);
  }

  async function toggleIPB(p: Profile) {
    const next = !p.etudiant_ipb;
    try {
      await setEtudiantIPB(p.id, next);
      await logAction('ipb_toggle', p.nom_complet, next ? 'activé' : 'désactivé');
      setAll(all.map(x => x.id === p.id ? { ...x, etudiant_ipb: next } : x));
      push(`IPB ${next ? 'activé' : 'désactivé'} pour ${p.nom_complet}`);
    } catch { push('Erreur'); }
  }

  return (
    <div className="sa-page wide sa-pagefade">
      <div className="sa-pagehead">
        <div className="phi"><AIcon n="group" size={22} /></div>
        <div className="phd">
          <div className="phey"><span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--sa-red)' }} />Annuaire complet</div>
          <h1>Membres</h1>
          <p className="sub">Tous les comptes de la plateforme — rôles, statut IPB, actions de modération.</p>
        </div>
        <div className="acts">
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-3)' }}>{filtered.length} compte{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 0 }}>
          <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)', pointerEvents: 'none' }}>
            <AIcon n="search" size={14} />
          </span>
          <input className="sa-in" style={{ paddingLeft: 34 }} value={q} onChange={e => setQ(e.target.value)} placeholder="Nom ou email…" />
        </div>
        <select className="sa-sel" style={{ flex: '0 0 160px' }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">Tous les rôles</option>
          <option value="super_admin">Super Admin</option>
          <option value="responsable">Responsable</option>
          <option value="membre">Membre</option>
        </select>
        <select className="sa-sel" style={{ flex: '0 0 140px' }} value={ipbFilter} onChange={e => setIpbFilter(e.target.value)}>
          <option value="">IPB : tous</option>
          <option value="oui">Étudiant IPB</option>
          <option value="non">Non étudiant</option>
        </select>
        <select className="sa-sel" style={{ flex: '0 0 150px' }} value={statutFilter} onChange={e => setStatutFilter(e.target.value)}>
          <option value="">Statut : tous</option>
          <option value="actif">Actifs</option>
          <option value="inactif">Désactivés</option>
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3,4,5].map(i => <div key={i} className="sa-sk" style={{ height: 54, borderRadius: 10 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="sa-empty"><div className="et">Aucun résultat</div></div>
      ) : (
        <div className="sa-panel">
          <table className="sa-tbl">
            <thead>
              <tr><th></th><th>Membre</th><th>Email</th><th>Rôle</th><th>IPB</th><th>Inscrit le</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td style={{ width: 44 }}>
                    <span style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--bg-soft)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12.5, flexShrink: 0, border: '1px solid var(--line)' }}>
                      {p.nom_complet ? p.nom_complet[0].toUpperCase() : '?'}
                    </span>
                  </td>
                  <td>
                    <div className="sa-tprime">{p.nom_complet || '—'}</div>
                    {!p.actif && (
                      <div style={{ fontSize: 11, color: 'var(--sa-red)', fontWeight: 700, marginTop: 2 }}>Compte désactivé</div>
                    )}
                  </td>
                  <td><span style={{ fontSize: 12.5, color: 'var(--ink-3)', fontWeight: 600 }}>{p.email}</span></td>
                  <td style={{ width: 140 }}>
                    <span className={`sa-role ${p.role}`}>{ROLE_LABEL[p.role] ?? p.role}</span>
                  </td>
                  <td style={{ width: 80 }}>
                    <label className="sa-toggle">
                      <input type="checkbox" checked={p.etudiant_ipb} onChange={() => toggleIPB(p)} />
                      <span className="tk" />
                    </label>
                  </td>
                  <td style={{ width: 120 }}>
                    <span style={{ fontSize: 12.5, color: 'var(--ink-3)', fontWeight: 600 }}>
                      {p.created_at ? new Date(p.created_at).toLocaleDateString('fr-FR') : '—'}
                    </span>
                  </td>
                  <td style={{ width: 120 }}>
                    {p.actif && p.role !== 'super_admin' && (
                      <button className="sa-btn sa-btn-ghost sa-btn-sm" style={{ color: 'var(--sa-red)', borderColor: 'rgba(203,82,73,.25)' }} onClick={() => setDeactivate(p)}>
                        <AIcon n="trash" size={13} />Désactiver
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deactivate && <ConfirmModal profile={deactivate} onClose={() => setDeactivate(null)} onConfirm={doDeactivate} />}

      <div className="sa-toast-host">
        {toasts.map(t => (
          <div key={t.id} className={`sa-toast${t.out ? ' out' : ''}`}>
            <AIcon n="check" size={16} style={{ color: 'var(--sa-red)' }} />{t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
