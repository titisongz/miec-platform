'use client';
import React, { useEffect, useState } from 'react';
import AIcon from '@/components/admin/icon';
import { PageHead, Panel, Modal, Field, Input, Textarea, Select, Badge, Empty, Spinner, aStyle, useToasts, ToastHost } from '@/components/admin/ui';
import { supabase } from '@/lib/supabase';

type NLForm = { sujet: string; intro: string; corps: string; section: string; cta_label: string; cta_url: string };
type NLEnvoi = { id: string; sujet: string; date: string; statut: string; destinataires: number };

function EmailPreview({ f }: { f: NLForm }) {
  return (
    <div style={{ background: '#f1f5f9', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,.06)' }}>
        <div style={{ background: 'linear-gradient(135deg, #1B1E25 0%, #232731 100%)', padding: '28px 28px 24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ width: 28, height: 28, borderRadius: 7, background: '#C9A227', display: 'grid', placeItems: 'center' }}>
              <AIcon n="send" size={13} style={{ color: '#1B1E25' }} />
            </span>
            <span style={{ fontWeight: 800, fontSize: 13, color: '#fff', letterSpacing: '.03em' }}>MIEC Newsletter</span>
          </div>
          <div style={{ fontWeight: 800, fontSize: 20, color: '#fff', lineHeight: 1.25 }}>{f.sujet || 'Objet de la newsletter'}</div>
        </div>
        <div style={{ padding: '22px 28px' }}>
          {f.section && (
            <div style={{ display: 'inline-flex', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#7c3aed', background: '#f5f3ff', padding: '3px 10px', borderRadius: 6, marginBottom: 12 }}>
              {f.section}
            </div>
          )}
          {f.intro && <p style={{ fontSize: 15, lineHeight: 1.6, color: '#374151', fontWeight: 600, marginBottom: 14, marginTop: 0 }}>{f.intro}</p>}
          {f.corps && <p style={{ fontSize: 14, lineHeight: 1.7, color: '#6b7280', marginBottom: 20, marginTop: 0 }}>{f.corps}</p>}
          {f.cta_label && (
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <span style={{ display: 'inline-block', background: '#1B1E25', color: '#fff', fontWeight: 700, fontSize: 13.5, padding: '11px 24px', borderRadius: 10 }}>
                {f.cta_label}
              </span>
            </div>
          )}
        </div>
        <div style={{ borderTop: '1px solid #f1f5f9', padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>MIEC · Communauté Chrétienne</span>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>Se désabonner</span>
        </div>
      </div>
    </div>
  );
}

export default function PageNewsletter() {
  const [f, setF] = useState<NLForm>({ sujet: '', intro: '', corps: '', section: '', cta_label: '', cta_url: '' });
  const [activeView, setActiveView] = useState<'edit' | 'preview'>('edit');
  const [historique, setHistorique] = useState<NLEnvoi[]>([]);
  const [loadingHist, setLoadingHist] = useState(true);
  const [sending, setSending] = useState(false);
  const [toasts, pushToast] = useToasts();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from('newsletters')
          .select('id, sujet, created_at, statut, destinataires')
          .order('created_at', { ascending: false })
          .limit(20);
        if (data) setHistorique(data.map((n: Record<string, unknown>) => ({
          id: n.id as string,
          sujet: n.sujet as string,
          date: new Date(n.created_at as string).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
          statut: (n.statut as string) ?? 'envoyee',
          destinataires: (n.destinataires as number) ?? 0,
        })));
      } catch { /* ignore */ }
      setLoadingHist(false);
    })();
  }, []);

  async function send() {
    if (!f.sujet || !f.corps) return;
    setSending(true);
    try {
      const { error } = await supabase.from('newsletters').insert({
        sujet: f.sujet, intro: f.intro || null, corps: f.corps,
        section: f.section || null, cta_label: f.cta_label || null, cta_url: f.cta_url || null,
        statut: 'envoyee',
      });
      if (error) throw error;
      const n: NLEnvoi = { id: 'tmp-' + Date.now(), sujet: f.sujet, date: "à l'instant", statut: 'envoyee', destinataires: 0 };
      setHistorique([n, ...historique]);
      setF({ sujet: '', intro: '', corps: '', section: '', cta_label: '', cta_url: '' });
      pushToast('Newsletter envoyée', 'ipb');
    } catch { pushToast('Erreur lors de l\'envoi', 'tem'); }
    setSending(false);
  }

  const canSend = f.sujet.trim().length > 0 && f.corps.trim().length > 0;

  return (
    <div className="a-page wide a-pagefade" style={aStyle('ipb')}>
      <PageHead accent="ipb" icon="send"
        eyebrow={<><span style={{ width: 8, height: 8, borderRadius: 9, background: 'var(--c)' }} />Communications</>}
        title="Newsletter" sub="Rédigez et envoyez un email à tous les abonnés de la communauté.">
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={'a-btn ' + (activeView === 'edit' ? 'a-btn-primary' : 'a-btn-ghost')} onClick={() => setActiveView('edit')}>
            <AIcon n="pen" size={15} />Éditer
          </button>
          <button className={'a-btn ' + (activeView === 'preview' ? 'a-btn-primary' : 'a-btn-ghost')} onClick={() => setActiveView('preview')}>
            <AIcon n="eye" size={15} />Aperçu
          </button>
        </div>
      </PageHead>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        <div>
          {activeView === 'edit' ? (
            <div className="a-card" style={{ ...aStyle('ipb'), padding: 24 }}>
              <div className="a-form">
                <Field label="Objet de l'email" icon="send">
                  <Input value={f.sujet} onChange={e => setF({ ...f, sujet: e.target.value })} placeholder="Bonne nouvelle — culte spécial ce dimanche" />
                </Field>
                <div className="a-frow">
                  <Field label="Section / Catégorie" opt="optionnel">
                    <Select value={f.section} onChange={e => setF({ ...f, section: e.target.value })}>
                      {['', 'Vie de l\'Église', 'Enseignement', 'Témoignage', 'Événement', 'IPB', 'Mission'].map(s => <option key={s} value={s}>{s || 'Aucune'}</option>)}
                    </Select>
                  </Field>
                </div>
                <Field label="Introduction" opt="optionnelle" icon="quote">
                  <Textarea value={f.intro} onChange={e => setF({ ...f, intro: e.target.value })} rows={2} placeholder="Phrase d'accroche en gras…" />
                </Field>
                <Field label="Corps du message">
                  <Textarea value={f.corps} onChange={e => setF({ ...f, corps: e.target.value })} rows={6} placeholder="Contenu principal de la newsletter…" />
                </Field>
                <div className="a-frow">
                  <Field label="Bouton CTA" opt="optionnel">
                    <Input value={f.cta_label} onChange={e => setF({ ...f, cta_label: e.target.value })} placeholder="Regarder la prédication" />
                  </Field>
                  <Field label="Lien CTA" opt="optionnel" icon="link">
                    <Input value={f.cta_url} onChange={e => setF({ ...f, cta_url: e.target.value })} placeholder="https://…" />
                  </Field>
                </div>
              </div>
            </div>
          ) : (
            <EmailPreview f={f} />
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
            <button className="a-btn a-btn-primary" disabled={!canSend || sending} onClick={send} style={{ minWidth: 180 }}>
              {sending ? <><Spinner />Envoi en cours…</> : <><AIcon n="send" size={17} />Envoyer la newsletter</>}
            </button>
          </div>
        </div>

        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink-2)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AIcon n="history" size={15} />Historique des envois
          </div>
          {loadingHist ? (
            <div style={{ display: 'grid', gap: 8 }}>{[1,2,3].map(i => <div key={i} className="a-sk" style={{ height: 54, borderRadius: 10 }} />)}</div>
          ) : historique.length === 0 ? (
            <Empty icon="send" title="Aucune newsletter envoyée" />
          ) : (
            <Panel accent="ipb" pad={false}>
              <table className="a-tbl">
                <thead><tr><th></th><th>Objet</th><th>Date</th><th>Statut</th></tr></thead>
                <tbody>
                  {historique.map(n => (
                    <tr key={n.id}>
                      <td style={{ width: 40 }}><span className="a-rowico"><AIcon n="send" size={15} /></span></td>
                      <td><div className="a-tprime">{n.sujet}</div></td>
                      <td style={{ width: 160 }}><span style={{ fontSize: 12.5, color: 'var(--ink-3)', fontWeight: 600 }}>{n.date}</span></td>
                      <td style={{ width: 100 }}><Badge tone="green" dot>Envoyée</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          )}
        </div>
      </div>

      <ToastHost toasts={toasts} />
    </div>
  );
}
