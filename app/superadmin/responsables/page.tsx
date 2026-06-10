'use client';
import React, { useEffect, useState } from 'react';
import AIcon from '@/components/admin/icon';
import { getAllProfiles, updateProfileRole, logAction, type Profile } from '@/lib/admin-queries';

// ── 2-step Confirm Modal ───────────────────────────────────────────────────────

function ConfirmModal({
  title, sub, warn, confirmName, confirmLabel,
  onClose, onConfirm, danger = true,
}: {
  title: string; sub?: string; warn: string; confirmName: string; confirmLabel: string;
  onClose: () => void; onConfirm: () => void; danger?: boolean;
}) {
  const [checked, setChecked] = useState(false);
  const [typed, setTyped] = useState('');
  const valid = checked && typed === confirmName;

  return (
    <div className="sa-scrim" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`sa-modal${danger ? ' danger' : ''}`} style={{ maxWidth: 480 }}>
        <div className="sa-modal-head">
          <div className={`mhi${danger ? ' danger-ico' : ''}`}><AIcon n="trash" size={17} /></div>
          <div>
            <div className="mht">{title}</div>
            {sub && <div className="mhs">{sub}</div>}
          </div>
          <button className="mhx" onClick={onClose}><AIcon n="x" size={16} /></button>
        </div>
        <div className="sa-modal-body">
          <div className="sa-confirm-warn">
            <p>{warn}</p>
          </div>
          <label className="sa-confirm-check">
            <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} />
            <span>Je comprends que cette action est <strong>irréversible</strong> et que je suis responsable de ses conséquences.</span>
          </label>
          <div className="sa-confirm-name">
            <span className="lab">Tapez <strong>« {confirmName} »</strong> pour confirmer</span>
            <input
              value={typed} onChange={e => setTyped(e.target.value)}
              className={typed === confirmName ? 'valid' : ''}
              placeholder={confirmName} autoFocus
            />
          </div>
        </div>
        <div className="sa-modal-foot">
          <button className="sa-btn sa-btn-ghost" onClick={onClose}>Annuler</button>
          <button className="sa-btn sa-btn-danger" disabled={!valid} onClick={onConfirm}>
            <AIcon n="check" size={16} />{confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────────

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

// ── Promote modal (search + promote) ─────────────────────────────────────────

function PromoteModal({ membres, onClose, onPromote }: {
  membres: Profile[]; onClose: () => void;
  onPromote: (p: Profile, newRole: string) => void;
}) {
  const [q, setQ] = useState('');
  const [role, setRole] = useState('responsable');
  const [sel, setSel] = useState<Profile | null>(null);
  const filtered = membres.filter(m =>
    m.nom_complet.toLowerCase().includes(q.toLowerCase()) ||
    m.email.toLowerCase().includes(q.toLowerCase())
  ).slice(0, 8);

  return (
    <div className="sa-scrim" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sa-modal" style={{ maxWidth: 520 }}>
        <div className="sa-modal-head">
          <div className="mhi" style={{ background: 'rgba(226,169,63,.15)', color: '#7A5218' }}><AIcon n="shield" size={17} /></div>
          <div>
            <div className="mht">Promouvoir un compte</div>
            <div className="mhs">Sélectionnez un membre à élever</div>
          </div>
          <button className="mhx" onClick={onClose}><AIcon n="x" size={16} /></button>
        </div>
        <div className="sa-modal-body">
          <div className="sa-form">
            <div className="sa-fld">
              <span className="lab">Rechercher un membre</span>
              <input className="sa-in" value={q} onChange={e => setQ(e.target.value)} placeholder="Nom ou email…" autoFocus />
            </div>
            {q.length > 0 && filtered.length > 0 && (
              <div style={{ border: '1.5px solid var(--line)', borderRadius: 12, overflow: 'hidden', maxHeight: 220, overflowY: 'auto' }}>
                {filtered.map(m => (
                  <div key={m.id}
                    onClick={() => { setSel(m); setQ(m.nom_complet); }}
                    style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, background: sel?.id === m.id ? 'var(--sa-red-t)' : 'var(--surface)', borderBottom: '1px solid var(--line)', transition: 'background .12s' }}>
                    <span style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--bg-soft)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                      {m.nom_complet ? m.nom_complet[0].toUpperCase() : '?'}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{m.nom_complet}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{m.email}</div>
                    </div>
                    <span className={`sa-role ${m.role}`} style={{ fontSize: 10 }}>{m.role}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="sa-fld">
              <span className="lab">Nouveau rôle</span>
              <select className="sa-sel" value={role} onChange={e => setRole(e.target.value)}>
                <option value="responsable">Responsable (Back-office)</option>
                <option value="super_admin">Super Admin (Accès total)</option>
              </select>
            </div>
            {role === 'super_admin' && (
              <div className="sa-confirm-warn">
                <p><strong>Attention :</strong> Le rôle Super Admin donne un accès complet à la plateforme, y compris la gestion des comptes et les paramètres système. À utiliser avec la plus grande précaution.</p>
              </div>
            )}
          </div>
        </div>
        <div className="sa-modal-foot">
          <button className="sa-btn sa-btn-ghost" onClick={onClose}>Annuler</button>
          <button className="sa-btn sa-btn-primary" disabled={!sel} onClick={() => sel && onPromote(sel, role)}>
            <AIcon n="check" size={16} />Confirmer la promotion
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<string, string> = { super_admin: 'Super Admin', responsable: 'Responsable', membre: 'Membre' };

export default function PageResponsables() {
  const [all, setAll] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPromote, setShowPromote] = useState(false);
  const [revoke, setRevoke] = useState<Profile | null>(null);
  const [toasts, push] = useToasts();

  useEffect(() => {
    getAllProfiles().then(p => { setAll(p); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const privileged = all.filter(p => p.role === 'responsable' || p.role === 'super_admin');
  const membres = all.filter(p => p.role === 'membre');

  async function promote(p: Profile, newRole: string) {
    try {
      await updateProfileRole(p.id, newRole);
      await logAction('promote', p.nom_complet, `${p.role} → ${newRole}`);
      setAll(all.map(x => x.id === p.id ? { ...x, role: newRole } : x));
      push(`${p.nom_complet} promu${newRole === 'super_admin' ? ' Super Admin' : ' Responsable'}`);
    } catch { push('Erreur lors de la promotion'); }
    setShowPromote(false);
  }

  async function doRevoke() {
    if (!revoke) return;
    try {
      await updateProfileRole(revoke.id, 'membre');
      await logAction('revoke', revoke.nom_complet, `${revoke.role} → membre`);
      setAll(all.map(x => x.id === revoke.id ? { ...x, role: 'membre' } : x));
      push(`Droits révoqués pour ${revoke.nom_complet}`);
    } catch { push('Erreur'); }
    setRevoke(null);
  }

  return (
    <div className="sa-page wide sa-pagefade">
      <div className="sa-pagehead">
        <div className="phi"><AIcon n="shield" size={22} /></div>
        <div className="phd">
          <div className="phey"><span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--sa-red)' }} />Comptes privilégiés</div>
          <h1>Responsables</h1>
          <p className="sub">Gérez les comptes avec accès back-office ou super admin. Toute modification est journalisée.</p>
        </div>
        <div className="acts">
          <button className="sa-btn sa-btn-primary" onClick={() => setShowPromote(true)}>
            <AIcon n="plus" size={16} />Promouvoir un compte
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="sa-danger" style={{ marginBottom: 24 }}>
        <div className="sa-danger-head">
          <span className="dico"><AIcon n="lock" size={14} /></span>
          <span className="dt">Zone de sécurité</span>
        </div>
        <p className="ds">Les comptes listés ci-dessous ont un accès élevé à la plateforme. La révocation d'un compte responsable le rétrograde immédiatement au rôle membre et révoque son accès au back-office.</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3].map(i => <div key={i} className="sa-sk" style={{ height: 60, borderRadius: 12 }} />)}
        </div>
      ) : privileged.length === 0 ? (
        <div className="sa-empty"><div className="et">Aucun compte privilégié</div></div>
      ) : (
        <div className="sa-panel">
          <table className="sa-tbl">
            <thead>
              <tr><th></th><th>Membre</th><th>Email</th><th>Rôle actuel</th><th>Inscrit le</th><th></th></tr>
            </thead>
            <tbody>
              {privileged.map(p => (
                <tr key={p.id}>
                  <td style={{ width: 44 }}>
                    <span className="sa-rowico" style={{ background: p.role === 'super_admin' ? 'var(--sa-red-t)' : 'rgba(226,169,63,.15)', color: p.role === 'super_admin' ? 'var(--sa-red-i)' : '#7A5218' }}>
                      <AIcon n={p.role === 'super_admin' ? 'lock' : 'shield'} size={15} />
                    </span>
                  </td>
                  <td>
                    <div className="sa-tprime">{p.nom_complet || '—'}</div>
                  </td>
                  <td><span style={{ fontSize: 12.5, color: 'var(--ink-3)', fontWeight: 600 }}>{p.email}</span></td>
                  <td style={{ width: 140 }}>
                    <span className={`sa-role ${p.role}`}>{ROLE_LABEL[p.role] ?? p.role}</span>
                  </td>
                  <td style={{ width: 140 }}>
                    <span style={{ fontSize: 12.5, color: 'var(--ink-3)', fontWeight: 600 }}>
                      {p.created_at ? new Date(p.created_at).toLocaleDateString('fr-FR') : '—'}
                    </span>
                  </td>
                  <td style={{ width: 120 }}>
                    <div className="sa-tact">
                      <button className="sa-btn sa-btn-ghost sa-btn-sm" style={{ color: 'var(--sa-red)', borderColor: 'rgba(203,82,73,.3)' }} onClick={() => setRevoke(p)}>
                        <AIcon n="x" size={14} />Révoquer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showPromote && (
        <PromoteModal membres={membres} onClose={() => setShowPromote(false)} onPromote={promote} />
      )}

      {revoke && (
        <ConfirmModal
          title="Révoquer les droits"
          sub={`${revoke.nom_complet} · ${ROLE_LABEL[revoke.role]}`}
          warn={`${revoke.nom_complet} perdra son accès au back-office et sera rétrogradé au rôle Membre. Cette action prend effet immédiatement.`}
          confirmName={revoke.nom_complet}
          confirmLabel="Révoquer les droits"
          onClose={() => setRevoke(null)}
          onConfirm={doRevoke}
        />
      )}

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
