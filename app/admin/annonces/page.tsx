'use client';
import React, { useEffect, useState } from 'react';
import AIcon from '@/components/admin/icon';
import { PageHead, Panel, Modal, Field, Input, Textarea, Select, Badge, Empty, Spinner, aStyle, useToasts, ToastHost } from '@/components/admin/ui';
import { getAnnoncesAdmin, createAnnonce, updateAnnonce, deleteAnnonce } from '@/lib/admin-queries';
import type { Annonce } from '@/lib/types';

type FormData = { id?: string; titre: string; cat: string; date: string; full: string };

function AnnModal({ edit, onClose, onSave }: {
  edit?: Annonce; onClose: () => void; onSave: (f: FormData) => void;
}) {
  const [f, setF] = useState<FormData>({ id: edit?.id, titre: edit?.titre ?? '', cat: edit?.cat ?? 'Culte', date: edit?.date ?? '', full: edit?.full ?? '' });
  const [busy, setBusy] = useState(false);
  const ok = f.titre && f.full;

  function submit() { if (!ok) return; setBusy(true); onSave(f); }

  return (
    <Modal accent="ann" icon="mega" wide title={edit ? "Modifier l'annonce" : 'Nouvelle annonce'} onClose={onClose}
      footer={<><button className="a-btn a-btn-ghost" onClick={onClose}>Annuler</button><button className="a-btn a-btn-primary" disabled={!ok || busy} onClick={submit}>{busy ? <><Spinner />…</> : <><AIcon n="check" size={17} />{edit ? 'Enregistrer' : 'Publier'}</>}</button></>}>
      <div className="a-form">
        <Field label="Titre de l'annonce">
          <Input value={f.titre} onChange={e => setF({ ...f, titre: e.target.value })} placeholder="Culte de reconnaissance" />
        </Field>
        <div className="a-frow">
          <Field label="Catégorie">
            <Select value={f.cat} onChange={e => setF({ ...f, cat: e.target.value })}>
              {['Culte', 'Événement', 'Communauté', 'Jeunesse', 'Mission', 'Pratique'].map(c => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Date" icon="calendar">
            <Input type="date" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} />
          </Field>
        </div>
        <Field label="Contenu">
          <Textarea value={f.full} onChange={e => setF({ ...f, full: e.target.value })} rows={5} placeholder="Détails de l'annonce…" />
        </Field>
      </div>
    </Modal>
  );
}

export default function PageAnnonces() {
  const [items, setItems] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ edit?: Annonce } | null>(null);
  const [del, setDel] = useState<Annonce | null>(null);
  const [toasts, pushToast] = useToasts();

  useEffect(() => { getAnnoncesAdmin().then(a => { setItems(a); setLoading(false); }); }, []);

  async function save(f: FormData) {
    try {
      if (f.id) {
        await updateAnnonce(f.id, { titre: f.titre, cat: f.cat, date: f.date, full: f.full });
        setItems(items.map(it => it.id === f.id ? { ...it, titre: f.titre, cat: f.cat, date: f.date, full: f.full } : it));
        pushToast('Annonce mise à jour', 'ann');
      } else {
        await createAnnonce({ titre: f.titre, cat: f.cat, date: f.date, full: f.full });
        const newItem: Annonce = { id: 'tmp-' + Date.now(), titre: f.titre, cat: f.cat, date: f.date, urgent: false, excerpt: f.full.slice(0, 160), full: f.full };
        setItems([newItem, ...items]);
        pushToast('Annonce publiée', 'ann');
      }
    } catch { pushToast('Erreur lors de la sauvegarde', 'tem'); }
    setModal(null);
  }

  async function remove() {
    if (!del) return;
    try { await deleteAnnonce(del.id); setItems(items.filter(it => it.id !== del.id)); pushToast('Annonce supprimée', 'ann'); }
    catch { pushToast('Erreur', 'tem'); }
    setDel(null);
  }

  return (
    <div className="a-page a-pagefade" style={aStyle('ann')}>
      <PageHead accent="ann" icon="mega"
        eyebrow={<><span style={{ width: 8, height: 8, borderRadius: 9, background: 'var(--c)' }} />Module Annonces</>}
        title="Annonces" sub="Communications officielles de la communauté : cultes, événements, informations pratiques.">
        <button className="a-btn a-btn-primary" onClick={() => setModal({})}><AIcon n="plus" size={17} />Nouvelle annonce</button>
      </PageHead>

      {loading ? (
        <div className="a-sk" style={{ height: 300, borderRadius: 16 }} />
      ) : items.length === 0 ? (
        <Empty icon="mega" title="Aucune annonce" sub="Publiez la première annonce." />
      ) : (
        <Panel accent="ann" pad={false}>
          <table className="a-tbl">
            <thead><tr><th></th><th>Annonce</th><th>Catégorie</th><th>Date</th><th>Statut</th><th></th></tr></thead>
            <tbody>
              {items.map(a => (
                <tr key={a.id}>
                  <td style={{ width: 44 }}><span className="a-rowico"><AIcon n="mega" size={16} /></span></td>
                  <td>
                    <div className="a-tprime">{a.titre}</div>
                    <div className="a-tsub" style={{ maxWidth: 340, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.excerpt}</div>
                  </td>
                  <td style={{ width: 130 }}><Badge tone="neutral">{a.cat}</Badge></td>
                  <td style={{ width: 120 }}><span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-3)' }}>{a.date}</span></td>
                  <td style={{ width: 110 }}><Badge tone="green" dot>Publié</Badge></td>
                  <td style={{ width: 96 }}>
                    <div className="a-tact">
                      <button className="a-iact" onClick={() => setModal({ edit: a })}><AIcon n="pen" size={16} /></button>
                      <button className="a-iact del" onClick={() => setDel(a)}><AIcon n="trash" size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

      {modal && <AnnModal edit={modal.edit} onClose={() => setModal(null)} onSave={save} />}
      {del && (
        <Modal accent="ann" icon="trash" title="Supprimer l'annonce ?" onClose={() => setDel(null)}
          footer={<><button className="a-btn a-btn-ghost" onClick={() => setDel(null)}>Annuler</button><button className="a-btn a-btn-danger" onClick={remove}><AIcon n="trash" size={16} />Supprimer</button></>}>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, color: 'var(--ink-2)' }}>
            L&apos;annonce <b style={{ color: 'var(--ink)' }}>« {del.titre} »</b> sera retirée définitivement.
          </p>
        </Modal>
      )}

      <ToastHost toasts={toasts} />
    </div>
  );
}
