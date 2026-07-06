'use client';
import React, { useEffect, useState } from 'react';
import AIcon from '@/components/admin/icon';
import { PageHead, Panel, Modal, Field, Input, Textarea, Select, Badge, Reveal, Spinner, Empty, aStyle, useToasts, ToastHost } from '@/components/admin/ui';
import { getEnseignementsAdmin, getSeriesAdmin, createEnseignement, updateEnseignement, deleteEnseignement, createSerie } from '@/lib/admin-queries';
import type { Enseignement, Serie } from '@/lib/types';

type FormData = {
  id?: string; titre: string; auteur: string; date: string;
  serie: string; theme: string; yt: string; excerpt: string; type: string;
};

function TeachModal({ edit, series, onClose, onSave }: {
  edit?: Enseignement; series: Serie[];
  onClose: () => void;
  onSave: (f: FormData) => void;
}) {
  const [f, setF] = useState<FormData>({
    id: edit?.id,
    titre: edit?.titre ?? '',
    auteur: edit?.auteur ?? '',
    date: edit?.date ?? '',
    serie: edit?.serie ?? (series[0]?.titre ?? ''),
    theme: edit?.theme ?? 'Foi',
    yt: edit?.yt ?? '',
    excerpt: edit?.excerpt ?? '',
    type: edit?.type ?? 'text',
  });
  const [busy, setBusy] = useState(false);
  // Série : choix dans la liste existante, ou saisie libre d'une nouvelle série.
  // Démarre en mode libre s'il n'existe encore aucune série.
  const [newSerie, setNewSerie] = useState(series.length === 0);
  const ok = f.titre && f.auteur;

  async function submit() {
    if (!ok) return;
    setBusy(true);
    onSave(f);
  }

  return (
    <Modal accent="ens" icon="book" wide title={edit ? "Modifier l'enseignement" : 'Nouvel enseignement'}
      onClose={onClose}
      footer={
        <>
          <button className="a-btn a-btn-ghost" onClick={onClose}>Annuler</button>
          <button className="a-btn a-btn-primary" disabled={!ok || busy} onClick={submit}>
            {busy ? <><Spinner />Enregistrement…</> : <><AIcon n="check" size={17} />{edit ? 'Enregistrer' : 'Publier'}</>}
          </button>
        </>
      }>
      <div className="a-form">
        <Field label="Titre de l'enseignement">
          <Input value={f.titre} onChange={e => setF({ ...f, titre: e.target.value })} placeholder="La foi qui déplace les montagnes" />
        </Field>
        <div className="a-frow">
          <Field label="Intervenant" icon="user">
            <Input value={f.auteur} onChange={e => setF({ ...f, auteur: e.target.value })} placeholder="Pasteur Daniel Mbarga" />
          </Field>
          <Field label="Date" icon="calendar">
            <Input type="date" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} />
          </Field>
        </div>
        <div className="a-frow">
          <div>
            <Field label="Série">
              {newSerie
                ? <Input value={f.serie} onChange={e => setF({ ...f, serie: e.target.value })} placeholder="Nom de la nouvelle série" />
                : (
                  <Select value={f.serie} onChange={e => setF({ ...f, serie: e.target.value })}>
                    <option value="">— Sans série —</option>
                    {series.map(s => <option key={s.id} value={s.titre}>{s.titre}</option>)}
                  </Select>
                )}
            </Field>
            <button type="button" onClick={() => setNewSerie(v => !v)}
              style={{ marginTop: 7, fontSize: 12.5, fontWeight: 700, color: '#4C84B8', cursor: 'pointer' }}>
              {newSerie ? '← Choisir une série existante' : '+ Nouvelle série'}
            </button>
          </div>
          <Field label="Thème">
            <Input value={f.theme} onChange={e => setF({ ...f, theme: e.target.value })} placeholder="Foi, Grâce, Mission…" />
          </Field>
        </div>
        <Field label="Texte du message">
          <Textarea value={f.excerpt} onChange={e => setF({ ...f, excerpt: e.target.value })} rows={4} placeholder="Résumé ou texte intégral de l'enseignement…" />
        </Field>
        <Field label="Identifiant vidéo YouTube" opt="optionnel" icon="play" hint="Saisissez uniquement l'identifiant (11 caractères), pas l'URL complète.">
          <div className="a-in-pre">
            <span className="pfx">youtu.be/</span>
            <input value={f.yt} onChange={e => setF({ ...f, yt: e.target.value })} placeholder="wpcCm8YnD7w" />
          </div>
        </Field>
      </div>
    </Modal>
  );
}

export default function PageEnseignements() {
  const [items, setItems] = useState<Enseignement[]>([]);
  const [series, setSeries] = useState<Serie[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ edit?: Enseignement } | null>(null);
  const [del, setDel] = useState<Enseignement | null>(null);
  const [toasts, pushToast] = useToasts();

  useEffect(() => {
    Promise.all([getEnseignementsAdmin(), getSeriesAdmin()]).then(([ens, srs]) => {
      setItems(ens); setSeries(srs); setLoading(false);
    });
  }, []);

  const seriesNames = Array.from(new Set(items.map(e => e.serie)));

  async function save(f: FormData) {
    try {
      // Série : retrouve l'existante par titre, sinon en crée une nouvelle.
      const existing = series.find(s => s.titre === f.serie);
      let serieId = existing?.id;
      if (!serieId && f.serie.trim()) serieId = await createSerie(f.serie.trim());
      if (f.id) {
        await updateEnseignement(f.id, { titre: f.titre, auteur: f.auteur, date: f.date, serie_id: serieId, theme: f.theme, youtube_id: f.yt, texte: f.excerpt, type: f.yt ? 'video' : 'texte' });
        setItems(items.map(it => it.id === f.id ? { ...it, ...f, yt: f.yt || undefined } : it));
        pushToast('Enseignement mis à jour', 'ens');
      } else {
        // On insère l'objet RÉEL renvoyé par Supabase (vrai UUID) dans la liste,
        // au lieu d'un id temporaire — indispensable pour qu'une édition juste
        // après création cible la bonne ligne.
        const created = await createEnseignement({ titre: f.titre, auteur: f.auteur, date: f.date, serie_id: serieId, theme: f.theme, youtube_id: f.yt, texte: f.excerpt, type: f.yt ? 'video' : 'texte' });
        setItems([created, ...items]);
        pushToast('Enseignement publié', 'ens');
      }
    } catch (e) {
      const err = e as { message?: string; code?: string; details?: string; hint?: string };
      console.error(
        `[admin/enseignements] échec sauvegarde: ${err.message ?? String(e)}` +
          (err.code ? ` (code ${err.code})` : ''),
        { message: err.message, code: err.code, details: err.details, hint: err.hint },
      );
      pushToast(`Erreur : ${err.message ?? 'sauvegarde impossible'}`, 'tem');
    }
    setModal(null);
  }

  async function remove() {
    if (!del) return;
    try {
      await deleteEnseignement(del.id);
      setItems(items.filter(it => it.id !== del.id));
      pushToast('Enseignement supprimé', 'ens');
    } catch {
      pushToast('Erreur lors de la suppression', 'tem');
    }
    setDel(null);
  }

  return (
    <div className="a-page wide a-pagefade" style={aStyle('ens')}>
      <PageHead accent="ens" icon="book"
        eyebrow={<><span style={{ width: 8, height: 8, borderRadius: 9, background: 'var(--c)' }} />Module Enseignements</>}
        title="Enseignements" sub="Séries, études bibliques et messages. Organisés par série et par thème.">
        <button className="a-btn a-btn-primary" onClick={() => setModal({})}>
          <AIcon n="plus" size={17} />Nouvel enseignement
        </button>
      </PageHead>

      <div style={{ display: 'flex', gap: 9, marginBottom: 18 }}>
        <Badge tone="green" dot>{items.length} messages</Badge>
        <Badge tone="neutral">{seriesNames.length} séries</Badge>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[1, 2].map(i => <div key={i} className="a-sk" style={{ height: 120, borderRadius: 16 }} />)}
        </div>
      ) : seriesNames.length === 0 ? (
        <Empty icon="book" title="Aucun enseignement" sub="Publiez le premier message pour le voir apparaître ici." />
      ) : seriesNames.map((s, si) => {
        const list = items.filter(e => e.serie === s);
        return (
          <Reveal key={s} delay={si * 60} style={{ marginBottom: 18, display: 'block' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 2px 11px' }}>
              <span style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--c-t)', color: 'var(--c-i)', display: 'grid', placeItems: 'center' }}>
                <AIcon n="layout" size={15} />
              </span>
              <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-.01em' }}>Série « {s} »</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)' }}>· {list.length} message{list.length > 1 ? 's' : ''}</span>
            </div>
            <Panel accent="ens" pad={false}>
              <table className="a-tbl">
                <tbody>
                  {list.map(e => (
                    <tr key={e.id}>
                      <td style={{ width: 44 }}><span className="a-rowico"><AIcon n={e.yt ? 'play' : 'filetext'} size={16} /></span></td>
                      <td>
                        <div className="a-tprime">{e.titre}</div>
                        <div className="a-tsub">{e.auteur} · {e.date || 'sans date'}</div>
                      </td>
                      <td style={{ width: 120 }}><Badge tone="green" dot>{e.theme}</Badge></td>
                      <td style={{ width: 110 }}>
                        {e.yt
                          ? <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', display: 'inline-flex', alignItems: 'center', gap: 5 }}><AIcon n="play" size={13} />Vidéo</span>
                          : <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)' }}>Texte</span>}
                      </td>
                      <td style={{ width: 96 }}>
                        <div className="a-tact">
                          <button className="a-iact" title="Modifier" onClick={() => setModal({ edit: e })}><AIcon n="pen" size={16} /></button>
                          <button className="a-iact del" title="Supprimer" onClick={() => setDel(e)}><AIcon n="trash" size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          </Reveal>
        );
      })}

      {modal && <TeachModal edit={modal.edit} series={series} onClose={() => setModal(null)} onSave={save} />}
      {del && (
        <Modal accent="ens" icon="trash" title="Supprimer l'enseignement ?" onClose={() => setDel(null)}
          footer={<><button className="a-btn a-btn-ghost" onClick={() => setDel(null)}>Annuler</button><button className="a-btn a-btn-danger" onClick={remove}><AIcon n="trash" size={16} />Supprimer</button></>}>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, color: 'var(--ink-2)' }}>
            L&apos;enseignement <b style={{ color: 'var(--ink)' }}>« {del.titre} »</b> sera définitivement retiré. Cette action est irréversible.
          </p>
        </Modal>
      )}

      <ToastHost toasts={toasts} />
    </div>
  );
}
