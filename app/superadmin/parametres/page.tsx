'use client';
import React, { useEffect, useState } from 'react';
import AIcon from '@/components/admin/icon';
import { supabase } from '@/lib/supabase';
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

type Settings = {
  nom_eglise: string;
  description: string;
  email_contact: string;
  inscription_ouverte: boolean;
  moderation_auto: boolean;
  module_temoignages: boolean;
  module_priere: boolean;
  module_evangelisation: boolean;
  module_newsletter: boolean;
  mode_maintenance: boolean;
};

const DEFAULTS: Settings = {
  nom_eglise: 'MIEC — Mission Internationale d\'Évangile de Christ',
  description: 'Communauté chrétienne de Yaoundé, Cameroun.',
  email_contact: 'contact@miec.cm',
  inscription_ouverte: true,
  moderation_auto: false,
  module_temoignages: true,
  module_priere: true,
  module_evangelisation: true,
  module_newsletter: true,
  mode_maintenance: false,
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="sa-toggle">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="tk" />
    </label>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="sa-panel" style={{ marginBottom: 20 }}>
      <div className="sa-panel-head">
        <div className="phi"><AIcon n={icon} size={14} /></div>
        <div className="pht">{title}</div>
      </div>
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {children}
      </div>
    </div>
  );
}

function SettingRow({ label, sub, right }: { label: string; sub?: string; right: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 14, borderBottom: '1px solid var(--line)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{label}</div>
        {sub && <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{right}</div>
    </div>
  );
}

export default function PageParametres() {
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toasts, push] = useToasts();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from('parametres').select('cle, valeur');
        if (data) {
          const map: Record<string, string> = {};
          data.forEach((r: { cle: string; valeur: string }) => { map[r.cle] = r.valeur; });
          setS(prev => ({
            ...prev,
            nom_eglise: map.nom_eglise ?? prev.nom_eglise,
            description: map.description ?? prev.description,
            email_contact: map.email_contact ?? prev.email_contact,
            inscription_ouverte: map.inscription_ouverte !== undefined ? map.inscription_ouverte === 'true' : prev.inscription_ouverte,
            moderation_auto: map.moderation_auto !== undefined ? map.moderation_auto === 'true' : prev.moderation_auto,
            module_temoignages: map.module_temoignages !== undefined ? map.module_temoignages === 'true' : prev.module_temoignages,
            module_priere: map.module_priere !== undefined ? map.module_priere === 'true' : prev.module_priere,
            module_evangelisation: map.module_evangelisation !== undefined ? map.module_evangelisation === 'true' : prev.module_evangelisation,
            module_newsletter: map.module_newsletter !== undefined ? map.module_newsletter === 'true' : prev.module_newsletter,
            mode_maintenance: map.mode_maintenance !== undefined ? map.mode_maintenance === 'true' : prev.mode_maintenance,
          }));
        }
      } catch { /* use defaults */ }
      setLoading(false);
    })();
  }, []);

  async function save() {
    setSaving(true);
    try {
      const rows = Object.entries(s).map(([cle, valeur]) => ({ cle, valeur: String(valeur) }));
      await supabase.from('parametres').upsert(rows, { onConflict: 'cle' });
      await logAction('settings_update', 'parametres', 'Paramètres globaux mis à jour');
      push('Paramètres enregistrés');
    } catch { push('Erreur lors de la sauvegarde'); }
    setSaving(false);
  }

  if (loading) return <div className="sa-sk" style={{ height: 400, borderRadius: 16, maxWidth: 860 }} />;

  return (
    <div className="sa-page sa-pagefade">
      <div className="sa-pagehead">
        <div className="phi"><AIcon n="gear" size={22} /></div>
        <div className="phd">
          <div className="phey"><span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--sa-red)' }} />Configuration système</div>
          <h1>Paramètres globaux</h1>
          <p className="sub">Informations de l'église, modules actifs, modération et accès. Tout changement est journalisé.</p>
        </div>
        <div className="acts">
          <button className="sa-btn sa-btn-primary" disabled={saving} onClick={save}>
            {saving ? <><span className="sa-spin" />Enregistrement…</> : <><AIcon n="check" size={16} />Enregistrer</>}
          </button>
        </div>
      </div>

      <Section title="Informations de l'église" icon="shield">
        <div className="sa-fld">
          <span className="lab">Nom officiel</span>
          <input className="sa-in" value={s.nom_eglise} onChange={e => setS({ ...s, nom_eglise: e.target.value })} />
        </div>
        <div className="sa-fld">
          <span className="lab">Description courte</span>
          <textarea className="sa-ta" value={s.description} onChange={e => setS({ ...s, description: e.target.value })} rows={2} />
        </div>
        <div className="sa-fld">
          <span className="lab">Email de contact</span>
          <input className="sa-in" value={s.email_contact} onChange={e => setS({ ...s, email_contact: e.target.value })} type="email" />
        </div>
      </Section>

      <Section title="Accès et inscriptions" icon="lock">
        <SettingRow
          label="Inscriptions ouvertes"
          sub="Permet aux nouveaux visiteurs de créer un compte."
          right={<Toggle checked={s.inscription_ouverte} onChange={v => setS({ ...s, inscription_ouverte: v })} />}
        />
        <SettingRow
          label="Modération automatique"
          sub="Les témoignages soumis sont publiés directement sans validation manuelle."
          right={<Toggle checked={s.moderation_auto} onChange={v => setS({ ...s, moderation_auto: v })} />}
        />
      </Section>

      <Section title="Modules actifs" icon="gear">
        <SettingRow label="Module Témoignages" sub="Permettre aux membres de soumettre des témoignages." right={<Toggle checked={s.module_temoignages} onChange={v => setS({ ...s, module_temoignages: v })} />} />
        <SettingRow label="Module Prière" sub="Afficher le mur de prière dans l'application." right={<Toggle checked={s.module_priere} onChange={v => setS({ ...s, module_priere: v })} />} />
        <SettingRow label="Module Évangélisation" sub="Activer la section sorties évangéliques." right={<Toggle checked={s.module_evangelisation} onChange={v => setS({ ...s, module_evangelisation: v })} />} />
        <SettingRow label="Newsletter" sub="Activer le système d'envoi de newsletter aux abonnés." right={<Toggle checked={s.module_newsletter} onChange={v => setS({ ...s, module_newsletter: v })} />} />
      </Section>

      {/* Danger zone */}
      <div className="sa-danger">
        <div className="sa-danger-head">
          <span className="dico"><AIcon n="lock" size={14} /></span>
          <span className="dt">Mode maintenance</span>
        </div>
        <p className="ds">En mode maintenance, l'application mobile affiche un écran d'attente aux utilisateurs. Seuls les super admins peuvent se connecter. Activez uniquement lors d'opérations critiques.</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Toggle checked={s.mode_maintenance} onChange={v => setS({ ...s, mode_maintenance: v })} />
          <span style={{ fontWeight: 700, fontSize: 13.5, color: s.mode_maintenance ? 'var(--sa-red)' : 'var(--ink-2)' }}>
            {s.mode_maintenance ? 'Mode maintenance ACTIVÉ' : 'Mode maintenance désactivé'}
          </span>
        </div>
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
