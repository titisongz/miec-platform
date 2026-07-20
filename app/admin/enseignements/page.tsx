'use client';
import React, { useEffect, useMemo, useState } from 'react';
import AIcon from '@/components/admin/icon';
import { PageHead, Panel, Modal, Field, Input, Textarea, Select, Badge, Seg, Reveal, Spinner, Empty, StatBand, Toolbar, SearchInput, DateRange, inDateRange, isThisMonth, aStyle, useToasts, ToastHost } from '@/components/admin/ui';
import { getEnseignementsAdmin, getSeriesAdmin, createEnseignement, updateEnseignement, deleteEnseignement, createSerie, updateSerie, deleteSerie } from '@/lib/admin-queries';
import type { Enseignement, Serie } from '@/lib/types';

// Suggestions de thèmes (datalist) — la saisie reste libre.
const THEMES_SUGGERES = ['Foi', 'Grâce', 'Mission', 'Prière', 'Famille', 'Espérance', 'Sanctification'];

// ── Modale de série (création / édition) ─────────────────────────────────────
function SerieModal({ edit, onClose, onSave }: {
  edit?: Serie; onClose: () => void; onSave: (titre: string, description: string) => void;
}) {
  const [titre, setTitre] = useState(edit?.titre ?? '');
  const [desc, setDesc] = useState(edit?.description ?? '');
  const [busy, setBusy] = useState(false);
  const ok = !!titre.trim();
  function submit() { if (!ok) return; setBusy(true); onSave(titre.trim(), desc.trim()); }
  return (
    <Modal accent="ens" icon="layout" title={edit ? 'Modifier la série' : 'Nouvelle série'} onClose={onClose}
      footer={<>
        <button className="a-btn a-btn-ghost" onClick={onClose}>Annuler</button>
        <button className="a-btn a-btn-primary" disabled={!ok || busy} onClick={submit}>
          {busy ? <><Spinner />…</> : <><AIcon n="check" size={17} />{edit ? 'Enregistrer' : 'Créer la série'}</>}
        </button>
      </>}>
      <div className="a-form">
        <Field label="Titre de la série">
          <Input value={titre} autoFocus onChange={e => setTitre(e.target.value)} placeholder="Les fondements de la foi" />
        </Field>
        <Field label="Description" opt="optionnelle">
          <Textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="De quoi parle cette série…" />
        </Field>
      </div>
    </Modal>
  );
}

// `serie_id` (et non plus le titre) : la série est choisie dans la liste réelle,
// une chaîne vide signifiant « sans série ».
type FormData = {
  id?: string; titre: string; auteur: string; date: string;
  serie_id: string; theme: string; yt: string; excerpt: string; type: string;
};

function TeachModal({ edit, series, onClose, onSave, onSerieCreated }: {
  edit?: Enseignement; series: Serie[];
  onClose: () => void;
  onSave: (f: FormData) => void;
  onSerieCreated: (s: Serie) => void;
}) {
  const [f, setF] = useState<FormData>({
    id: edit?.id,
    titre: edit?.titre ?? '',
    auteur: edit?.auteur ?? '',
    date: edit?.date ?? '',
    // En édition, l'enseignement ne porte que le TITRE de sa série : on retrouve
    // l'id correspondant dans la liste chargée.
    serie_id: series.find(s => s.titre === edit?.serie)?.id ?? '',
    theme: edit?.theme ?? '',
    yt: edit?.yt ?? '',
    excerpt: edit?.excerpt ?? '',
    type: edit?.type ?? 'text',
  });
  const [busy, setBusy] = useState(false);
  // Mini-formulaire inline de création de série, sans quitter la modale.
  const [addSerie, setAddSerie] = useState(false);
  const [nsTitre, setNsTitre] = useState('');
  const [nsDesc, setNsDesc] = useState('');
  const [nsBusy, setNsBusy] = useState(false);
  const [nsErr, setNsErr] = useState('');
  const ok = f.titre && f.auteur;

  async function createInline() {
    const titre = nsTitre.trim();
    if (!titre) return;
    if (series.some(s => s.titre.toLowerCase() === titre.toLowerCase())) {
      setNsErr('Une série porte déjà ce nom.');
      return;
    }
    setNsBusy(true);
    setNsErr('');
    try {
      const id = await createSerie(titre, nsDesc.trim());
      onSerieCreated({ id, titre, description: nsDesc.trim(), n: 0, c: '', meta: '0 message' });
      setF(prev => ({ ...prev, serie_id: id }));   // sélectionne la série créée
      setAddSerie(false); setNsTitre(''); setNsDesc('');
    } catch {
      setNsErr('Création impossible. Réessayez.');
    }
    setNsBusy(false);
  }

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
              <Select value={f.serie_id} onChange={e => setF({ ...f, serie_id: e.target.value })}>
                <option value="">— Sans série —</option>
                {series.map(s => <option key={s.id} value={s.id}>{s.titre}</option>)}
              </Select>
            </Field>
            {!addSerie && (
              <button type="button" onClick={() => { setAddSerie(true); setNsErr(''); }}
                style={{ marginTop: 7, fontSize: 12.5, fontWeight: 700, color: '#4C84B8', cursor: 'pointer' }}>
                + Nouvelle série
              </button>
            )}
            {/* Mini-formulaire inline : crée la série et la sélectionne aussitôt. */}
            {addSerie && (
              <div style={{ marginTop: 9, padding: 12, borderRadius: 12, background: 'var(--bg-soft)', border: '1px solid var(--line)' }}>
                <Input value={nsTitre} autoFocus placeholder="Titre de la série"
                  onChange={e => { setNsTitre(e.target.value); setNsErr(''); }}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); createInline(); } }} />
                <Input value={nsDesc} placeholder="Description (optionnelle)" style={{ marginTop: 8 }}
                  onChange={e => setNsDesc(e.target.value)} />
                {nsErr && <div style={{ color: '#dc2626', fontSize: 12, fontWeight: 600, marginTop: 7 }}>{nsErr}</div>}
                <div style={{ display: 'flex', gap: 8, marginTop: 9 }}>
                  <button type="button" className="a-btn a-btn-primary a-btn-sm" disabled={!nsTitre.trim() || nsBusy} onClick={createInline}>
                    {nsBusy ? <><Spinner />…</> : <><AIcon n="check" size={14} />Créer</>}
                  </button>
                  <button type="button" className="a-btn a-btn-ghost a-btn-sm"
                    onClick={() => { setAddSerie(false); setNsErr(''); setNsTitre(''); setNsDesc(''); }}>
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
          <Field label="Thème">
            <Input value={f.theme} onChange={e => setF({ ...f, theme: e.target.value })} placeholder="Foi, Grâce, Mission…" list="ens-themes" />
            <datalist id="ens-themes">{THEMES_SUGGERES.map(t => <option key={t} value={t} />)}</datalist>
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

// ── Onglet « Gestion des séries » ────────────────────────────────────────────
function SeriesTab({ series, items, loading, onEdit, onDelete }: {
  series: Serie[]; items: Enseignement[]; loading: boolean;
  onEdit: (s: Serie) => void; onDelete: (s: Serie) => void;
}) {
  // Enseignements orphelins : visibles ici pour qu'ils ne soient pas oubliés.
  const sansSerie = items.filter(e => !e.serie).length;

  if (loading) {
    return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[1, 2, 3].map(i => <div key={i} className="a-sk" style={{ height: 72, borderRadius: 14 }} />)}
    </div>;
  }
  if (series.length === 0) {
    return <Empty icon="layout" title="Aucune série" sub="Créez une série pour regrouper vos enseignements." />;
  }

  return (
    <>
      <Panel accent="ens" pad={false}>
        <table className="a-tbl">
          <thead><tr><th></th><th>Série</th><th>Enseignements</th><th></th></tr></thead>
          <tbody>
            {series.map(s => {
              const n = items.filter(e => e.serie === s.titre).length;
              return (
                <tr key={s.id}>
                  <td style={{ width: 44 }}><span className="a-rowico"><AIcon n="layout" size={16} /></span></td>
                  <td>
                    <div className="a-tprime">{s.titre}</div>
                    <div className="a-tsub" style={{ maxWidth: 460, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {s.description || <span style={{ fontStyle: 'italic', opacity: .7 }}>Aucune description</span>}
                    </div>
                  </td>
                  <td style={{ width: 150 }}>
                    <Badge tone={n > 0 ? 'green' : 'neutral'} dot>{n} enseignement{n > 1 ? 's' : ''}</Badge>
                  </td>
                  <td style={{ width: 96 }}>
                    <div className="a-tact">
                      <button className="a-iact" title="Modifier" onClick={() => onEdit(s)}><AIcon n="pen" size={16} /></button>
                      <button className="a-iact del" title="Supprimer" onClick={() => onDelete(s)}><AIcon n="trash" size={16} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
      {sansSerie > 0 && (
        <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 7 }}>
          <AIcon n="info" size={15} />
          {sansSerie} enseignement{sansSerie > 1 ? 's ne sont' : ' n\'est'} rattaché{sansSerie > 1 ? 's' : ''} à aucune série.
        </div>
      )}
    </>
  );
}

export default function PageEnseignements() {
  const [items, setItems] = useState<Enseignement[]>([]);
  const [series, setSeries] = useState<Serie[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ edit?: Enseignement } | null>(null);
  const [del, setDel] = useState<Enseignement | null>(null);
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [tab, setTab] = useState('enseignements');
  const [fSerie, setFSerie] = useState('Toutes');
  const [fTheme, setFTheme] = useState('Tous');
  const [serieModal, setSerieModal] = useState<{ edit?: Serie } | null>(null);
  const [delSerie, setDelSerie] = useState<Serie | null>(null);
  const [toasts, pushToast] = useToasts();

  useEffect(() => {
    Promise.all([getEnseignementsAdmin(), getSeriesAdmin()]).then(([ens, srs]) => {
      setItems(ens); setSeries(srs); setLoading(false);
    });
  }, []);

  // Stats sur l'ensemble du module ; la liste ci-dessous suit recherche + filtres.
  const ceMois = items.filter(e => isThisMonth(e.date)).length;

  // Thèmes réellement utilisés, pour alimenter le filtre (et non une liste figée).
  const themes = useMemo(
    () => Array.from(new Set(items.map(e => e.theme).filter(Boolean))).sort(),
    [items],
  );

  // Recherche + série + thème + plage de dates se combinent (ET logique).
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items.filter(e =>
      (!term || e.titre.toLowerCase().includes(term) || e.auteur.toLowerCase().includes(term) || e.serie.toLowerCase().includes(term)) &&
      (fSerie === 'Toutes' || e.serie === fSerie || (fSerie === '__sans__' && !e.serie)) &&
      (fTheme === 'Tous' || e.theme === fTheme) &&
      inDateRange(e.date, from, to)
    );
  }, [items, q, fSerie, fTheme, from, to]);

  // Séries affichées = celles qui contiennent encore un enseignement après filtrage.
  const seriesNames = Array.from(new Set(shown.map(e => e.serie)));

  async function save(f: FormData) {
    try {
      const serieId = f.serie_id || undefined;
      const serieTitre = series.find(s => s.id === f.serie_id)?.titre ?? '';
      if (f.id) {
        await updateEnseignement(f.id, { titre: f.titre, auteur: f.auteur, date: f.date, serie_id: f.serie_id, theme: f.theme, youtube_id: f.yt, texte: f.excerpt, type: f.yt ? 'video' : 'texte' });
        setItems(items.map(it => it.id === f.id ? {
          ...it,
          titre: f.titre, auteur: f.auteur, date: f.date, theme: f.theme,
          excerpt: f.excerpt, serie: serieTitre, yt: f.yt || undefined,
        } : it));
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

  // Nombre d'enseignements rattachés, calculé sur la liste courante : reste juste
  // après un ajout/suppression sans avoir à recharger les séries.
  function serieCount(s: Serie): number {
    return items.filter(e => e.serie === s.titre).length;
  }

  async function saveSerie(titre: string, description: string) {
    const edit = serieModal?.edit;
    try {
      if (edit) {
        await updateSerie(edit.id, { titre, description });
        setSeries(series.map(s => s.id === edit.id ? { ...s, titre, description } : s));
        // Les enseignements ne portent que le titre de leur série : on le
        // répercute pour que la liste et les filtres restent cohérents.
        if (titre !== edit.titre) {
          setItems(items.map(e => e.serie === edit.titre ? { ...e, serie: titre } : e));
          if (fSerie === edit.titre) setFSerie(titre);
        }
        pushToast('Série mise à jour', 'ens');
      } else {
        const id = await createSerie(titre, description);
        setSeries([{ id, titre, description, n: 0, c: '', meta: '0 message' }, ...series]);
        pushToast('Série créée', 'ens');
      }
    } catch { pushToast('Erreur lors de l\'enregistrement', 'tem'); }
    setSerieModal(null);
  }

  async function removeSerie() {
    if (!delSerie) return;
    try {
      await deleteSerie(delSerie.id);
      setSeries(series.filter(s => s.id !== delSerie.id));
      // `on delete set null` côté base : les enseignements restent, sans série.
      setItems(items.map(e => e.serie === delSerie.titre ? { ...e, serie: '' } : e));
      if (fSerie === delSerie.titre) setFSerie('Toutes');
      pushToast('Série supprimée', 'ens');
    } catch { pushToast('Erreur lors de la suppression', 'tem'); }
    setDelSerie(null);
  }

  return (
    <div className="a-page wide a-pagefade" style={aStyle('ens')}>
      <PageHead accent="ens" icon="book"
        eyebrow={<><span style={{ width: 8, height: 8, borderRadius: 9, background: 'var(--c)' }} />Module Enseignements</>}
        title="Enseignements" sub="Séries, études bibliques et messages. Organisés par série et par thème.">
        {tab === 'enseignements' ? (
          <button className="a-btn a-btn-primary" onClick={() => setModal({})}>
            <AIcon n="plus" size={17} />Nouvel enseignement
          </button>
        ) : (
          <button className="a-btn a-btn-primary" onClick={() => setSerieModal({})}>
            <AIcon n="plus" size={17} />Nouvelle série
          </button>
        )}
      </PageHead>

      <StatBand accent="ens" stats={[
        { l: 'Total enseignements', v: items.length, i: 'book' },
        { l: 'Séries', v: series.length, i: 'layout' },
        { l: 'Ce mois-ci', v: ceMois, i: 'calendar' },
      ]} />

      <div style={{ marginBottom: 16 }}>
        <Seg active={tab} onPick={setTab} tabs={[
          { v: 'enseignements', l: 'Enseignements', icon: 'book', n: items.length },
          { v: 'series', l: 'Gestion des séries', icon: 'layout', n: series.length },
        ]} />
      </div>

      {tab === 'series' ? (
        <SeriesTab
          series={series} items={items} loading={loading}
          onEdit={s => setSerieModal({ edit: s })}
          onDelete={s => setDelSerie(s)}
        />
      ) : (<>
      <Toolbar>
        <SearchInput value={q} onChange={setQ} placeholder="Rechercher un titre, un intervenant, une série…" />
        <Select value={fSerie} onChange={e => setFSerie(e.target.value)} style={{ height: 40, width: 'auto', minWidth: 170 }}>
          <option value="Toutes">Toutes les séries</option>
          <option value="__sans__">— Sans série —</option>
          {series.map(s => <option key={s.id} value={s.titre}>{s.titre}</option>)}
        </Select>
        <Select value={fTheme} onChange={e => setFTheme(e.target.value)} style={{ height: 40, width: 'auto', minWidth: 150 }}>
          <option value="Tous">Tous les thèmes</option>
          {themes.map(t => <option key={t} value={t}>{t}</option>)}
        </Select>
        <DateRange from={from} to={to} onFrom={setFrom} onTo={setTo} />
      </Toolbar>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[1, 2].map(i => <div key={i} className="a-sk" style={{ height: 120, borderRadius: 16 }} />)}
        </div>
      ) : items.length === 0 ? (
        <Empty icon="book" title="Aucun enseignement" sub="Publiez le premier message pour le voir apparaître ici." />
      ) : seriesNames.length === 0 ? (
        <Empty icon="search" title="Aucun résultat" sub="Aucun enseignement ne correspond à cette recherche ou à cette période." />
      ) : seriesNames.map((s, si) => {
        const list = shown.filter(e => e.serie === s);
        return (
          <Reveal key={s} delay={si * 60} style={{ marginBottom: 18, display: 'block' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 2px 11px' }}>
              <span style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--c-t)', color: 'var(--c-i)', display: 'grid', placeItems: 'center' }}>
                <AIcon n="layout" size={15} />
              </span>
              <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-.01em' }}>
                {s ? `Série « ${s} »` : 'Sans série'}
              </span>
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
      </>)}

      {modal && (
        <TeachModal edit={modal.edit} series={series} onClose={() => setModal(null)} onSave={save}
          onSerieCreated={s => setSeries(prev => [s, ...prev])} />
      )}
      {del && (
        <Modal accent="ens" icon="trash" title="Supprimer l'enseignement ?" onClose={() => setDel(null)}
          footer={<><button className="a-btn a-btn-ghost" onClick={() => setDel(null)}>Annuler</button><button className="a-btn a-btn-danger" onClick={remove}><AIcon n="trash" size={16} />Supprimer</button></>}>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, color: 'var(--ink-2)' }}>
            L&apos;enseignement <b style={{ color: 'var(--ink)' }}>« {del.titre} »</b> sera définitivement retiré. Cette action est irréversible.
          </p>
        </Modal>
      )}

      {serieModal && (
        <SerieModal edit={serieModal.edit} onClose={() => setSerieModal(null)} onSave={saveSerie} />
      )}
      {delSerie && (
        <Modal accent="ens" icon="trash" title="Supprimer la série ?" onClose={() => setDelSerie(null)}
          footer={<>
            <button className="a-btn a-btn-ghost" onClick={() => setDelSerie(null)}>Annuler</button>
            <button className="a-btn a-btn-danger" onClick={removeSerie}>
              <AIcon n="trash" size={16} />{serieCount(delSerie) > 0 ? 'Supprimer quand même' : 'Supprimer'}
            </button>
          </>}>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, color: 'var(--ink-2)' }}>
            La série <b style={{ color: 'var(--ink)' }}>« {delSerie.titre} »</b> sera supprimée.
          </p>
          {serieCount(delSerie) > 0 && (
            // enseignements.serie_id est `on delete set null` : les enseignements
            // survivent à la suppression, ils perdent seulement leur série.
            <div style={{ marginTop: 12, padding: '11px 13px', borderRadius: 11, background: 'var(--m-eva-t, #FBF1E5)', border: '1px solid color-mix(in srgb, #DD8A3C 35%, transparent)', display: 'flex', gap: 9, alignItems: 'flex-start' }}>
              <AIcon n="info" size={16} style={{ flex: '0 0 auto', marginTop: 1, color: '#B26A22' }} />
              <span style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink-2)' }}>
                Elle contient encore <b style={{ color: 'var(--ink)' }}>{serieCount(delSerie)} enseignement{serieCount(delSerie) > 1 ? 's' : ''}</b>.
                Ils ne seront pas supprimés, mais se retrouveront <b style={{ color: 'var(--ink)' }}>sans série</b>.
              </span>
            </div>
          )}
        </Modal>
      )}

      <ToastHost toasts={toasts} />
    </div>
  );
}
