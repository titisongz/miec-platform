'use client';
import React, { useEffect, useState } from 'react';
import AIcon from '@/components/admin/icon';
import { PageHead, Modal, Badge, Reveal, Empty, aStyle, useToasts, ToastHost } from '@/components/admin/ui';
import { getPrieres } from '@/lib/queries';
import { deletePriere } from '@/lib/admin-queries';
import type { Priere } from '@/lib/types';

export default function PagePriere() {
  const [items, setItems] = useState<Priere[]>([]);
  const [loading, setLoading] = useState(true);
  const [del, setDel] = useState<Priere | null>(null);
  const [toasts, pushToast] = useToasts();

  useEffect(() => {
    getPrieres().then(p => { setItems(p); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  async function remove() {
    if (!del) return;
    try {
      await deletePriere(del.id);
      setItems(items.filter(it => it.id !== del.id));
      pushToast('Sujet retiré', 'pri');
    } catch { pushToast('Erreur', 'tem'); }
    setDel(null);
  }

  return (
    <div className="a-page a-pagefade" style={aStyle('pri')}>
      <PageHead accent="pri" icon="flame"
        eyebrow={<><span style={{ width: 8, height: 8, borderRadius: 9, background: 'var(--c)' }} />Module Prière</>}
        title="Mur de prière" sub="Sujets de prière soumis par la communauté. La modération permet de retirer un contenu inapproprié." />

      <div style={{ display: 'flex', gap: 9, marginBottom: 18 }}>
        <Badge tone="blue" dot>{items.length} sujets actifs</Badge>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="a-sk" style={{ height: 160, borderRadius: 16 }} />)}
        </div>
      ) : items.length === 0 ? (
        <Empty icon="flame" title="Aucun sujet de prière" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
          {items.map((p, i) => {
            const initials = p.auteur === 'Anonyme' ? '?' : p.auteur.split(' ').map(w => w[0]).slice(0, 2).join('');
            return (
              <Reveal key={p.id} delay={i * 40} className="a-card" style={{ ...aStyle('pri'), padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11 }}>
                  <span style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--c-t)', color: 'var(--c-i)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12.5, flex: '0 0 auto' }}>
                    {initials}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{p.auteur}</div>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-3)' }}>{p.date}</div>
                  </div>
                  <Badge tone="blue" dot>{p.cat}</Badge>
                </div>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--ink)' }}>{p.full || p.sujet}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, paddingTop: 13, borderTop: '1px solid var(--line)' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', display: 'inline-flex', alignItems: 'center', gap: 6, flex: 1 }}>
                    <AIcon n="flame" size={14} />Porté en intercession
                  </span>
                  <button className="a-btn a-btn-danger a-btn-sm" onClick={() => setDel(p)}>
                    <AIcon n="trash" size={15} />Retirer
                  </button>
                </div>
              </Reveal>
            );
          })}
        </div>
      )}

      {del && (
        <Modal accent="pri" icon="trash" title="Retirer ce sujet de prière ?" onClose={() => setDel(null)}
          footer={<><button className="a-btn a-btn-ghost" onClick={() => setDel(null)}>Annuler</button><button className="a-btn a-btn-danger" onClick={remove}><AIcon n="trash" size={16} />Retirer</button></>}>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, color: 'var(--ink-2)' }}>
            Le sujet soumis par <b style={{ color: 'var(--ink)' }}>{del.auteur}</b> sera retiré du mur de prière.
            À n&apos;utiliser qu&apos;en cas de contenu inapproprié.
          </p>
        </Modal>
      )}

      <ToastHost toasts={toasts} />
    </div>
  );
}
