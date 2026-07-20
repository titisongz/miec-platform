'use client';
import React, { useEffect, useMemo, useState } from 'react';
import AIcon from '@/components/admin/icon';
import { PageHead, Panel, Modal, Field, Input, Textarea, Select, MediaPicker, Badge, Empty, Spinner, StatBand, Toolbar, SearchInput, aStyle, useToasts, ToastHost } from '@/components/admin/ui';
import { getLivres } from '@/lib/queries';
import { createLivre, updateLivre, deleteLivre } from '@/lib/admin-queries';
import { uploadPhotos } from '@/lib/storage';
import type { Livre } from '@/lib/types';

type FormData = { id?: string; titre: string; auteur: string; annee: string; pages: string; cat: string; desc: string; extrait: string; lien: string; couverture: string[]; files: File[] };

function LivreModal({ edit, onClose, onSave }: { edit?: Livre; onClose: () => void; onSave: (f: FormData) => void }) {
  const [f, setF] = useState<FormData>({
    id: edit?.id, titre: edit?.titre ?? '', auteur: edit?.auteur ?? '',
    annee: edit?.annee ? String(edit.annee) : '', pages: edit?.pages ? String(edit.pages) : '',
    cat: edit?.cat ?? 'Théologie', desc: edit?.desc ?? '', extrait: edit?.extrait ?? '',
    lien: edit?.lien_acces ?? '',
    couverture: edit?.couverture ? [edit.couverture] : [], files: [],
  });
  const [busy, setBusy] = useState(false);
  const ok = f.titre && f.auteur;
  function submit() { if (!ok) return; setBusy(true); onSave(f); }
  return (
    <Modal accent="res" icon="books" wide title={edit ? 'Modifier le livre' : 'Ajouter un livre'} onClose={onClose}
      footer={<><button className="a-btn a-btn-ghost" onClick={onClose}>Annuler</button><button className="a-btn a-btn-primary" disabled={!ok || busy} onClick={submit}>{busy ? <><Spinner />…</> : <><AIcon n="check" size={17} />{edit ? 'Enregistrer' : 'Ajouter'}</>}</button></>}>
      <div className="a-form">
        <Field label="Titre du livre"><Input value={f.titre} onChange={e => setF({ ...f, titre: e.target.value })} placeholder="Enracinés en Christ" /></Field>
        <Field label="Auteur" icon="user"><Input value={f.auteur} onChange={e => setF({ ...f, auteur: e.target.value })} placeholder="Pasteur Daniel Mbarga" /></Field>
        <Field label="Couverture" opt="optionnelle">
          <MediaPicker max={1} urls={f.couverture} files={f.files} onUrls={u => setF({ ...f, couverture: u })} onFiles={x => setF({ ...f, files: x })} />
        </Field>
        <div className="a-frow three">
          <Field label="Catégorie">
            <Select value={f.cat} onChange={e => setF({ ...f, cat: e.target.value })}>
              {['Théologie', 'Vie chrétienne', 'Prière', 'Mission', 'Famille', 'Croissance', 'Jeunesse'].map(c => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Année" icon="calendar"><Input value={f.annee} onChange={e => setF({ ...f, annee: e.target.value })} placeholder="2024" /></Field>
          <Field label="Pages"><Input value={f.pages} onChange={e => setF({ ...f, pages: e.target.value })} placeholder="240" /></Field>
        </div>
        <Field label="Description" opt="optionnelle">
          <Textarea value={f.desc} onChange={e => setF({ ...f, desc: e.target.value })} rows={3} placeholder="Présentation du livre…" />
        </Field>
        <Field label="Extrait" opt="optionnel">
          <Textarea value={f.extrait} onChange={e => setF({ ...f, extrait: e.target.value })} rows={4} placeholder="Premier paragraphe ou citation…" />
        </Field>
        <Field label="Lien boutique digitale" icon="link" opt="optionnel" hint="Amazon, Selar, Gumroad, etc.">
          <Input value={f.lien} onChange={e => setF({ ...f, lien: e.target.value })} placeholder="https://..." />
        </Field>
      </div>
    </Modal>
  );
}

export default function PageLibrairie() {
  const [items, setItems] = useState<Livre[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ edit?: Livre } | null>(null);
  const [del, setDel] = useState<Livre | null>(null);
  const [q, setQ] = useState('');
  const [toasts, pushToast] = useToasts();

  useEffect(() => { getLivres().then(l => { setItems(l); setLoading(false); }); }, []);

  // « Lien boutique » = lien_acces renseigné (bouton « Lire / Accéder » actif
  // côté public ; sans lui la fiche affiche « Non disponible »).
  const avecLien = items.filter(l => !!l.lien_acces).length;

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter(l =>
      l.titre.toLowerCase().includes(term) || l.auteur.toLowerCase().includes(term) || l.cat.toLowerCase().includes(term)
    );
  }, [items, q]);

  async function save(f: FormData) {
    const annee = f.annee ? Number(f.annee) : 0;
    const pages = f.pages ? Number(f.pages) : 0;
    try {
      const uploaded = f.files.length ? await uploadPhotos(f.files, 'livres') : [];
      const couverture = [...f.couverture, ...uploaded][0];
      const data = { titre: f.titre, auteur: f.auteur, annee, pages, cat: f.cat, desc: f.desc, extrait: f.extrait, couverture, lien: f.lien };
      if (f.id) {
        await updateLivre(f.id, data);
        setItems(items.map(it => it.id === f.id ? { ...it, titre: f.titre, auteur: f.auteur, annee, pages, cat: f.cat, desc: f.desc, extrait: f.extrait, couverture, lien_acces: f.lien || undefined } : it));
        pushToast('Livre mis à jour', 'res');
      } else {
        await createLivre(data);
        const n: Livre = { id: 'tmp-' + Date.now(), titre: f.titre, auteur: f.auteur, annee, pages, cat: f.cat, desc: f.desc, extrait: f.extrait, couverture, lien_acces: f.lien || undefined };
        setItems([n, ...items]);
        pushToast('Livre ajouté', 'res');
      }
    } catch { pushToast('Erreur', 'tem'); }
    setModal(null);
  }

  async function remove() {
    if (!del) return;
    try { await deleteLivre(del.id); setItems(items.filter(it => it.id !== del.id)); pushToast('Livre supprimé', 'res'); }
    catch { pushToast('Erreur', 'tem'); }
    setDel(null);
  }

  return (
    <div className="a-page wide a-pagefade" style={aStyle('res')}>
      <PageHead accent="res" icon="books"
        eyebrow={<><span style={{ width: 8, height: 8, borderRadius: 9, background: 'var(--c)' }} />Module Librairie</>}
        title="Librairie" sub="Bibliothèque de livres recommandés par la communauté.">
        <button className="a-btn a-btn-primary" onClick={() => setModal({})}><AIcon n="plus" size={17} />Ajouter un livre</button>
      </PageHead>

      <StatBand accent="res" stats={[
        { l: 'Total livres', v: items.length, i: 'books' },
        { l: 'Avec lien boutique', v: avecLien, i: 'link' },
      ]} />

      <Toolbar>
        <SearchInput value={q} onChange={setQ} placeholder="Rechercher un titre, un auteur…" />
      </Toolbar>

      {loading ? <div className="a-sk" style={{ height: 300, borderRadius: 16 }} /> : items.length === 0 ? (
        <Empty icon="books" title="Aucun livre" />
      ) : shown.length === 0 ? (
        <Empty icon="search" title="Aucun résultat" sub="Aucun livre ne correspond à cette recherche." />
      ) : (
        <Panel accent="res" pad={false}>
          <table className="a-tbl">
            <thead><tr><th></th><th>Titre</th><th>Auteur</th><th>Catégorie</th><th>Pages</th><th></th></tr></thead>
            <tbody>
              {shown.map(l => (
                <tr key={l.id}>
                  <td style={{ width: 44 }}><span className="a-rowico"><AIcon n="books" size={16} /></span></td>
                  <td>
                    <div className="a-tprime">{l.titre}</div>
                    {l.desc && <div className="a-tsub" style={{ maxWidth: 340, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.desc}</div>}
                  </td>
                  <td><span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' }}>{l.auteur}</span></td>
                  <td style={{ width: 130 }}><Badge tone="neutral">{l.cat}</Badge></td>
                  <td style={{ width: 80 }}><span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-3)' }}>{l.pages || '—'} p.</span></td>
                  <td style={{ width: 96 }}>
                    <div className="a-tact">
                      <button className="a-iact" onClick={() => setModal({ edit: l })}><AIcon n="pen" size={16} /></button>
                      <button className="a-iact del" onClick={() => setDel(l)}><AIcon n="trash" size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

      {modal && <LivreModal edit={modal.edit} onClose={() => setModal(null)} onSave={save} />}
      {del && (
        <Modal accent="res" icon="trash" title="Supprimer le livre ?" onClose={() => setDel(null)}
          footer={<><button className="a-btn a-btn-ghost" onClick={() => setDel(null)}>Annuler</button><button className="a-btn a-btn-danger" onClick={remove}><AIcon n="trash" size={16} />Supprimer</button></>}>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, color: 'var(--ink-2)' }}>
            <b style={{ color: 'var(--ink)' }}>« {del.titre} »</b> sera retiré définitivement.
          </p>
        </Modal>
      )}

      <ToastHost toasts={toasts} />
    </div>
  );
}
