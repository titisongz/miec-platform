'use client';
import React, { useEffect, useState } from 'react';
import AIcon from '@/components/admin/icon';
import { PageHead, Panel, Modal, Field, Input, Textarea, Select, Empty, Spinner, aStyle, useToasts, ToastHost } from '@/components/admin/ui';
import { getRessources } from '@/lib/queries';
import { createRessource, updateRessource, deleteRessource } from '@/lib/admin-queries';
import type { Ressource } from '@/lib/types';

type FormData = { id?: string; titre: string; type: string; cat: string; desc: string; taille: string };

const RES_TYPES = [{ v: 'pdf', l: 'PDF' }, { v: 'audio', l: 'Audio' }, { v: 'partition', l: 'Partition' }, { v: 'plan', l: 'Plan de lecture' }, { v: 'video', l: 'Vidéo' }];
function resIcon(t: string) { return t === 'audio' ? 'play' : t === 'plan' ? 'calendar' : t === 'video' ? 'play' : 'filetext'; }

function ResModal({ edit, onClose, onSave }: { edit?: Ressource; onClose: () => void; onSave: (f: FormData) => void }) {
  const [f, setF] = useState<FormData>({ id: edit?.id, titre: edit?.titre ?? '', type: edit?.type ?? 'pdf', cat: edit?.cat ?? 'Études', desc: '', taille: edit?.taille ?? '' });
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState(edit ? edit.titre + '.pdf' : '');
  const ok = f.titre;
  function submit() { if (!ok) return; setBusy(true); onSave(f); }
  return (
    <Modal accent="res" icon="folder" wide title={edit ? 'Modifier la ressource' : 'Nouvelle ressource'} onClose={onClose}
      footer={<><button className="a-btn a-btn-ghost" onClick={onClose}>Annuler</button><button className="a-btn a-btn-primary" disabled={!ok || busy} onClick={submit}>{busy ? <><Spinner />…</> : <><AIcon n="check" size={17} />{edit ? 'Enregistrer' : 'Publier'}</>}</button></>}>
      <div className="a-form">
        {!edit && (
          <div className="a-drop" onClick={() => setFile('document.pdf')}>
            <div className="di"><AIcon n={file ? 'filetext' : 'upload'} size={22} /></div>
            {file
              ? <div style={{ fontWeight: 700, fontSize: 14 }}>{file} <span style={{ fontWeight: 600, color: 'var(--ink-3)' }}>· prêt</span></div>
              : <><div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 3 }}>Déposez un fichier ou cliquez pour parcourir</div><div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>PDF, MP3, image — 25 Mo max</div></>}
          </div>
        )}
        <Field label="Titre"><Input value={f.titre} onChange={e => setF({ ...f, titre: e.target.value })} placeholder="Guide du nouveau converti" /></Field>
        <div className="a-frow">
          <Field label="Type">
            <Select value={f.type} onChange={e => setF({ ...f, type: e.target.value })}>{RES_TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}</Select>
          </Field>
          <Field label="Catégorie">
            <Select value={f.cat} onChange={e => setF({ ...f, cat: e.target.value })}>{['Études', 'Plans de lecture', 'Audio', 'Partitions', 'Vidéos'].map(c => <option key={c}>{c}</option>)}</Select>
          </Field>
        </div>
        <Field label="Description" opt="optionnelle">
          <Textarea value={f.desc} onChange={e => setF({ ...f, desc: e.target.value })} rows={3} placeholder="À quoi sert cette ressource…" />
        </Field>
      </div>
    </Modal>
  );
}

export default function PageRessources() {
  const [items, setItems] = useState<Ressource[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ edit?: Ressource } | null>(null);
  const [del, setDel] = useState<Ressource | null>(null);
  const [toasts, pushToast] = useToasts();

  useEffect(() => { getRessources().then(r => { setItems(r); setLoading(false); }); }, []);

  async function save(f: FormData) {
    try {
      if (f.id) {
        await updateRessource(f.id, { titre: f.titre, type: f.type, cat: f.cat, desc: f.desc });
        setItems(items.map(it => it.id === f.id ? { ...it, titre: f.titre, type: f.type, cat: f.cat } : it));
        pushToast('Ressource mise à jour', 'res');
      } else {
        await createRessource({ titre: f.titre, type: f.type, cat: f.cat, desc: f.desc, taille: f.taille });
        const n: Ressource = { id: 'tmp-' + Date.now(), titre: f.titre, type: f.type, fmt: f.type.toUpperCase(), taille: '—', cat: f.cat, date: 'à l\'instant' };
        setItems([n, ...items]);
        pushToast('Ressource ajoutée', 'res');
      }
    } catch { pushToast('Erreur', 'tem'); }
    setModal(null);
  }

  async function remove() {
    if (!del) return;
    try { await deleteRessource(del.id); setItems(items.filter(it => it.id !== del.id)); pushToast('Ressource supprimée', 'res'); }
    catch { pushToast('Erreur', 'tem'); }
    setDel(null);
  }

  return (
    <div className="a-page wide a-pagefade" style={aStyle('res')}>
      <PageHead accent="res" icon="folder"
        eyebrow={<><span style={{ width: 8, height: 8, borderRadius: 9, background: 'var(--c)' }} />Module Ressources</>}
        title="Ressources" sub="Bibliothèque de fichiers : études, plans de lecture, audios, partitions.">
        <button className="a-btn a-btn-primary" onClick={() => setModal({})}><AIcon n="upload" size={17} />Importer un fichier</button>
      </PageHead>

      {loading ? <div className="a-sk" style={{ height: 300, borderRadius: 16 }} /> : items.length === 0 ? (
        <Empty icon="folder" title="Aucune ressource" />
      ) : (
        <Panel accent="res" pad={false}>
          <table className="a-tbl">
            <thead><tr><th></th><th>Ressource</th><th>Type</th><th>Catégorie</th><th>Taille</th><th></th></tr></thead>
            <tbody>
              {items.map(r => (
                <tr key={r.id}>
                  <td style={{ width: 44 }}><span className="a-rowico"><AIcon n={resIcon(r.type)} size={16} /></span></td>
                  <td><div className="a-tprime">{r.titre}</div></td>
                  <td style={{ width: 110 }}><span className="a-codepill">{r.fmt}</span></td>
                  <td style={{ width: 150 }}><span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' }}>{r.cat}</span></td>
                  <td style={{ width: 110 }}><span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-3)' }}>{r.taille}</span></td>
                  <td style={{ width: 96 }}>
                    <div className="a-tact">
                      <button className="a-iact" onClick={() => setModal({ edit: r })}><AIcon n="pen" size={16} /></button>
                      <button className="a-iact del" onClick={() => setDel(r)}><AIcon n="trash" size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

      {modal && <ResModal edit={modal.edit} onClose={() => setModal(null)} onSave={save} />}
      {del && (
        <Modal accent="res" icon="trash" title="Supprimer la ressource ?" onClose={() => setDel(null)}
          footer={<><button className="a-btn a-btn-ghost" onClick={() => setDel(null)}>Annuler</button><button className="a-btn a-btn-danger" onClick={remove}><AIcon n="trash" size={16} />Supprimer</button></>}>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, color: 'var(--ink-2)' }}>
            <b style={{ color: 'var(--ink)' }}>« {del.titre} »</b> sera supprimée définitivement.
          </p>
        </Modal>
      )}

      <ToastHost toasts={toasts} />
    </div>
  );
}
