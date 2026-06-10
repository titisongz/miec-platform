'use client';
import React, { useEffect, useRef, useState } from 'react';
import Icon from '@/components/icons';
import { Reveal, SearchBar, EmptySearch, Spinner, hl } from '@/components/ui';
import { accentStyle } from '@/lib/accent';
import { Tile } from './accueil';
import type { AccentKey } from '@/lib/types';
import DB from '@/lib/data';
import { globalSearch, type GlobalSearchResult, type SearchType, type SearchHit } from '@/lib/queries';

const TYPEMAP: Record<SearchType, { accent: AccentKey; icon: string }> = {
  enseignement: { accent: 'ens', icon: 'book' },
  temoignage:   { accent: 'tem', icon: 'quote' },
  annonce:      { accent: 'ann', icon: 'mega' },
  priere:       { accent: 'pri', icon: 'flame' },
  ressource:    { accent: 'res', icon: 'folder' },
  livre:        { accent: 'res', icon: 'books' },
  sortie:       { accent: 'eva', icon: 'compass' },
  ipb:          { accent: 'ipb', icon: 'cap' },
};

export default function PageRecherche({ onOpen, onNav }: {
  onOpen: (type: string, item: unknown) => void;
  onNav: (p: string) => void;
}) {
  const [q, setQ] = useState('');
  const [res, setRes] = useState<GlobalSearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const seq = useRef(0);

  // Recherche Supabase débouncée (300 ms)
  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setRes(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    const id = ++seq.current;
    const t = setTimeout(async () => {
      const r = await globalSearch(term);
      if (id === seq.current) {
        setRes(r);
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const ql = q.trim();

  function openHit(hit: SearchHit) {
    if (hit.type === 'ipb') onNav('ipb');
    else onOpen(hit.type, hit.item);
  }

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
      ) : searching ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '52px 24px', color: 'var(--ink-3)' }}>
          <Spinner />
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>Recherche en cours…</div>
        </div>
      ) : res && res.total ? (
        <>
          <div className="section-h" style={{ marginBottom: 8 }}>
            <h2 style={{ fontSize: 16 }}>{res.total} résultat{res.total > 1 ? 's' : ''}</h2>
          </div>
          {res.groups.map(group => {
            const m = TYPEMAP[group.type];
            return (
              <div key={group.type} className="section" style={{ paddingTop: 6 }}>
                <div className="eyebrow" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ ...accentStyle(m.accent), width: 20, height: 20, borderRadius: 6, background: 'var(--c-t)', color: 'var(--c-i)', display: 'grid', placeItems: 'center' }}>
                    <Icon n={m.icon} size={12} />
                  </span>
                  {group.label}
                  <span style={{ color: 'var(--ink-3)', fontWeight: 600 }}>· {group.hits.length}</span>
                </div>
                <div className="list" style={{ paddingTop: 0 }}>
                  {group.hits.map((hit, i) => (
                    <Reveal key={hit.id} delay={i * 25}>
                      <button className="card tap row-card" style={{ ...accentStyle(m.accent), width: '100%', textAlign: 'left', padding: 12 }} onClick={() => openHit(hit)}>
                        <span style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--c-t)', color: 'var(--c-i)', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>
                          <Icon n={m.icon} size={18} />
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3, marginBottom: 3 }}>{hl(hit.title, ql)}</div>
                          {hit.subtitle && <div className="t3" style={{ fontSize: 11.5, fontWeight: 600 }}>{hit.subtitle}</div>}
                        </div>
                        <Icon n="cr" size={16} style={{ color: 'var(--ink-3)' }} />
                      </button>
                    </Reveal>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      ) : <EmptySearch label={q} />}
    </div>
  );
}
