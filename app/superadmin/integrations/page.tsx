'use client';
import React, { useEffect, useState } from 'react';
import AIcon from '@/components/admin/icon';
import { logAction, getParametres, updateParametre } from '@/lib/admin-queries';
import { useToasts, ToastHost, Toggle } from '@/components/superadmin/ui';

function IntCard({ icon, iconBg, iconColor, name, sub, status, children }: {
  icon: string; iconBg: string; iconColor: string;
  name: string; sub: string; status: 'ok' | 'off';
  children: React.ReactNode;
}) {
  const statusColors = { ok: '#22c55e', off: '#9ca3af' };
  const statusLabel = { ok: 'Configuré', off: 'Non configuré' };
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

// Statut de configuration uniquement — jamais la clé elle-même, qui reste
// une variable d'environnement Vercel (jamais envoyée au navigateur ni
// stockée en base). `cle` = clé dans public.parametres (cf.
// supabase/fix-parametres.sql).
const SERVICES = [
  { key: 'resend', cle: 'resend_configure', icon: 'send', iconBg: '#F0FDF4', iconColor: '#16a34a',
    name: 'Resend', sub: 'Emails transactionnels — newsletter, notifications, invitations', envHint: 'RESEND_API_KEY' },
  { key: 'whatsapp', cle: 'whatsapp_configure', icon: 'mega', iconBg: '#F0FFF4', iconColor: '#059669',
    name: 'WhatsApp Business', sub: 'Notifications push via Twilio WABA — rappels de culte, alertes', envHint: 'TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN' },
  { key: 'cloudflare', cle: 'cloudflare_configure', icon: 'folder', iconBg: '#FFF7ED', iconColor: '#C2530E',
    name: 'Cloudflare R2', sub: 'Stockage des fichiers — ressources, images, documents IPB', envHint: 'CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN' },
] as const;

export default function PageIntegrations() {
  const [statuts, setStatuts] = useState<Record<string, boolean>>({ resend: false, whatsapp: false, cloudflare: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [toasts, push] = useToasts();

  useEffect(() => {
    (async () => {
      const map = await getParametres();
      setStatuts({
        resend: map.resend_configure === 'true',
        whatsapp: map.whatsapp_configure === 'true',
        cloudflare: map.cloudflare_configure === 'true',
      });
      setLoading(false);
    })();
  }, []);

  async function save(svc: typeof SERVICES[number]) {
    setSaving(svc.key);
    try {
      await updateParametre(svc.cle, String(statuts[svc.key]));
      await logAction('integration_update', svc.name, statuts[svc.key] ? 'marqué configuré' : 'marqué non configuré');
      push(`Statut ${svc.name} enregistré`);
    } catch { push('Erreur lors de la sauvegarde'); }
    setSaving('');
  }

  // Aucune route serveur n'appelle encore Resend/Twilio/Cloudflare — un faux
  // succès simulé ici induirait en erreur. On le dit clairement plutôt que
  // de mimer un test qui ne teste rien.
  function test(svc: typeof SERVICES[number]) {
    push(`Test non implémenté pour ${svc.name} — nécessite une route API côté serveur.`);
  }

  if (loading) return <div className="sa-sk" style={{ height: 400, borderRadius: 16, maxWidth: 860 }} />;

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

      <div className="sa-danger" style={{ marginBottom: 20 }}>
        <div className="sa-danger-head">
          <span className="dico"><AIcon n="lock" size={14} /></span>
          <span className="dt">Où sont les clés API ?</span>
        </div>
        <p className="ds">
          Les clés secrètes ne transitent jamais par cette page ni par la base de données — elles se configurent
          directement dans Vercel → Settings → Environment Variables. Cette page suit seulement, pour l&apos;équipe,
          quels services ont déjà été branchés côté serveur.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {SERVICES.map(svc => (
          <IntCard key={svc.key} icon={svc.icon} iconBg={svc.iconBg} iconColor={svc.iconColor} name={svc.name} sub={svc.sub}
            status={statuts[svc.key] ? 'ok' : 'off'}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>Marquer comme configuré</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
                  Variable(s) attendue(s) côté Vercel — ex. <code>{svc.envHint}</code>
                </div>
              </div>
              <Toggle checked={statuts[svc.key]} onChange={v => setStatuts({ ...statuts, [svc.key]: v })} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="sa-btn sa-btn-ghost" onClick={() => test(svc)}>
                <AIcon n="send" size={15} />Tester la connexion
              </button>
              <button className="sa-btn sa-btn-primary" disabled={saving === svc.key} onClick={() => save(svc)}>
                {saving === svc.key ? <><span className="sa-spin" />Enregistrement…</> : <><AIcon n="check" size={15} />Enregistrer</>}
              </button>
            </div>
          </IntCard>
        ))}
      </div>

      <ToastHost toasts={toasts} />
    </div>
  );
}
