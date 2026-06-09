'use client';
import React, { useState } from 'react';
import AIcon from '@/components/admin/icon';
import { PageHead, Panel, Field, Input, Textarea, Spinner, aStyle, useToasts, ToastHost } from '@/components/admin/ui';
import { upsertVerset } from '@/lib/admin-queries';

export default function PageVerset() {
  const [v, setV] = useState({
    texte: "Car c'est par la grâce que vous êtes sauvés, par le moyen de la foi.",
    ref: 'Éphésiens 2:8',
    medit: '',
  });
  const [saving, setSaving] = useState(false);
  const [toasts, pushToast] = useToasts();

  async function save() {
    setSaving(true);
    try {
      await upsertVerset(v.texte, v.ref, v.medit);
      pushToast('Verset du jour mis à jour', 'slate');
    } catch {
      pushToast('Erreur lors de la sauvegarde', 'tem');
    } finally {
      setSaving(false);
    }
  }

  const marqRun = [0, 1].map(k => (
    <span className="it" key={k}>{v.texte || '…'}<span className="sep" /><b>{v.ref || 'Référence'}</b></span>
  ));

  return (
    <div className="a-page a-pagefade">
      <PageHead accent="slate" icon="sparkle" eyebrow="Contenu transversal" title="Verset du jour"
        sub="Diffusé en bandeau défilant sur toutes les pages et en bloc éditorial sur Enseignements et Évangélisation.">
        <button className="a-btn a-btn-primary" disabled={saving} onClick={save}>
          {saving ? <><Spinner />Enregistrement…</> : <><AIcon n="save" size={17} />Publier</>}
        </button>
      </PageHead>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'start' }}>
        {/* formulaire */}
        <Panel accent="slate" icon="pen" title="Rédiger le verset">
          <div className="a-form">
            <Field label="Texte du verset" icon="quote">
              <Textarea value={v.texte} onChange={e => setV({ ...v, texte: e.target.value })} rows={4} placeholder="Saisissez le texte biblique…" />
            </Field>
            <Field label="Référence biblique" icon="book" hint="Livre, chapitre et versets — ex. Éphésiens 2:8">
              <Input value={v.ref} onChange={e => setV({ ...v, ref: e.target.value })} placeholder="Jean 3:16" />
            </Field>
            <Field label="Méditation courte" opt="optionnelle" icon="sparkle" hint="Affichée sous le bloc éditorial fixe uniquement.">
              <Textarea value={v.medit} onChange={e => setV({ ...v, medit: e.target.value })} rows={3} placeholder="Une phrase pour méditer le verset…" />
            </Field>
          </div>
        </Panel>

        {/* aperçu */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Panel accent="slate" icon="eye" title="Aperçu — bandeau défilant" bodyStyle={{ padding: 16 }}>
            <div className="a-vbar" style={aStyle('tem')}>
              <span className="vtag"><AIcon n="sparkle" size={12} sw={2} />Verset</span>
              <span className="a-vmarq"><span className="trk">{marqRun}</span></span>
            </div>
            <p style={{ fontSize: 12, margin: '12px 2px 0', lineHeight: 1.5, color: 'var(--ink-3)' }}>
              En haut des pages où le verset accompagne sans interrompre la lecture.
            </p>
          </Panel>

          <Panel accent="ens" icon="eye" title="Aperçu — bloc éditorial fixe" bodyStyle={{ padding: 16 }}>
            <div className="a-vblock" style={aStyle('ens')}>
              <span className="vk">&ldquo;</span>
              <div className="vlabel"><AIcon n="sparkle" size={12} sw={2} />Verset du jour</div>
              <div className="vtext">{v.texte || 'Le texte du verset apparaîtra ici.'}</div>
              <div className="vref">— {v.ref || 'Référence'}</div>
              {v.medit && <div className="vmed">{v.medit}</div>}
            </div>
          </Panel>
        </div>
      </div>

      <ToastHost toasts={toasts} />
    </div>
  );
}
