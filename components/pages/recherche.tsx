'use client';
import React, { useState } from 'react';
import Icon from '@/components/icons';
import { Reveal, SearchBar, EmptySearch, hl } from '@/components/ui';
import { accentStyle, ACCENT } from '@/lib/accent';
import { Tile } from './accueil';
import type { AccentKey, DetailType } from '@/lib/types';
import DB from '@/lib/data';

const TYPEMAP: Record<string, { accent: AccentKey; icon: string; label: string }> = {
  enseignement: { accent: 'ens', icon: 'book',      label: 'Enseignement' },
  temoignage:   { accent: 'tem', icon: 'quote',     label: 'Témoignage' },
  annonce:      { accent: 'ann', icon: 'mega',      label: 'Annonce' },
  sortie:       { accent: 'eva', icon: 'compass',   label: 'Évangélisation' },
  livre:        { accent: 'res', icon: 'books',     label: 'Livre' },
  priere:       { accent: 'pri', icon: 'flame',     label: 'Prière' },
  ressource:    { accent: 'res', icon: 'folder',    label: 'Ressource' },
};

export default function PageRecherche({ onOpen, onNav }: {
  onOpen: (type: string, item: unknown) => void;
  onNav: (p: string) => void;
}) {
  const [q, setQ] = useState('');
  const ql = q.trim().toLowerCase();
  const all = [
    ...DB.ENSEIGNEMENTS.map(x => ({ type: 'enseignement', item: x, t: x.titre, s: x.serie + ' ' + x.auteur })),
    ...DB.TEMOIGNAGES.map(x  => ({ type: 'temoignage',   item: x, t: x.titre, s: x.auteur + ' ' + x.cat })),
    ...DB.ANNONCES.map(x     => ({ type: 'annonce',      item: x, t: x.titre, s: x.cat })),
    ...DB.PRIERES.map(x      => ({ type: 'priere',       item: x, t: x.sujet, s: x.auteur + ' ' + x.cat })),
    ...DB.RESSOURCES.map(x   => ({ type: 'ressource',    item: x, t: x.titre, s: x.cat + ' ' + x.fmt })),
    ...DB.LIVRES.map(x       => ({ type: 'livre',        item: x, t: x.titre, s: x.auteur })),
    ...DB.SORTIES.map(x      => ({ type: 'sortie',       item: x, t: x.titre, s: x.theme })),
  ];
  const res = ql ? all.filter(r => (r.t + ' ' + r.s).toLowerCase().includes(ql)) : [];

  return (
    <div className="screen pagefade" style={accentStyle('slate')}>
      <div className="hero-head" style={{ paddingTop: 18 }}>
        <h1 className="h1" style={{ fontSize: 27, marginBottom: 14 }}>Rechercher</h1>
      </div>
      <div style={{ padding: '0 0 6px' }}>
        <SearchBar placeholder="Enseignements, témoignages, livres…" value={q} onChange={setQ} autoFocus />
      </div>
      {!ql ? (
        <div className="section" style={{ paddingTop: 14 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Explorer par module</div>
          <div className="tilegrid" style={{ padding: 0 }}>
            {DB.HUB_ORDER.map((k, i) => <Tile key={k} mkey={k} onNav={onNav} delay={i * 35} />)}
          </div>
        </div>
      ) : res.length ? (
        <>
          <div className="section-h" style={{ marginBottom: 8 }}>
            <h2 style={{ fontSize: 16 }}>{res.length} résultat{res.length > 1 ? 's' : ''}</h2>
          </div>
          <div className="list" style={{ paddingTop: 0 }}>
            {res.map((r, i) => {
              const m = TYPEMAP[r.type];
              return (
                <Reveal key={i} delay={i * 30}>
                  <button className="card tap row-card" style={{ ...accentStyle(m.accent), width: '100%', textAlign: 'left', padding: 12 }} onClick={() => onOpen(r.type, r.item)}>
                    <span style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--c-t)', color: 'var(--c-i)', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>
                      <Icon n={m.icon} size={18} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3, marginBottom: 3 }}>{hl(r.t, q)}</div>
                      <div className="t3" style={{ fontSize: 11.5, fontWeight: 600 }}>{m.label} · {r.s}</div>
                    </div>
                    <Icon n="cr" size={16} style={{ color: 'var(--ink-3)' }} />
                  </button>
                </Reveal>
              );
            })}
          </div>
        </>
      ) : <EmptySearch label={q} />}
    </div>
  );
}
