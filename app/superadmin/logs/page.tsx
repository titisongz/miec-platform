'use client';
import React, { useEffect, useState, useMemo } from 'react';
import AIcon from '@/components/admin/icon';
import { getActionLogs, type ActionLog } from '@/lib/admin-queries';

const ACTION_TONE: Record<string, string> = {
  promote: 'promote', revoke: 'delete', deactivate: 'delete',
  create: 'create', update: 'update', delete: 'delete',
  ipb_grant: 'promote', ipb_revoke: 'delete',
  settings_update: 'update', integration_update: 'update',
  login: 'login', system: 'system',
};
const ACTION_LABEL: Record<string, string> = {
  promote: 'Promotion', revoke: 'Révocation', deactivate: 'Désactivation',
  create: 'Création', update: 'Modification', delete: 'Suppression',
  ipb_grant: 'IPB accordé', ipb_revoke: 'IPB retiré',
  settings_update: 'Paramètres', integration_update: 'Intégration',
  login: 'Connexion', system: 'Système',
};

function relDateTime(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const ACTION_TYPES = ['', 'promote', 'revoke', 'deactivate', 'update', 'delete', 'ipb_grant', 'ipb_revoke', 'settings_update', 'login'];

export default function PageLogs() {
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    getActionLogs(100).then(l => { setLogs(l); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => logs.filter(l => {
    if (actionFilter && l.action !== actionFilter) return false;
    if (q) {
      const lq = q.toLowerCase();
      return l.admin_nom.toLowerCase().includes(lq) || l.cible.toLowerCase().includes(lq) || l.action.toLowerCase().includes(lq);
    }
    return true;
  }), [logs, actionFilter, q]);

  return (
    <div className="sa-page wide sa-pagefade">
      <div className="sa-pagehead">
        <div className="phi"><AIcon n="history" size={22} /></div>
        <div className="phd">
          <div className="phey"><span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--sa-red)' }} />Traçabilité</div>
          <h1>Journal de sécurité</h1>
          <p className="sub">Toutes les actions sensibles réalisées par les administrateurs. Non modifiable.</p>
        </div>
        <div className="acts">
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,.5)' }} />
            Journal actif
          </span>
        </div>
      </div>

      {/* Security notice */}
      <div className="sa-danger" style={{ marginBottom: 24 }}>
        <div className="sa-danger-head">
          <span className="dico"><AIcon n="lock" size={14} /></span>
          <span className="dt">Journal inaltérable</span>
        </div>
        <p className="ds">Ce journal est en lecture seule. Chaque action administrative (promotion, révocation, modification de paramètres, connexion) est enregistrée automatiquement avec l'identité de l'administrateur et l'horodatage.</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
          <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)', pointerEvents: 'none' }}>
            <AIcon n="search" size={14} />
          </span>
          <input className="sa-in" style={{ paddingLeft: 34 }} value={q} onChange={e => setQ(e.target.value)} placeholder="Admin, cible, action…" />
        </div>
        <select className="sa-sel" style={{ flex: '0 0 180px' }} value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
          <option value="">Toutes les actions</option>
          {ACTION_TYPES.filter(Boolean).map(a => (
            <option key={a} value={a}>{ACTION_LABEL[a] ?? a}</option>
          ))}
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-3)' }}>{filtered.length} entrée{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3,4,5].map(i => <div key={i} className="sa-sk" style={{ height: 52, borderRadius: 10 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="sa-empty">
          <div className="ei"><AIcon n="history" size={22} /></div>
          <div className="et">Aucun log trouvé</div>
          <div className="es">Les actions sensibles seront enregistrées automatiquement.</div>
        </div>
      ) : (
        <div className="sa-panel">
          <table className="sa-tbl">
            <thead>
              <tr>
                <th>Date & heure</th>
                <th>Administrateur</th>
                <th>Action</th>
                <th>Cible</th>
                <th>Détails</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id}>
                  <td style={{ width: 180 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>
                      {relDateTime(l.created_at)}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--sa-red-t)', color: 'var(--sa-red-i)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 11, flexShrink: 0 }}>
                        {l.admin_nom ? l.admin_nom[0].toUpperCase() : 'S'}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{l.admin_nom || 'Super Admin'}</span>
                    </div>
                  </td>
                  <td style={{ width: 140 }}>
                    <span className={`sa-log-action ${ACTION_TONE[l.action] ?? 'update'}`}>
                      {ACTION_LABEL[l.action] ?? l.action}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{l.cible || '—'}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 500 }}>{l.details || '—'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
