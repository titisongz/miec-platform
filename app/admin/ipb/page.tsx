'use client';
import React, { useEffect, useState } from 'react';
import AIcon from '@/components/admin/icon';
import { PageHead, Panel, Modal, Field, Input, Textarea, Select, Badge, Seg, Empty, Spinner, aStyle, useToasts, ToastHost } from '@/components/admin/ui';
import { getIPBCours, getIPBProgramme, getIPBVitrine, IPB_VITRINE_DEFAUT, parseGalerie } from '@/lib/queries';
import { createIPBCours, updateIPBCours, deleteIPBCours, updateIPBVitrine, getIPBDocuments, addIPBDocument, deleteIPBDocument, setInscriptionStatut } from '@/lib/admin-queries';
import { uploadPhoto, uploadPhotos, uploadFile, validatePhotos, validateFile, MAX_PHOTO_MB } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import type { IPBCours, IPBProgramme } from '@/lib/types';

type CoursDoc = { id?: string; titre: string; fichier_url?: string; type?: string; file?: File };
type CoursForm = { id?: string; code: string; titre: string; niveau: string; prof: string; desc: string; modules: string; docs: CoursDoc[]; docsDeleted: string[] };
type Inscription = { id: string; nom: string; email: string; date: string; statut: string; profile_id?: string };

// Extrait un message lisible d'une erreur Supabase (PostgrestError / StorageError)
// ou d'une Error standard, pour l'afficher tel quel dans un toast.
function errMessage(e: unknown): string {
  if (e && typeof e === 'object') {
    const o = e as { message?: string; details?: string; hint?: string; code?: string };
    const parts = [o.message, o.details, o.hint].filter(Boolean);
    if (parts.length) return parts.join(' · ');
    if (o.code) return `code ${o.code}`;
  }
  return String(e);
}

function CoursModal({ edit, onClose, onSave }: { edit?: IPBCours; onClose: () => void; onSave: (f: CoursForm) => void | Promise<void> }) {
  const [f, setF] = useState<CoursForm>({
    id: edit?.id, code: edit?.code ?? '', titre: edit?.titre ?? '',
    niveau: edit?.niveau || 'N1', prof: edit?.prof ?? '', desc: edit?.desc ?? '',
    modules: edit?.modules ? String(edit.modules) : '',
    docs: [], docsDeleted: [],
  });
  const [busy, setBusy] = useState(false);
  // Saisie d'un nouveau document (titre + fichier PDF).
  const [docTitle, setDocTitle] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docErr, setDocErr] = useState('');
  const ok = f.code && f.titre;

  // Chargement des documents existants (édition) — avec leur id pour la suppression.
  useEffect(() => {
    if (!edit?.id) return;
    getIPBDocuments(edit.id).then(docs => setF(prev => ({ ...prev, docs })));
  }, [edit?.id]);

  function addDoc() {
    if (!docTitle.trim() || !docFile) { setDocErr('Titre et fichier PDF requis.'); return; }
    const e = validateFile(docFile, ['pdf']);
    if (e) { setDocErr(e); return; }
    setF(prev => ({ ...prev, docs: [...prev.docs, { titre: docTitle.trim(), file: docFile, type: 'pdf' }] }));
    setDocTitle(''); setDocFile(null); setDocErr('');
  }
  function removeDoc(idx: number) {
    setF(prev => {
      const d = prev.docs[idx];
      return {
        ...prev,
        docs: prev.docs.filter((_, i) => i !== idx),
        docsDeleted: d.id ? [...prev.docsDeleted, d.id] : prev.docsDeleted,
      };
    });
  }
  // await onSave : si l'enregistrement échoue, le modal reste ouvert (la saisie
  // et le PDF sélectionné sont conservés) et le bouton se réactive.
  async function submit() {
    if (!ok) return;
    // Rattache automatiquement un document saisi mais pas encore « Ajouté »
    // (piège UX : choisir un PDF puis cliquer « Créer » sans cliquer « Ajouter »).
    let docs = f.docs;
    if (docFile) {
      const e = validateFile(docFile, ['pdf']);
      if (e) { setDocErr(e); return; }
      const titre = docTitle.trim() || docFile.name.replace(/\.[^.]+$/, '');
      docs = [...f.docs, { titre, file: docFile, type: 'pdf' }];
    }
    setBusy(true);
    try { await onSave({ ...f, docs }); } finally { setBusy(false); }
  }

  return (
    <Modal accent="ipb" icon="cap" wide title={edit ? 'Modifier le cours' : 'Ajouter un cours'} onClose={onClose}
      footer={<><button className="a-btn a-btn-ghost" onClick={onClose}>Annuler</button><button className="a-btn a-btn-primary" disabled={!ok || busy} onClick={submit}>{busy ? <><Spinner />…</> : <><AIcon n="check" size={17} />{edit ? 'Enregistrer' : 'Créer'}</>}</button></>}>
      <div className="a-form">
        <div className="a-frow three">
          <Field label="Code" icon="hash"><Input value={f.code} onChange={e => setF({ ...f, code: e.target.value })} placeholder="TH101" /></Field>
          <Field label="Niveau">
            <Select value={f.niveau} onChange={e => setF({ ...f, niveau: e.target.value })}>
              {['N1', 'N2', 'N3', 'M1', 'M2'].map(n => <option key={n}>{n}</option>)}
            </Select>
          </Field>
          <Field label="Modules" hint="Nombre de modules"><Input value={f.modules} onChange={e => setF({ ...f, modules: e.target.value })} placeholder="8" /></Field>
        </div>
        <Field label="Titre du cours"><Input value={f.titre} onChange={e => setF({ ...f, titre: e.target.value })} placeholder="Introduction à la théologie systématique" /></Field>
        <Field label="Professeur" icon="user" opt="optionnel"><Input value={f.prof} onChange={e => setF({ ...f, prof: e.target.value })} placeholder="Prof. Jean-Pierre Bokwe" /></Field>
        <Field label="Description" opt="optionnelle">
          <Textarea value={f.desc} onChange={e => setF({ ...f, desc: e.target.value })} rows={3} placeholder="Présentation et objectifs pédagogiques…" />
        </Field>

        <Field label="Documents du cours" opt="PDF" hint="Téléversés à l'enregistrement · 10 Mo max">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {f.docs.map((d, i) => (
              <div key={d.id ?? 'new' + i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 11px', borderRadius: 9, background: 'var(--bg-soft)' }}>
                <AIcon n="filetext" size={16} />
                <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.titre}</span>
                {!d.id && <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ink-3)' }}>nouveau</span>}
                <button type="button" className="a-iact del" onClick={() => removeDoc(i)}><AIcon n="trash" size={14} /></button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Input value={docTitle} onChange={e => setDocTitle(e.target.value)} placeholder="Titre du document" style={{ flex: 1 }} />
              <label className="a-btn a-btn-ghost" style={{ cursor: 'pointer', flex: '0 0 auto' }}>
                <AIcon n="upload" size={15} />{docFile ? 'Changer' : 'PDF'}
                <input type="file" accept=".pdf,application/pdf" style={{ display: 'none' }} onChange={e => { setDocFile(e.target.files?.[0] ?? null); setDocErr(''); e.target.value = ''; }} />
              </label>
              <button type="button" className="a-btn a-btn-primary" style={aStyle('ipb')} onClick={addDoc}><AIcon n="plus" size={15} />Ajouter</button>
            </div>
            {docFile && <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>Fichier sélectionné : {docFile.name}</div>}
            {docErr && <div style={{ color: '#dc2626', fontSize: 12.5, fontWeight: 600 }}>{docErr}</div>}
          </div>
        </Field>
      </div>
    </Modal>
  );
}

// Galerie vitrine : maximum 6 photos.
const GALERIE_MAX = 6;

// Champs éditables de la vitrine, regroupés par section. `cle` correspond
// exactement aux lignes de la table public.ipb_vitrine.
const VITRINE_GROUPS: { titre: string; icon: string; fields: { cle: string; label: string; area?: boolean; hint?: string }[] }[] = [
  { titre: 'Présentation', icon: 'cap', fields: [
    { cle: 'description', label: 'Description', area: true, hint: "Phrase d'accroche affichée en haut de la vitrine" },
    { cle: 'depuis', label: "Mention d'en-tête", hint: 'Badge affiché en haut · ex. Formation accélérée' },
  ] },
  { titre: 'Chiffres clés', icon: 'chart', fields: [
    { cle: 'cursus', label: 'Cursus', hint: 'Ex. 2 mois' },
    { cle: 'diplome', label: 'Diplôme', hint: 'Ex. Attestation de formation' },
    { cle: 'modalite', label: 'Modalité', hint: 'Ex. Présentiel · Tous les samedis' },
  ] },
  { titre: 'Frais de scolarité', icon: 'shield', fields: [
    { cle: 'frais', label: 'Montant', hint: 'Ex. 10 000 FCFA' },
    { cle: 'frais_note', label: 'Note', hint: 'Ex. Paiement OM : 658 923 857' },
  ] },
  { titre: 'Dates clés', icon: 'calendar', fields: [
    { cle: 'date_inscriptions', label: 'Ouverture des inscriptions', hint: 'Ex. 27 juin 2026' },
    { cle: 'date_cloture', label: 'Clôture des candidatures', hint: 'Ex. 29 août 2026' },
    { cle: 'date_rentree', label: 'Rentrée académique', hint: 'Ex. 27 juin 2026' },
  ] },
  { titre: "Conditions & infos pratiques", icon: 'check', fields: [
    { cle: 'condition_1', label: 'Ligne 1', area: true },
    { cle: 'condition_2', label: 'Ligne 2', area: true },
    { cle: 'condition_3', label: 'Ligne 3', area: true },
  ] },
];

function VitrineTab({ pushToast }: { pushToast: (m: string, a?: string) => void }) {
  const [v, setV] = useState<Record<string, string>>(IPB_VITRINE_DEFAUT);
  const [initial, setInitial] = useState<Record<string, string>>(IPB_VITRINE_DEFAUT);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Médias : URLs déjà enregistrées + fichiers en attente d'upload.
  const [banniere, setBanniere] = useState('');
  const [galerie, setGalerie] = useState<string[]>([]);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [galerieFiles, setGalerieFiles] = useState<File[]>([]);
  const [mediaErr, setMediaErr] = useState('');

  useEffect(() => {
    getIPBVitrine().then(data => {
      setV(data); setInitial(data);
      setBanniere(data.banniere_url || '');
      setGalerie(parseGalerie(data.photos_galerie));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const allFields = VITRINE_GROUPS.flatMap(g => g.fields);
  const textDirty = allFields.some(f => (v[f.cle] ?? '') !== (initial[f.cle] ?? ''));
  const mediaDirty =
    !!bannerFile || galerieFiles.length > 0 ||
    banniere !== (initial.banniere_url || '') ||
    JSON.stringify(galerie) !== JSON.stringify(parseGalerie(initial.photos_galerie));
  const dirty = textDirty || mediaDirty;

  function set(cle: string, val: string) { setV(prev => ({ ...prev, [cle]: val })); }

  const totalGalerie = galerie.length + galerieFiles.length;

  function pickBanner(list: FileList | null) {
    const file = list?.[0];
    if (!file) return;
    const e = validatePhotos([file], 0, 1);
    if (e) { setMediaErr(e); return; }
    setMediaErr(''); setBannerFile(file);
  }

  function pickGalerie(list: FileList | null) {
    if (!list || !list.length) return;
    const picked = Array.from(list);
    const e = validatePhotos(picked, totalGalerie, GALERIE_MAX);
    if (e) { setMediaErr(e); return; }
    setMediaErr(''); setGalerieFiles(prev => [...prev, ...picked]);
  }

  // Épingle une photo déjà enregistrée comme bannière (remplace un éventuel
  // nouveau fichier bannière en attente).
  function pin(url: string) { setBanniere(url); setBannerFile(null); }

  async function save() {
    setBusy(true);
    try {
      // 1. Upload des nouveaux fichiers dans media/ipb/.
      const uploadedBanner = bannerFile ? await uploadPhoto(bannerFile, 'ipb') : '';
      const uploadedGalerie = galerieFiles.length ? await uploadPhotos(galerieFiles, 'ipb') : [];
      const nextBanniere = uploadedBanner || banniere;
      const nextGalerie = [...galerie, ...uploadedGalerie];

      // 2. État cible complet (texte + médias).
      const target: Record<string, string> = {
        ...v,
        banniere_url: nextBanniere,
        photos_galerie: JSON.stringify(nextGalerie),
      };

      // 3. N'envoyer que les clés réellement modifiées.
      const keys = [...allFields.map(f => f.cle), 'banniere_url', 'photos_galerie'];
      const changed = keys.filter(k => (target[k] ?? '') !== (initial[k] ?? ''));
      await Promise.all(changed.map(k => updateIPBVitrine(k, target[k] ?? '')));

      // 4. Refléter l'état enregistré.
      setV(target); setInitial(target);
      setBanniere(nextBanniere); setGalerie(nextGalerie);
      setBannerFile(null); setGalerieFiles([]);
      pushToast('Vitrine mise à jour', 'ipb');
    } catch { pushToast('Erreur', 'tem'); }
    setBusy(false);
  }

  if (loading) return <div style={{ display: 'grid', gap: 10 }}>{[1, 2, 3].map(i => <div key={i} className="a-sk" style={{ height: 120, borderRadius: 12 }} />)}</div>;

  const bannerPreview = bannerFile ? URL.createObjectURL(bannerFile) : banniere;

  return (
    <div>
      <p style={{ fontSize: 13.5, color: 'var(--ink-2)', marginBottom: 20 }}>Contenu affiché sur la page vitrine de l&apos;IPB dans l&apos;application mobile.</p>
      <div style={{ display: 'grid', gap: 16 }}>

        {/* ── Bannière & Photos ── */}
        <Panel accent="ipb" icon="image" title="Bannière & Photos">
          <Field label="Bannière principale" hint="Épinglée en haut de la vitrine · 1 image">
            {bannerPreview ? (
              <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line)' }}>
                <img src={bannerPreview} alt="" style={{ width: '100%', height: 150, objectFit: 'cover', display: 'block' }} />
                <button type="button" aria-label="Retirer la bannière" onClick={() => { setBannerFile(null); setBanniere(''); }}
                  style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,.6)', color: '#fff', display: 'grid', placeItems: 'center' }}>
                  <AIcon n="trash" size={15} />
                </button>
              </div>
            ) : (
              <label className="a-btn a-btn-ghost" style={{ cursor: 'pointer', width: 'fit-content' }}>
                <AIcon n="upload" size={16} />Choisir une image
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { pickBanner(e.target.files); e.target.value = ''; }} />
              </label>
            )}
          </Field>

          <Field label="Galerie photos" hint={`Jusqu'à ${GALERIE_MAX} photos · ${MAX_PHOTO_MB} Mo max · « Épingler » définit la bannière`}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {galerie.map((u, i) => {
                const epinglee = banniere === u;
                return (
                  <div key={'u' + i} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: epinglee ? '2px solid var(--c)' : '1px solid var(--line)' }}>
                    <img src={u} alt="" style={{ width: '100%', height: 92, objectFit: 'cover', display: 'block' }} />
                    <button type="button" aria-label="Retirer" onClick={() => setGalerie(galerie.filter((_, j) => j !== i))}
                      style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,.6)', color: '#fff', display: 'grid', placeItems: 'center' }}>
                      <AIcon n="x" size={12} sw={2.4} />
                    </button>
                    <button type="button" onClick={() => pin(u)}
                      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '4px 0', fontSize: 10.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, background: epinglee ? 'var(--c)' : 'rgba(0,0,0,.55)', color: '#fff' }}>
                      <AIcon n="pin" size={11} />{epinglee ? 'Bannière' : 'Épingler'}
                    </button>
                  </div>
                );
              })}
              {galerieFiles.map((f, i) => (
                <div key={'f' + i} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px dashed var(--line-2)' }}>
                  <img src={URL.createObjectURL(f)} alt="" style={{ width: '100%', height: 92, objectFit: 'cover', display: 'block', opacity: .85 }} />
                  <button type="button" aria-label="Retirer" onClick={() => setGalerieFiles(galerieFiles.filter((_, j) => j !== i))}
                    style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,.6)', color: '#fff', display: 'grid', placeItems: 'center' }}>
                    <AIcon n="x" size={12} sw={2.4} />
                  </button>
                  <span style={{ position: 'absolute', left: 4, bottom: 4, fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 6, background: 'rgba(0,0,0,.6)', color: '#fff' }}>nouvelle</span>
                </div>
              ))}
              {totalGalerie < GALERIE_MAX && (
                <label style={{ height: 92, borderRadius: 10, border: '1.5px dashed var(--line-2)', display: 'grid', placeItems: 'center', color: 'var(--ink-3)', cursor: 'pointer' }}>
                  <AIcon n="upload" size={18} />
                  <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => { pickGalerie(e.target.files); e.target.value = ''; }} />
                </label>
              )}
            </div>
            {mediaErr && <div style={{ color: '#dc2626', fontSize: 12.5, fontWeight: 600, marginTop: 8 }}>{mediaErr}</div>}
            <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 6 }}>Les nouvelles photos sont mises en ligne à l&apos;enregistrement.</div>
          </Field>
        </Panel>

        {/* ── Champs texte ── */}
        {VITRINE_GROUPS.map(g => (
          <Panel key={g.titre} accent="ipb" icon={g.icon} title={g.titre}>
            <div className="a-form">
              {g.fields.map(f => (
                <Field key={f.cle} label={f.label} hint={f.hint}>
                  {f.area
                    ? <Textarea value={v[f.cle] ?? ''} onChange={e => set(f.cle, e.target.value)} rows={2} />
                    : <Input value={v[f.cle] ?? ''} onChange={e => set(f.cle, e.target.value)} />}
                </Field>
              ))}
            </div>
          </Panel>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
        <button className="a-btn a-btn-primary" style={aStyle('ipb')} disabled={!dirty || busy} onClick={save}>
          {busy ? <><Spinner />…</> : <><AIcon n="check" size={16} />Enregistrer les modifications</>}
        </button>
      </div>
    </div>
  );
}

function CoursTab({ pushToast }: { pushToast: (m: string, a?: string) => void }) {
  const [cours, setCours] = useState<IPBCours[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ edit?: IPBCours } | null>(null);
  const [del, setDel] = useState<IPBCours | null>(null);

  useEffect(() => { getIPBCours().then(c => { setCours(c); setLoading(false); }).catch(() => setLoading(false)); }, []);

  async function save(f: CoursForm) {
    const modules = f.modules ? Number(f.modules) : undefined;
    const data = { code: f.code, titre: f.titre, niveau: f.niveau, prof: f.prof, desc: f.desc, modules };
    // Nouveaux documents à téléverser (ceux saisis dans le formulaire ont un File).
    const pendingDocs = f.docs.filter(d => d.file);
    console.group('[CoursTab.save] enregistrement du cours');
    console.log('cours (payload) =', data);
    console.log('documents à ajouter (pendingDocs) =', pendingDocs.map(d => ({ titre: d.titre, fichier: d.file?.name, taille: d.file?.size })));
    console.log('documents à supprimer (docsDeleted) =', f.docsDeleted);
    try {
      // 1. Cours : créer (→ id) ou mettre à jour. Chaque étape attend la précédente.
      const coursId = f.id ? (await updateIPBCours(f.id, data), f.id) : await createIPBCours(data);
      console.log('id du cours (retour createIPBCours/édition) =', coursId);
      if (!coursId) throw new Error("Aucun id de cours retourné — impossible de lier les documents.");

      // 2. Documents : suppressions puis ajouts. Flux par document :
      //    upload du PDF vers media/ipb/cours/ → PUIS insert dans ipb_documents.
      for (const id of f.docsDeleted) {
        console.log('suppression document id =', id);
        await deleteIPBDocument(id);
      }
      for (const d of pendingDocs) {
        console.log(`→ upload « ${d.titre} » (${d.file!.name}) vers media/ipb/cours/…`);
        const url = await uploadFile(d.file!, 'ipb/cours');
        console.log('   fichier uploadé, url publique =', url);
        const inserted = await addIPBDocument(coursId, d.titre, url);
        console.log('   addIPBDocument OK, ligne insérée =', inserted);
      }

      // 3. Reflet local (la table n'affiche pas les documents → recharge inutile).
      if (f.id) {
        setCours(cours.map(c => c.id === f.id ? { ...c, code: f.code, titre: f.titre, prof: f.prof, niveau: f.niveau, desc: f.desc, modules: modules ?? c.modules } : c));
        pushToast('Cours mis à jour', 'ipb');
      } else {
        const n: IPBCours = { id: coursId, code: f.code, titre: f.titre, prof: f.prof, prog: 0, modules: modules ?? 0, fait: 0, docs: [], niveau: f.niveau, desc: f.desc };
        setCours([n, ...cours]);
        pushToast('Cours créé', 'ipb');
      }
      console.groupEnd();
    } catch (e) {
      console.error('[CoursTab.save] échec à une étape:', e);
      console.groupEnd();
      pushToast(`Erreur : ${errMessage(e)}`, 'tem');
      return; // garde le modal ouvert pour ne pas perdre la saisie
    }
    setModal(null);
  }

  async function remove() {
    if (!del) return;
    try { await deleteIPBCours(del.id); setCours(cours.filter(c => c.id !== del.id)); pushToast('Cours supprimé', 'ipb'); }
    catch { pushToast('Erreur', 'tem'); }
    setDel(null);
  }

  if (loading) return <div style={{ display: 'grid', gap: 10 }}>{[1,2,3].map(i => <div key={i} className="a-sk" style={{ height: 72, borderRadius: 12 }} />)}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button className="a-btn a-btn-primary" style={aStyle('ipb')} onClick={() => setModal({})}><AIcon n="plus" size={16} />Ajouter un cours</button>
      </div>
      {cours.length === 0 ? <Empty icon="cap" title="Aucun cours" /> : (
        <Panel accent="ipb" pad={false}>
          <table className="a-tbl">
            <thead><tr><th>Code</th><th>Cours</th><th>Professeur</th><th>Modules</th><th></th></tr></thead>
            <tbody>
              {cours.map(c => (
                <tr key={c.id}>
                  <td style={{ width: 80 }}><span className="a-codepill">{c.code}</span></td>
                  <td><div className="a-tprime">{c.titre}</div></td>
                  <td><span style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 600 }}>{c.prof || '—'}</span></td>
                  <td style={{ width: 90 }}><span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-3)' }}>{c.modules}</span></td>
                  <td style={{ width: 96 }}>
                    <div className="a-tact">
                      <button className="a-iact" onClick={() => setModal({ edit: c })}><AIcon n="pen" size={16} /></button>
                      <button className="a-iact del" onClick={() => setDel(c)}><AIcon n="trash" size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
      {modal && <CoursModal edit={modal.edit} onClose={() => setModal(null)} onSave={save} />}
      {del && (
        <Modal accent="ipb" icon="trash" title="Supprimer le cours ?" onClose={() => setDel(null)}
          footer={<><button className="a-btn a-btn-ghost" onClick={() => setDel(null)}>Annuler</button><button className="a-btn a-btn-danger" onClick={remove}><AIcon n="trash" size={16} />Supprimer</button></>}>
          <p style={{ margin: 0, fontSize: 14.5, color: 'var(--ink-2)' }}><b style={{ color: 'var(--ink)' }}>{del.code} — {del.titre}</b> sera supprimé.</p>
        </Modal>
      )}
    </div>
  );
}

function InscriptionsTab({ pushToast }: { pushToast: (m: string, a?: string) => void }) {
  const [items, setItems] = useState<Inscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // email vit dans auth.users → on le récupère via la fonction profils_avec_email()
        const [{ data }, { data: profils }] = await Promise.all([
          supabase.from('ipb_inscriptions')
            .select('id, created_at, statut, nom, email, profile:profiles!ipb_inscriptions_profile_id_fkey(id, nom_complet)')
            .order('created_at', { ascending: false }),
          supabase.rpc('profils_avec_email'),
        ]);
        const emailById = new Map<string, string>(
          ((profils as { id: string; email: string }[]) ?? []).map(p => [p.id, p.email]),
        );
        if (data) setItems(data.map((r: Record<string, unknown>) => {
          const profile = r.profile as { id?: string; nom_complet?: string } | null;
          // Membre connecté → infos du profil ; visiteur → infos saisies au formulaire.
          return {
            id: r.id as string,
            nom: profile?.nom_complet ?? (r.nom as string) ?? 'Inconnu',
            email: (profile?.id ? emailById.get(profile.id) : '') || (r.email as string) || '',
            date: new Date(r.created_at as string).toLocaleDateString('fr-FR'),
            statut: (r.statut as string) ?? 'en_attente',
            profile_id: profile?.id,
          };
        }));
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  // statut ∈ enum statut_inscription ('validee' | 'refusee'). À la validation,
  // setInscriptionStatut active etudiant_ipb=true sur le profil lié → accès aux cours.
  async function updateStatut(ins: Inscription, statut: 'validee' | 'refusee') {
    try {
      await setInscriptionStatut(ins.id, statut, ins.profile_id);
      setItems(items.map(it => it.id === ins.id ? { ...it, statut } : it));
      pushToast(statut === 'validee' ? 'Inscription validée — accès activé' : 'Inscription refusée', 'ipb');
    } catch { pushToast('Erreur', 'tem'); }
  }

  if (loading) return <div style={{ display: 'grid', gap: 10 }}>{[1,2,3].map(i => <div key={i} className="a-sk" style={{ height: 56, borderRadius: 10 }} />)}</div>;
  if (!items.length) return <Empty icon="cap" title="Aucune inscription" sub="Les demandes d'inscription apparaîtront ici." />;

  const TONE: Record<string, 'amber' | 'green' | 'red'> = { en_attente: 'amber', validee: 'green', refusee: 'red' };
  const LABEL: Record<string, string> = { en_attente: 'En attente', validee: 'Validée', refusee: 'Refusée' };

  return (
    <Panel accent="ipb" pad={false}>
      <table className="a-tbl">
        <thead><tr><th>Candidat</th><th>Email</th><th>Date</th><th>Statut</th><th></th></tr></thead>
        <tbody>
          {items.map(ins => (
            <tr key={ins.id}>
              <td><div className="a-tprime">{ins.nom}</div></td>
              <td><span style={{ fontSize: 12.5, color: 'var(--ink-3)', fontWeight: 600 }}>{ins.email}</span></td>
              <td style={{ width: 120 }}><span style={{ fontSize: 12.5, color: 'var(--ink-3)', fontWeight: 600 }}>{ins.date}</span></td>
              <td style={{ width: 120 }}><Badge tone={TONE[ins.statut] ?? 'neutral'} dot>{LABEL[ins.statut] ?? ins.statut}</Badge></td>
              <td style={{ width: 160 }}>
                {ins.statut === 'en_attente' && (
                  <div className="a-tact">
                    <button className="a-btn a-btn-ghost a-btn-sm" style={{ color: '#16a34a' }} onClick={() => updateStatut(ins, 'validee')}><AIcon n="check" size={14} />Valider</button>
                    <button className="a-btn a-btn-danger a-btn-sm" onClick={() => updateStatut(ins, 'refusee')}><AIcon n="x" size={14} />Refuser</button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

export default function PageIPB() {
  const [tab, setTab] = useState('vitrine');
  const [toasts, pushToast] = useToasts();

  return (
    <div className="a-page wide a-pagefade" style={aStyle('ipb')}>
      <PageHead accent="ipb" icon="cap"
        eyebrow={<><span style={{ width: 8, height: 8, borderRadius: 9, background: 'var(--c)' }} />Module IPB</>}
        title="Institut Protestant de la Bible" sub="Gérez la vitrine, les cours et les inscriptions de l'IPB." />

      <div style={{ marginBottom: 24 }}>
        <Seg active={tab} onPick={setTab} tabs={[
          { v: 'vitrine', l: 'Vitrine', icon: 'shield' },
          { v: 'cours', l: 'Cours', icon: 'cap' },
          { v: 'inscriptions', l: 'Inscriptions', icon: 'pen' },
        ]} />
      </div>

      {tab === 'vitrine' && <VitrineTab pushToast={pushToast} />}
      {tab === 'cours' && <CoursTab pushToast={pushToast} />}
      {tab === 'inscriptions' && <InscriptionsTab pushToast={pushToast} />}

      <ToastHost toasts={toasts} />
    </div>
  );
}
