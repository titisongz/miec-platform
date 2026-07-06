'use client';
import React, { useState } from 'react';
import AIcon from '@/components/admin/icon';

// Primitives partagées du back-office SUPER ADMIN (design "sa-*", stylé par
// app/superadmin/superadmin.css). Distinct de components/admin/ui.tsx (design
// "a-*", stylé par app/admin/admin.css) : les deux feuilles de style ne sont
// chargées que sur leurs routes respectives (/admin vs /superadmin), sans lien
// entre elles — réutiliser les composants "a-*" ici rendrait des éléments non
// stylés. Ce fichier existe pour dédupliquer les 5 copies identiques de
// useToasts()/toast-host qui existaient dans chaque page /superadmin/*.

// ── Toasts ────────────────────────────────────────────────────────────────

export type SAToastVariant = 'ok' | 'err';
export interface SAToast { id: number; msg: string; out?: boolean; variant: SAToastVariant }

export function useToasts(): readonly [SAToast[], (msg: string, variant?: SAToastVariant) => void] {
  const [toasts, setToasts] = useState<SAToast[]>([]);
  function push(msg: string, variant: SAToastVariant = 'ok') {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, variant }]);
    // Les erreurs restent affichées plus longtemps : le message Supabase exact
    // doit avoir le temps d'être lu par le super admin.
    const ttl = variant === 'err' ? 6500 : 3200;
    setTimeout(() => setToasts(t => t.map(x => x.id === id ? { ...x, out: true } : x)), ttl);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), ttl + 300);
  }
  return [toasts, push] as const;
}

export function ToastHost({ toasts }: { toasts: SAToast[] }) {
  return (
    <div className="sa-toast-host">
      {toasts.map(t => {
        const err = t.variant === 'err';
        return (
          <div key={t.id} className={`sa-toast${err ? ' err' : ''}${t.out ? ' out' : ''}`}>
            <AIcon n={err ? 'info' : 'check'} size={16} style={{ color: err ? '#fff' : 'var(--sa-red)', flexShrink: 0 }} />{t.msg}
          </div>
        );
      })}
    </div>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="sa-toggle">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="tk" />
    </label>
  );
}
