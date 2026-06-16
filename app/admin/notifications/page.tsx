'use client';
import React, { useEffect, useState } from 'react';
import AIcon from '@/components/admin/icon';
import { PageHead, Panel, Field, Input, Textarea, Select, Badge, Reveal, Empty, aStyle, useToasts, ToastHost } from '@/components/admin/ui';
import { supabase } from '@/lib/supabase';
import { notifyBroadcast } from '@/lib/notifications';

// Module admin → type de notification (pilote l'icône côté membre).
const MODULE_TYPE: Record<string, string> = {
  Enseignements: 'enseignement', Témoignages: 'temoignage', Annonces: 'annonce',
  Prière: 'priere', Évangélisation: 'evangelisation', IPB: 'inscription_ipb',
};

type NotifForm = { titre: string; corps: string; module: string; url: string };
type NotifHistorique = { id: string; titre: string; corps: string; module: string; date: string; statut: string };

const MODULES = ['', 'Enseignements', 'Témoignages', 'Annonces', 'Prière', 'Ressources', 'Librairie', 'Évangélisation', 'IPB', 'Général'];
const MODULE_ICONS: Record<string, string> = {
  Enseignements: 'book', Témoignages: 'quote', Annonces: 'mega', Prière: 'flame',
  Ressources: 'folder', Librairie: 'books', Évangélisation: 'compass', IPB: 'cap',
  Général: 'bell', '': 'bell',
};

function PhonePreview({ titre, corps, module }: { titre: string; corps: string; module: string }) {
  return (
    <div style={{ width: 260, background: '#0f0f10', borderRadius: 38, padding: '40px 12px 32px', boxShadow: '0 30px 80px rgba(0,0,0,.35)', border: '2px solid #2a2a2d', position: 'relative', margin: '0 auto' }}>
      <div style={{ position: 'absolute', top: 18, left: '50%', transform: 'translateX(-50%)', width: 100, height: 24, background: '#1a1a1c', borderRadius: 12 }} />
      <div style={{ background: '#1c1c1e', borderRadius: 16, padding: '12px 14px', marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'grid', placeItems: 'center' }}>
            <AIcon n={MODULE_ICONS[module] || 'bell'} size={13} style={{ color: '#fff' }} />
          </span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', opacity: .55 }}>MIEC · À l'instant</div>
          </div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4, lineHeight: 1.3 }}>{titre || 'Titre de la notification'}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', lineHeight: 1.45 }}>{corps || 'Contenu du message…'}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16, gap: 4 }}>
        {[1,2,3].map(i => <div key={i} style={{ width: 4, height: 4, borderRadius: 2, background: i === 1 ? '#fff' : 'rgba(255,255,255,.25)' }} />)}
      </div>
    </div>
  );
}

export default function PageNotifications() {
  const [f, setF] = useState<NotifForm>({ titre: '', corps: '', module: '', url: '' });
  const [historique, setHistorique] = useState<NotifHistorique[]>([]);
  const [loadingHist, setLoadingHist] = useState(true);
  const [sending, setSending] = useState(false);
  const [toasts, pushToast] = useToasts();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from('notifications_push')
          .select('id, titre, corps, module, created_at, statut')
          .order('created_at', { ascending: false })
          .limit(20);
        if (data) setHistorique(data.map((n: Record<string, unknown>) => ({
          id: n.id as string,
          titre: n.titre as string,
          corps: n.corps as string,
          module: (n.module as string) ?? '',
          date: new Date(n.created_at as string).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
          statut: (n.statut as string) ?? 'envoyee',
        })));
      } catch { /* ignore */ }
      setLoadingHist(false);
    })();
  }, []);

  async function send() {
    if (!f.titre || !f.corps) return;
    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      // 1. Journal de la diffusion (historique back-office).
      const { error } = await supabase.from('notifications_push').insert({
        titre: f.titre, corps: f.corps, module: f.module || null, url: f.url || null,
        statut: 'envoyee', created_by: session?.user.id ?? null,
      });
      if (error) throw error;
      // 2. Distribution dans la boîte de réception de chaque membre.
      await notifyBroadcast(MODULE_TYPE[f.module] ?? 'annonce', f.titre, f.corps, f.url || undefined);
      const n: NotifHistorique = { id: 'tmp-' + Date.now(), titre: f.titre, corps: f.corps, module: f.module, date: "à l'instant", statut: 'envoyee' };
      setHistorique([n, ...historique]);
      setF({ titre: '', corps: '', module: '', url: '' });
      pushToast('Notification envoyée à tous les membres', 'ipb');
    } catch (e) {
      const msg = (e && typeof e === 'object' && 'message' in e) ? String((e as { message: unknown }).message) : String(e);
      pushToast(`Erreur : ${msg}`, 'tem');
    }
    setSending(false);
  }

  const canSend = f.titre.trim().length > 0 && f.corps.trim().length > 0;

  return (
    <div className="a-page wide a-pagefade" style={aStyle('ipb')}>
      <PageHead accent="ipb" icon="bell"
        eyebrow={<><span style={{ width: 8, height: 8, borderRadius: 9, background: 'var(--c)' }} />Communications</>}
        title="Notifications push" sub="Envoyez des notifications à tous les membres de l'application." />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="a-card" style={{ ...aStyle('ipb'), padding: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--c-t)', color: 'var(--c-i)', display: 'grid', placeItems: 'center' }}><AIcon n="pen" size={14} /></span>
              Composer un message
            </div>
            <div className="a-form">
              <div className="a-frow">
                <Field label="Module cible" opt="optionnel">
                  <Select value={f.module} onChange={e => setF({ ...f, module: e.target.value })}>
                    {MODULES.map(m => <option key={m} value={m}>{m || 'Tous les modules'}</option>)}
                  </Select>
                </Field>
                <Field label="Lien (URL deeplink)" opt="optionnel" icon="link">
                  <Input value={f.url} onChange={e => setF({ ...f, url: e.target.value })} placeholder="/enseignements/…" />
                </Field>
              </div>
              <Field label="Titre" icon="bell">
                <Input value={f.titre} onChange={e => setF({ ...f, titre: e.target.value })} placeholder="Nouveau culte en ligne disponible !" maxLength={60} />
                <span style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4, display: 'block' }}>{f.titre.length}/60</span>
              </Field>
              <Field label="Message">
                <Textarea value={f.corps} onChange={e => setF({ ...f, corps: e.target.value })} rows={4} placeholder="Découvrez la prédication du pasteur sur la foi…" maxLength={160} />
                <span style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4, display: 'block' }}>{f.corps.length}/160</span>
              </Field>
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
                <button className="a-btn a-btn-primary" disabled={!canSend || sending} onClick={send} style={{ ...aStyle('ipb'), minWidth: 160 }}>
                  {sending ? <><span className="a-spinner" style={{ borderColor: '#fff3', borderTopColor: '#fff', width: 15, height: 15 }} />Envoi…</> : <><AIcon n="send" size={17} />Envoyer à tous</>}
                </button>
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink-2)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AIcon n="history" size={15} />Historique des envois
            </div>
            {loadingHist ? (
              <div style={{ display: 'grid', gap: 8 }}>{[1,2,3].map(i => <div key={i} className="a-sk" style={{ height: 54, borderRadius: 10 }} />)}</div>
            ) : historique.length === 0 ? (
              <Empty icon="bell" title="Aucune notification envoyée" />
            ) : (
              <Panel accent="ipb" pad={false}>
                <table className="a-tbl">
                  <thead><tr><th></th><th>Notification</th><th>Module</th><th>Date</th><th>Statut</th></tr></thead>
                  <tbody>
                    {historique.map(n => (
                      <tr key={n.id}>
                        <td style={{ width: 40 }}><span className="a-rowico"><AIcon n={MODULE_ICONS[n.module] || 'bell'} size={15} /></span></td>
                        <td>
                          <div className="a-tprime">{n.titre}</div>
                          <div className="a-tsub" style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.corps}</div>
                        </td>
                        <td style={{ width: 120 }}><Badge tone="neutral">{n.module || 'Général'}</Badge></td>
                        <td style={{ width: 140 }}><span style={{ fontSize: 12.5, color: 'var(--ink-3)', fontWeight: 600 }}>{n.date}</span></td>
                        <td style={{ width: 100 }}><Badge tone="green" dot>Envoyée</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Panel>
            )}
          </div>
        </div>

        <div style={{ position: 'sticky', top: 80 }}>
          <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--ink-3)', textAlign: 'center', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '.06em' }}>Aperçu</div>
          <PhonePreview titre={f.titre} corps={f.corps} module={f.module} />
          <div style={{ marginTop: 14, textAlign: 'center' }}>
            <Badge tone="neutral" dot>{f.module || 'Général'}</Badge>
          </div>
        </div>
      </div>

      <ToastHost toasts={toasts} />
    </div>
  );
}
