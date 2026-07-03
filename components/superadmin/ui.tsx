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

export interface SAToast { id: number; msg: string; out?: boolean }

export function useToasts(): readonly [SAToast[], (msg: string) => void] {
  const [toasts, setToasts] = useState<SAToast[]>([]);
  function push(msg: string) {
    const id = Date.now();
    setToasts(t => [...t, { id, msg }]);
    setTimeout(() => setToasts(t => t.map(x => x.id === id ? { ...x, out: true } : x)), 3200);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }
  return [toasts, push] as const;
}

export function ToastHost({ toasts }: { toasts: SAToast[] }) {
  return (
    <div className="sa-toast-host">
      {toasts.map(t => (
        <div key={t.id} className={`sa-toast${t.out ? ' out' : ''}`}>
          <AIcon n="check" size={16} style={{ color: 'var(--sa-red)' }} />{t.msg}
        </div>
      ))}
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
