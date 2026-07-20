'use client';
import React, { useEffect, useState } from 'react';
import AIcon from '@/components/admin/icon';
import { PageHead, Panel, Modal, Field, Input, Textarea, MediaPicker, Badge, Reveal, Empty, Spinner, StatBand, Toolbar, SearchInput, DateRange, inDateRange, aStyle, useToasts, ToastHost } from '@/components/admin/ui';
import { getSortiesAdmin, createSortie, updateSortie, deleteSortie, upsertRapportSortie } from '@/lib/admin-queries';
import { uploadPhotos } from '@/lib/storage';
import type { Sortie } from '@/lib/types';

type SortieForm = { id?: string; titre: string; theme: string; date: string; heure: string; equipe: string; programme: string; photos: string[]; files: File[] };
type RapportForm = { resume: string; contacts: string; decisions: string; equipe: string; temoignages: string };

const SORTIE_THEMES = ['Évangélisme de rue', 'Distribution de bibles', 'Visite à domicile', 'Campus', 'Prison', 'Hôpital'];

function SortieModal({ edit, onClose, onSave }: { edit?: Sortie; onClose: () => void; onSave: (f: SortieForm) => void }) {
  const [f, setF] = useState<SortieForm>({
    id: edit?.id, titre: edit?.titre ?? '', theme: edit?.theme ?? '',
    date: edit?.date ?? '', heure: edit?.heure ?? '', equipe: edit?.equipe ? String(edit.equipe) : '', programme: '',
    photos: edit?.photos ?? [], files: [],
  });
  const [busy, setBusy] = useState(false);
  const ok = f.titre && f.date;
  function submit() { if (!ok) return; setBusy(true); onSave(f); }
  return (
    <Modal accent="eva" icon="compass" wide title={edit ? 'Modifier la sortie' : 'Planifier une sortie'} onClose={onClose}
      footer={<><button className="a-btn a-btn-ghost" onClick={onClose}>Annuler</button><button className="a-btn a-btn-primary" disabled={!ok || busy} onClick={submit}>{busy ? <><Spinner />…</> : <><AIcon n="check" size={17} />{edit ? 'Enregistrer' : 'Planifier'}</>}</button></>}>
      <div className="a-form">
        <Field label="Nom de la sortie"><Input value={f.titre} onChange={e => setF({ ...f, titre: e.target.value })} placeholder="Marché Central – Juin 2026" /></Field>
        <div className="a-frow">
          <Field label="Thème" icon="flame" hint="Choisissez-en un ou saisissez le vôtre.">
            <Input list="sortie-themes" value={f.theme} onChange={e => setF({ ...f, theme: e.target.value })} placeholder="Thème de la sortie" />
            <datalist id="sortie-themes">{SORTIE_THEMES.map(t => <option key={t} value={t} />)}</datalist>
          </Field>
          <Field label="Équipe (nb)"><Input value={f.equipe} onChange={e => setF({ ...f, equipe: e.target.value })} placeholder="12" /></Field>
        </div>
        <div className="a-frow">
          <Field label="Date" icon="calendar"><Input type="date" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></Field>
          <Field label="Heure"><Input value={f.heure} onChange={e => setF({ ...f, heure: e.target.value })} placeholder="09h00" /></Field>
        </div>
        <Field label="Programme / Description" opt="optionnel">
          <Textarea value={f.programme} onChange={e => setF({ ...f, programme: e.target.value })} rows={3} placeholder="Plan de la sortie, point de rendez-vous…" />
        </Field>
        <Field label="Photos" opt="optionnel">
          <MediaPicker urls={f.photos} files={f.files} onUrls={u => setF({ ...f, photos: u })} onFiles={x => setF({ ...f, files: x })} />
        </Field>
      </div>
    </Modal>
  );
}

function RapportModal({ sortie, onClose, onSave }: { sortie: Sortie; onClose: () => void; onSave: (f: RapportForm) => void }) {
  const [f, setF] = useState<RapportForm>({ resume: '', contacts: '', decisions: '', equipe: sortie.equipe ? String(sortie.equipe) : '', temoignages: '' });
  const [busy, setBusy] = useState(false);
  const ok = f.resume;
  function submit() { if (!ok) return; setBusy(true); onSave(f); }
  return (
    <Modal accent="eva" icon="send" wide title={`Rapport — ${sortie.titre}`} onClose={onClose}
      footer={<><button className="a-btn a-btn-ghost" onClick={onClose}>Annuler</button><button className="a-btn a-btn-primary" disabled={!ok || busy} onClick={submit}>{busy ? <><Spinner />…</> : <><AIcon n="check" size={17} />Enregistrer le rapport</>}</button></>}>
      <div className="a-form">
        <div className="a-frow three">
          <Field label="Personnes contactées"><Input value={f.contacts} onChange={e => setF({ ...f, contacts: e.target.value })} placeholder="47" /></Field>
          <Field label="Décisions de foi"><Input value={f.decisions} onChange={e => setF({ ...f, decisions: e.target.value })} placeholder="3" /></Field>
          <Field label="Taille équipe réelle"><Input value={f.equipe} onChange={e => setF({ ...f, equipe: e.target.value })} placeholder="12" /></Field>
        </div>
        <Field label="Témoignages reçus" opt="optionnel">
          <Textarea value={f.temoignages} onChange={e => setF({ ...f, temoignages: e.target.value })} rows={2} placeholder="Bibles acceptées, prières, histoires…" />
        </Field>
        <Field label="Compte-rendu">
          <Textarea value={f.resume} onChange={e => setF({ ...f, resume: e.target.value })} rows={4} placeholder="Déroulement, bénédictions, difficultés…" />
        </Field>
      </div>
    </Modal>
  );
}

const STATUT_TONE: Record<string, 'green' | 'amber' | 'red' | 'neutral' | 'blue'> = {
  a_venir: 'blue', en_cours: 'amber', passee: 'green', annulee: 'red',
};
const STATUT_LABEL: Record<string, string> = {
  a_venir: 'À venir', en_cours: 'En cours', passee: 'Passée', annulee: 'Annulée',
};

export default function PageEvangelisation() {
  const [items, setItems] = useState<Sortie[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ edit?: Sortie } | null>(null);
  const [rapport, setRapport] = useState<Sortie | null>(null);
  const [del, setDel] = useState<Sortie | null>(null);
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [toasts, pushToast] = useToasts();

  useEffect(() => { getSortiesAdmin().then(s => { setItems(s); setLoading(false); }).catch(() => setLoading(false)); }, []);

  async function saveSortie(f: SortieForm) {
    try {
      const uploaded = f.files.length ? await uploadPhotos(f.files, 'evangelisation') : [];
      const photos = [...f.photos, ...uploaded];
      const data = { titre: f.titre, date: f.date, heure: f.heure, equipe: f.equipe ? Number(f.equipe) : undefined, theme: f.theme, programme: f.programme, photos };
      if (f.id) {
        await updateSortie(f.id, data);
        setItems(items.map(it => it.id === f.id ? { ...it, titre: f.titre, date: f.date, heure: f.heure, equipe: data.equipe ?? 0, theme: f.theme, photos } : it));
        pushToast('Sortie mise à jour', 'eva');
      } else {
        await createSortie(data);
        const n: Sortie = { id: 'tmp-' + Date.now(), titre: f.titre, date: f.date, heure: f.heure, equipe: data.equipe ?? 0, theme: f.theme, statut: 'a_venir', contacts: 0, decisions: 0, full: f.programme, photos };
        setItems([n, ...items]);
        pushToast('Sortie planifiée', 'eva');
      }
    } catch { pushToast('Erreur lors de l\'enregistrement', 'tem'); }
    setModal(null);
  }

  async function saveRapport(f: RapportForm) {
    if (!rapport) return;
    try {
      await upsertRapportSortie(rapport.id, { resume: f.resume, contacts: f.contacts ? Number(f.contacts) : undefined, decisions: f.decisions ? Number(f.decisions) : undefined, equipe: f.equipe ? Number(f.equipe) : undefined, temoignages: f.temoignages });
      setItems(items.map(it => it.id === rapport.id ? { ...it, statut: 'passee', contacts: Number(f.contacts) || 0, decisions: Number(f.decisions) || 0 } : it));
      pushToast('Rapport enregistré', 'eva');
    } catch { pushToast('Erreur', 'tem'); }
    setRapport(null);
  }

  async function remove() {
    if (!del) return;
    try { await deleteSortie(del.id); setItems(items.filter(it => it.id !== del.id)); pushToast('Sortie supprimée', 'eva'); }
    catch { pushToast('Erreur', 'tem'); }
    setDel(null);
  }

  const totalDecisions = items.reduce((a, s) => a + (s.decisions ?? 0), 0);

  const term = q.trim().toLowerCase();
  const shown = items.filter(s =>
    (!term || s.titre.toLowerCase().includes(term) || s.theme.toLowerCase().includes(term)) &&
    inDateRange(s.date, from, to)
  );

  return (
    <div className="a-page wide a-pagefade" style={aStyle('eva')}>
      <PageHead accent="eva" icon="compass"
        eyebrow={<><span style={{ width: 8, height: 8, borderRadius: 9, background: 'var(--c)' }} />Module Évangélisation</>}
        title="Évangélisation" sub="Planification et suivi des sorties évangéliques.">
        <button className="a-btn a-btn-primary" onClick={() => setModal({})}><AIcon n="plus" size={17} />Planifier une sortie</button>
      </PageHead>

      <StatBand accent="eva" stats={[
        { l: 'Total sorties', v: items.length, i: 'compass' },
        { l: 'Passées', v: items.filter(s => s.statut === 'passee').length, i: 'check' },
        { l: 'À venir', v: items.filter(s => s.statut === 'a_venir' || s.statut === 'en_cours').length, i: 'calendar' },
        { l: 'Décisions de foi', v: totalDecisions, i: 'flame' },
      ]} />

      <Toolbar>
        <SearchInput value={q} onChange={setQ} placeholder="Rechercher une sortie, un thème…" />
        <DateRange from={from} to={to} onFrom={setFrom} onTo={setTo} />
      </Toolbar>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="a-sk" style={{ height: 180, borderRadius: 16 }} />)}
        </div>
      ) : items.length === 0 ? (
        <Empty icon="compass" title="Aucune sortie" sub="Planifiez la première sortie évangélique." />
      ) : shown.length === 0 ? (
        <Empty icon="search" title="Aucun résultat" sub="Aucune sortie ne correspond à cette recherche ou à cette période." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
          {shown.map((s, i) => (
            <Reveal key={s.id} delay={i * 40} className="a-card" style={{ ...aStyle('eva'), padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--c-t)', color: 'var(--c-i)', display: 'grid', placeItems: 'center', flex: '0 0 auto', marginTop: 2 }}>
                    <AIcon n="compass" size={16} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14.5 }}>{s.titre}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-3)', marginTop: 2 }}>
                      {s.date}{s.heure ? ` · ${s.heure}` : ''}
                      {s.theme ? ` · ${s.theme}` : ''}
                    </div>
                  </div>
                  <Badge tone={STATUT_TONE[s.statut] ?? 'neutral'} dot>{STATUT_LABEL[s.statut] ?? s.statut}</Badge>
                </div>
                {s.full && <p style={{ margin: '10px 0 0', fontSize: 13, lineHeight: 1.55, color: 'var(--ink-2)' }}>{s.full}</p>}
              </div>
              <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
                {s.equipe > 0 && <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', flex: 1 }}><AIcon n="group" size={13} /> {s.equipe} membres</span>}
                <Badge tone="blue" icon="users">{s.participants ?? 0} inscrit{(s.participants ?? 0) > 1 ? 's' : ''}</Badge>
                {(s.contacts ?? 0) > 0 && <Badge tone="blue">{s.contacts} contacts</Badge>}
                {(s.decisions ?? 0) > 0 && <Badge tone="green" dot>{s.decisions} décisions</Badge>}
                {s.statut === 'passee' && !s.contacts && (
                  <button className="a-btn a-btn-ghost a-btn-sm" style={aStyle('eva')} onClick={() => setRapport(s)}>
                    <AIcon n="send" size={14} />Rapport
                  </button>
                )}
                <button className="a-iact" style={{ marginLeft: 'auto' }} onClick={() => setModal({ edit: s })}><AIcon n="pen" size={15} /></button>
                <button className="a-iact del" onClick={() => setDel(s)}><AIcon n="trash" size={15} /></button>
              </div>
            </Reveal>
          ))}
        </div>
      )}

      {modal && <SortieModal edit={modal.edit} onClose={() => setModal(null)} onSave={saveSortie} />}
      {rapport && <RapportModal sortie={rapport} onClose={() => setRapport(null)} onSave={saveRapport} />}
      {del && (
        <Modal accent="eva" icon="trash" title="Supprimer la sortie ?" onClose={() => setDel(null)}
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
