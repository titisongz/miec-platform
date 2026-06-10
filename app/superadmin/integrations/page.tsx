'use client';
import React, { useState } from 'react';
import AIcon from '@/components/admin/icon';
import { logAction } from '@/lib/admin-queries';

function useToasts() {
  const [toasts, setToasts] = useState<{ id: number; msg: string; out?: boolean }[]>([]);
  function push(msg: string) {
    const id = Date.now();
    setToasts(t => [...t, { id, msg }]);
    setTimeout(() => setToasts(t => t.map(x => x.id === id ? { ...x, out: true } : x)), 3200);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }
  return [toasts, push] as const;
}

function MaskedInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input className="sa-in" type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ paddingRight: 40 }} />
      <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)', background: 'none', border: 'none', cursor: 'pointer' }}>
        <AIcon n={show ? 'eyeoff' : 'eye'} size={15} />
      </button>
    </div>
  );
}

function IntCard({ icon, iconBg, iconColor, name, sub, status, children }: {
  icon: string; iconBg: string; iconColor: string;
  name: string; sub: string; status: 'ok' | 'warn' | 'off';
  children: React.ReactNode;
}) {
  const statusColors = { ok: '#22c55e', warn: '#f59e0b', off: '#9ca3af' };
  const statusLabel = { ok: 'Configuré', warn: 'Attention', off: 'Non configuré' };
  return (
    <div className="sa-int">
      <div className="sa-int-head">
        <span className="ii" style={{ background: iconBg, color: iconColor }}><AIcon n={icon} size={20} /></span>
        <div>
          <div className="it">{name}</div>
          <div className="is">{sub}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColors[status], boxShadow: status === 'ok' ? `0 0 6px ${statusColors.ok}66` : 'none' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: statusColors[status] }}>{statusLabel[status]}</span>
        </div>
      </div>
      <div className="sa-int-body">{children}</div>
    </div>
  );
}

export default function PageIntegrations() {
  const [resend, setResend] = useState({ apiKey: '', fromEmail: '', fromName: 'MIEC' });
  const [whatsapp, setWhatsapp] = useState({ accountSid: '', authToken: '', from: '' });
  const [cloudflare, setCloudflare] = useState({ accountId: '', apiToken: '', bucket: '', domain: '' });
  const [saving, setSaving] = useState('');
  const [testing, setTesting] = useState('');
  const [toasts, push] = useToasts();

  async function saveResend() {
    setSaving('resend');
    try {
      await logAction('integration_update', 'Resend', 'Configuration email mise à jour');
      push('Configuration Resend enregistrée');
    } catch { push('Erreur'); }
    setSaving('');
  }

  async function testResend() {
    setTesting('resend');
    await new Promise(r => setTimeout(r, 1200));
    push('Email de test envoyé (démo)');
    setTesting('');
  }

  async function saveWhatsApp() {
    setSaving('whatsapp');
    try {
      await logAction('integration_update', 'WhatsApp', 'Configuration Twilio mise à jour');
      push('Configuration WhatsApp enregistrée');
    } catch { push('Erreur'); }
    setSaving('');
  }

  async function saveCloudflare() {
    setSaving('cloudflare');
    try {
      await logAction('integration_update', 'Cloudflare R2', 'Configuration stockage mise à jour');
      push('Configuration Cloudflare enregistrée');
    } catch { push('Erreur'); }
    setSaving('');
  }

  return (
    <div className="sa-page wide sa-pagefade">
      <div className="sa-pagehead">
        <div className="phi"><AIcon n="link" size={22} /></div>
        <div className="phd">
          <div className="phey"><span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--sa-red)' }} />Services externes</div>
          <h1>Intégrations</h1>
          <p className="sub">Configurez les services tiers — email transactionnel, notifications WhatsApp, stockage Cloudflare.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Resend */}
        <IntCard icon="send" iconBg="#F0FDF4" iconColor="#16a34a" name="Resend" sub="Emails transactionnels — newsletter, notifications, invitations"
          status={resend.apiKey ? 'ok' : 'off'}>
          <div className="sa-form">
            <div className="sa-frow">
              <div className="sa-fld">
                <span className="lab">Clé API Resend</span>
                <MaskedInput value={resend.apiKey} onChange={v => setResend({ ...resend, apiKey: v })} placeholder="re_xxxxxxxxxxxx" />
              </div>
            </div>
            <div className="sa-frow">
              <div className="sa-fld">
                <span className="lab">Email expéditeur</span>
                <input className="sa-in" type="email" value={resend.fromEmail} onChange={e => setResend({ ...resend, fromEmail: e.target.value })} placeholder="noreply@miec.cm" />
              </div>
              <div className="sa-fld">
                <span className="lab">Nom expéditeur</span>
                <input className="sa-in" value={resend.fromName} onChange={e => setResend({ ...resend, fromName: e.target.value })} placeholder="MIEC Communauté" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="sa-btn sa-btn-ghost" disabled={testing === 'resend' || !resend.apiKey} onClick={testResend}>
                {testing === 'resend' ? <><span className="sa-spin" />Test…</> : <><AIcon n="send" size={15} />Envoyer un test</>}
              </button>
              <button className="sa-btn sa-btn-primary" disabled={saving === 'resend'} onClick={saveResend}>
                {saving === 'resend' ? <><span className="sa-spin" />Enregistrement…</> : <><AIcon n="check" size={15} />Enregistrer</>}
              </button>
            </div>
          </div>
        </IntCard>

        {/* WhatsApp */}
        <IntCard icon="mega" iconBg="#F0FFF4" iconColor="#059669" name="WhatsApp Business" sub="Notifications push via Twilio WABA — rappels de culte, alertes"
          status={whatsapp.accountSid ? 'ok' : 'off'}>
          <div className="sa-form">
            <div className="sa-frow">
              <div className="sa-fld">
                <span className="lab">Account SID (Twilio)</span>
                <MaskedInput value={whatsapp.accountSid} onChange={v => setWhatsapp({ ...whatsapp, accountSid: v })} placeholder="ACxxxxxxxxxxxxxxxx" />
              </div>
              <div className="sa-fld">
                <span className="lab">Auth Token</span>
                <MaskedInput value={whatsapp.authToken} onChange={v => setWhatsapp({ ...whatsapp, authToken: v })} placeholder="Token Twilio" />
              </div>
            </div>
            <div className="sa-fld">
              <span className="lab">Numéro WhatsApp Business</span>
              <input className="sa-in" value={whatsapp.from} onChange={e => setWhatsapp({ ...whatsapp, from: e.target.value })} placeholder="+237600000000" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="sa-btn sa-btn-primary" disabled={saving === 'whatsapp'} onClick={saveWhatsApp}>
                {saving === 'whatsapp' ? <><span className="sa-spin" />Enregistrement…</> : <><AIcon n="check" size={15} />Enregistrer</>}
              </button>
            </div>
          </div>
        </IntCard>

        {/* Cloudflare R2 */}
        <IntCard icon="folder" iconBg="#FFF7ED" iconColor="#C2530E" name="Cloudflare R2" sub="Stockage des fichiers — ressources, images, documents IPB"
          status={cloudflare.apiToken ? 'ok' : 'off'}>
          <div className="sa-form">
            <div className="sa-frow">
              <div className="sa-fld">
                <span className="lab">Account ID</span>
                <input className="sa-in" value={cloudflare.accountId} onChange={e => setCloudflare({ ...cloudflare, accountId: e.target.value })} placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
              </div>
              <div className="sa-fld">
                <span className="lab">API Token</span>
                <MaskedInput value={cloudflare.apiToken} onChange={v => setCloudflare({ ...cloudflare, apiToken: v })} placeholder="Token R2" />
              </div>
            </div>
            <div className="sa-frow">
              <div className="sa-fld">
                <span className="lab">Nom du bucket</span>
                <input className="sa-in" value={cloudflare.bucket} onChange={e => setCloudflare({ ...cloudflare, bucket: e.target.value })} placeholder="miec-files" />
              </div>
              <div className="sa-fld">
                <span className="lab">Domaine public</span>
                <input className="sa-in" value={cloudflare.domain} onChange={e => setCloudflare({ ...cloudflare, domain: e.target.value })} placeholder="files.miec.cm" />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="sa-btn sa-btn-primary" disabled={saving === 'cloudflare'} onClick={saveCloudflare}>
                {saving === 'cloudflare' ? <><span className="sa-spin" />Enregistrement…</> : <><AIcon n="check" size={15} />Enregistrer</>}
              </button>
            </div>
          </div>
        </IntCard>

      </div>

      <div className="sa-toast-host">
        {toasts.map(t => (
          <div key={t.id} className={`sa-toast${t.out ? ' out' : ''}`}>
            <AIcon n="check" size={16} style={{ color: 'var(--sa-red)' }} />{t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
