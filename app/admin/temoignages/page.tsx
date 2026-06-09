'use client';
import React, { useEffect, useState } from 'react';
import AIcon from '@/components/admin/icon';
import { PageHead, Modal, Field, Textarea, Badge, Seg, Empty, Spinner, aStyle, useToasts, ToastHost } from '@/components/admin/ui';
import { getTemoignages } from '@/lib/queries';
import { getPendingTemoignages, approveTemoignage, unpublishTemoignage, deleteTemoignage } from '@/lib/admin-queries';
import type { Temoignage } from '@/lib/types';

type PendingTem = { id: string; titre: string; auteur: string; date: string; cat: string; full: string };

export default function PageTemoignages() {
  const [tab, setTab] = useState('attente');
  const [pending, setPending] = useState<PendingTem[]>([]);
  const [published, setPublished] = useState<Temoignage[]>([]);
  const [loading, setLoading] = useState(true);
  const [out, setOut] = useState<Record<string, boolean>>({});
  const [refuse, setRefuse] = useState<PendingTem | null>(null);
  const [motif, setMotif] = useState('');
  const [toasts, pushToast] = useToasts();

  useEffect(() => {
    Promise.all([getPendingTemoignages(), getTemoignages()]).then(([p, pub]) => {
      setPending(p); setPublished(pub); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function animateRemove(id: string, after: () => void) {
    setOut(o => ({ ...o, [id]: true }));
    setTimeout(after, 300);
  }

  async function approve(t: PendingTem) {
    try {
      await approveTemoignage(t.id);
      animateRemove(t.id, () => {
        setPending(p => p.filter(x => x.id !== t.id));
        const pub: Temoignage = { id: t.id, titre: t.titre, auteur: t.auteur, date: 'à l\'instant', cat: t.cat, statut: 'publie', excerpt: t.full.slice(0, 160), full: t.full };
        setPublished(pl => [pub, ...pl]);
        pushToast('Témoignage validé et publié', 'ens');
      });
    } catch { pushToast('Erreur', 'tem'); }
  }

  async function doRefuse() {
    if (!refuse) return;
    try {
      await deleteTemoignage(refuse.id);
      animateRemove(refuse.id, () => { setPending(p => p.filter(x => x.id !== refuse.id)); pushToast('Témoignage refusé', 'tem'); });
    } catch { pushToast('Erreur', 'tem'); }
    setRefuse(null); setMotif('');
  }

  async function unpublish(t: Temoignage) {
    try {
      await unpublishTemoignage(t.id);
      setPublished(pl => pl.filter(x => x.id !== t.id));
      pushToast('Témoignage dépublié', 'tem');
    } catch { pushToast('Erreur', 'tem'); }
  }

  return (
    <div className="a-page a-pagefade" style={aStyle('tem')}>
      <PageHead accent="tem" icon="quote"
        eyebrow={<><span style={{ width: 8, height: 8, borderRadius: 9, background: 'var(--c)' }} />Module Témoignages</>}
        title="Témoignages" sub="Validez les témoignages soumis par les membres avant publication." />

      <div style={{ marginBottom: 20 }}>
        <Seg active={tab} onPick={setTab} tabs={[
          { v: 'attente', l: 'File de validation', icon: 'clock', n: pending.length },
          { v: 'publie',  l: 'Publiés',           icon: 'check', n: published.length },
        ]} />
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="a-sk" style={{ height: 180, borderRadius: 16 }} />)}
        </div>
      ) : tab === 'attente' ? (
        pending.length ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
            {pending.map(t => {
              const initials = t.auteur === 'Anonyme' ? '?' : t.auteur.split(' ').map(w => w[0]).slice(0, 2).join('');
              return (
                <div key={t.id} className={'a-qcard' + (out[t.id] ? ' out' : '')} style={aStyle('tem')}>
                  <div className="qb">
                    <div className="qmeta">
                      <span className="a-qavatar">{initials}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13.5 }}>{t.auteur}</div>
                        <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-3)' }}>{t.date}</div>
                      </div>
                      <Badge tone="red" dot>{t.cat}</Badge>
                    </div>
                    <div className="qtitle">{t.titre}</div>
                    <div className="qexc">{t.full}</div>
                  </div>
                  <div className="qfoot">
                    <button className="a-btn a-btn-primary a-btn-sm" style={{ ...aStyle('ens'), flex: 1 }} onClick={() => approve(t)}>
                      <AIcon n="check" size={16} />Valider et publier
                    </button>
                    <button className="a-btn a-btn-danger a-btn-sm" onClick={() => setRefuse(t)}>
                      <AIcon n="x" size={16} />Refuser
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : <Empty icon="check" title="File vide" sub="Tous les témoignages soumis ont été traités. Beau travail !" />
      ) : published.length ? (
        <div className="a-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="a-tbl">
            <thead><tr><th></th><th>Témoignage</th><th>Auteur</th><th>Catégorie</th><th>Date</th><th></th></tr></thead>
            <tbody>
              {published.map(t => (
                <tr key={t.id ?? t.titre}>
                  <td style={{ width: 44 }}><span className="a-rowico"><AIcon n="quote" size={16} /></span></td>
                  <td><div className="a-tprime" style={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.titre}</div></td>
                  <td><span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' }}>{t.auteur}</span></td>
                  <td style={{ width: 120 }}><Badge tone="red" dot>{t.cat}</Badge></td>
                  <td style={{ width: 120 }}><span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-3)' }}>{t.date}</span></td>
                  <td style={{ width: 130 }}>
                    <div className="a-tact">
                      <button className="a-btn a-btn-ghost a-btn-sm" onClick={() => unpublish(t)}>
                        <AIcon n="eyeoff" size={15} />Dépublier
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Empty icon="quote" title="Aucun témoignage publié" />}

      {refuse && (
        <Modal accent="tem" icon="x" title="Refuser le témoignage" onClose={() => { setRefuse(null); setMotif(''); }}
          footer={<><button className="a-btn a-btn-ghost" onClick={() => { setRefuse(null); setMotif(''); }}>Annuler</button><button className="a-btn a-btn-danger" onClick={doRefuse}><AIcon n="send" size={15} />Confirmer le refus</button></>}>
          <p style={{ margin: '0 0 16px', fontSize: 14, lineHeight: 1.55, color: 'var(--ink-2)' }}>
            Le témoignage <b style={{ color: 'var(--ink)' }}>« {refuse.titre} »</b> de {refuse.auteur} ne sera pas publié.
          </p>
          <Field label="Motif transmis au membre" opt="optionnel" icon="mail" hint="Expliqué avec bienveillance, le membre pourra retravailler son témoignage.">
            <Textarea value={motif} onChange={e => setMotif(e.target.value)} rows={3} placeholder="Ex. Merci pour ce partage ! Pourriez-vous préciser…" />
          </Field>
        </Modal>
      )}

      <ToastHost toasts={toasts} />
    </div>
  );
}
