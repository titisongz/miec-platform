'use client';
import React, { useEffect, useState } from 'react';
import AIcon from '@/components/admin/icon';
import { PageHead, Panel, Modal, Field, Input, Textarea, Select, Badge, Seg, Reveal, Empty, Spinner, aStyle, useToasts, ToastHost } from '@/components/admin/ui';
import { getIPBCours, getIPBProgramme } from '@/lib/queries';
import { createIPBCours, updateIPBCours, deleteIPBCours } from '@/lib/admin-queries';
import { supabase } from '@/lib/supabase';
import type { IPBCours, IPBProgramme } from '@/lib/types';

type CoursForm = { id?: string; code: string; titre: string; niveau: string; prof: string; desc: string };
type Inscription = { id: string; nom: string; email: string; date: string; statut: string };

function CoursModal({ edit, onClose, onSave }: { edit?: IPBCours; onClose: () => void; onSave: (f: CoursForm) => void }) {
  const [f, setF] = useState<CoursForm>({
    id: edit?.id, code: edit?.code ?? '', titre: edit?.titre ?? '',
    niveau: 'N1', prof: edit?.prof ?? '', desc: '',
  });
  const [busy, setBusy] = useState(false);
  const ok = f.code && f.titre;
  function submit() { if (!ok) return; setBusy(true); onSave(f); }
  return (
    <Modal accent="ipb" icon="cap" wide title={edit ? 'Modifier le cours' : 'Ajouter un cours'} onClose={onClose}
      footer={<><button className="a-btn a-btn-ghost" onClick={onClose}>Annuler</button><button className="a-btn a-btn-primary" disabled={!ok || busy} onClick={submit}>{busy ? <><Spinner />…</> : <><AIcon n="check" size={17} />{edit ? 'Enregistrer' : 'Créer'}</>}</button></>}>
      <div className="a-form">
        <div className="a-frow">
          <Field label="Code" icon="hash"><Input value={f.code} onChange={e => setF({ ...f, code: e.target.value })} placeholder="TH101" /></Field>
          <Field label="Niveau">
            <Select value={f.niveau} onChange={e => setF({ ...f, niveau: e.target.value })}>
              {['N1', 'N2', 'N3', 'M1', 'M2'].map(n => <option key={n}>{n}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Titre du cours"><Input value={f.titre} onChange={e => setF({ ...f, titre: e.target.value })} placeholder="Introduction à la théologie systématique" /></Field>
        <Field label="Professeur" icon="user" opt="optionnel"><Input value={f.prof} onChange={e => setF({ ...f, prof: e.target.value })} placeholder="Prof. Jean-Pierre Bokwe" /></Field>
        <Field label="Description" opt="optionnelle">
          <Textarea value={f.desc} onChange={e => setF({ ...f, desc: e.target.value })} rows={3} placeholder="Présentation et objectifs pédagogiques…" />
        </Field>
      </div>
    </Modal>
  );
}

type VitrineBlock = { id: string; titre: string; contenu: string };

function VitrineTab({ pushToast }: { pushToast: (m: string, a?: string) => void }) {
  const [blocks] = useState<VitrineBlock[]>([
    { id: 'mission', titre: 'Mission', contenu: "L'Institut Protestant de la Bible forme des hommes et femmes pour le ministère pastoral, la mission et le service de l'Église locale." },
    { id: 'vision', titre: 'Vision', contenu: "Susciter une génération de serviteurs enracinés dans la Parole, équipés pour l'œuvre du ministère et rayonnants pour la gloire de Dieu." },
    { id: 'admission', titre: 'Conditions d\'admission', contenu: "Être membre actif d'une église affiliée MIEC. Avoir une recommandation pastorale. Entretien de discernement vocationnel." },
  ]);
  const [editing, setEditing] = useState<VitrineBlock | null>(null);

  return (
    <div>
      <p style={{ fontSize: 13.5, color: 'var(--ink-2)', marginBottom: 20 }}>Textes affichés sur la page vitrine de l'IPB dans l'application mobile.</p>
      <div style={{ display: 'grid', gap: 14 }}>
        {blocks.map((b, i) => (
          <Reveal key={b.id} delay={i * 60} className="a-card" style={{ ...aStyle('ipb'), padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-i)', background: 'var(--c-t)', display: 'inline-flex', padding: '2px 10px', borderRadius: 6, marginBottom: 8 }}>{b.titre}</div>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: 'var(--ink)' }}>{b.contenu}</p>
              </div>
              <button className="a-iact" onClick={() => setEditing(b)}><AIcon n="pen" size={16} /></button>
            </div>
          </Reveal>
        ))}
      </div>
      {editing && (
        <Modal accent="ipb" icon="pen" title={`Modifier — ${editing.titre}`} onClose={() => setEditing(null)}
          footer={<><button className="a-btn a-btn-ghost" onClick={() => setEditing(null)}>Annuler</button><button className="a-btn a-btn-primary" onClick={() => { pushToast('Texte enregistré (démo)', 'ipb'); setEditing(null); }}><AIcon n="check" size={17} />Enregistrer</button></>}>
          <Textarea value={editing.contenu} onChange={e => setEditing({ ...editing, contenu: e.target.value })} rows={5} />
        </Modal>
      )}
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
    const data = { code: f.code, titre: f.titre, niveau: f.niveau, prof: f.prof, desc: f.desc };
    try {
      if (f.id) {
        await updateIPBCours(f.id, data);
        setCours(cours.map(c => c.id === f.id ? { ...c, code: f.code, titre: f.titre, prof: f.prof } : c));
        pushToast('Cours mis à jour', 'ipb');
      } else {
        await createIPBCours(data);
        const n: IPBCours = { id: 'tmp-' + Date.now(), code: f.code, titre: f.titre, prof: f.prof, prog: 0, modules: 0, fait: 0, docs: [] };
        setCours([n, ...cours]);
        pushToast('Cours créé', 'ipb');
      }
    } catch { pushToast('Erreur', 'tem'); }
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
        const { data } = await supabase.from('ipb_inscriptions')
          .select('id, created_at, statut, profile:profiles(nom_complet, email)')
          .order('created_at', { ascending: false });
        if (data) setItems(data.map((r: Record<string, unknown>) => {
          const profile = r.profile as { nom_complet?: string; email?: string } | null;
          return {
            id: r.id as string,
            nom: profile?.nom_complet ?? 'Inconnu',
            email: profile?.email ?? '',
            date: new Date(r.created_at as string).toLocaleDateString('fr-FR'),
            statut: (r.statut as string) ?? 'en_attente',
          };
        }));
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  async function updateStatut(id: string, statut: string) {
    try {
      await supabase.from('ipb_inscriptions').update({ statut }).eq('id', id);
      setItems(items.map(it => it.id === id ? { ...it, statut } : it));
      pushToast(statut === 'accepte' ? 'Inscription acceptée' : 'Inscription refusée', 'ipb');
    } catch { pushToast('Erreur', 'tem'); }
  }

  if (loading) return <div style={{ display: 'grid', gap: 10 }}>{[1,2,3].map(i => <div key={i} className="a-sk" style={{ height: 56, borderRadius: 10 }} />)}</div>;
  if (!items.length) return <Empty icon="cap" title="Aucune inscription" sub="Les demandes d'inscription apparaîtront ici." />;

  const TONE: Record<string, 'amber' | 'green' | 'red'> = { en_attente: 'amber', accepte: 'green', refuse: 'red' };
  const LABEL: Record<string, string> = { en_attente: 'En attente', accepte: 'Accepté', refuse: 'Refusé' };

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
                    <button className="a-btn a-btn-ghost a-btn-sm" style={{ color: '#16a34a' }} onClick={() => updateStatut(ins.id, 'accepte')}><AIcon n="check" size={14} />Accepter</button>
                    <button className="a-btn a-btn-danger a-btn-sm" onClick={() => updateStatut(ins.id, 'refuse')}><AIcon n="x" size={14} />Refuser</button>
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
