'use client';
import React, { useState, useEffect } from 'react';
import Icon from '@/components/icons';
import { Reveal, VerseBanner, VerseBlock, SearchBar, ChipRow, ModuleHero, BootList, SkeletonCard, Tag, Ph, EmptySearch, Spinner, hl } from '@/components/ui';
import { accentStyle, RES_ICON } from '@/lib/accent';
import type { Ressource, Livre, Sortie } from '@/lib/types';
import { getRessources, getLivres, getSorties, searchRessources, searchLivres, searchSorties } from '@/lib/queries';
import { useSupabaseSearch } from '@/lib/use-search';

/* ---------- RESSOURCES ---------- */
export function PageRessources({ onOpen }: { onOpen: (t: string, i: unknown) => void }) {
  const [all, setAll] = useState<Ressource[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('Tous');

  useEffect(() => {
    getRessources().then(data => { setAll(data); setLoading(false); });
  }, []);

  const { items: found, searching } = useSupabaseSearch(q, all, searchRessources);
  const cats = ['Tous', ...Array.from(new Set(all.map(r => r.cat).filter(Boolean)))];
  const items = found.filter(r => cat === 'Tous' || r.cat === cat);

  return (
    <div className="screen pagefade" style={accentStyle('res')}>
      <VerseBanner />
      <ModuleHero mkey="ressources" />
      <div style={{ padding: '12px 0 4px' }}><SearchBar placeholder="Rechercher un fichier…" value={q} onChange={setQ} /></div>
      <ChipRow items={cats} active={cat} onPick={setCat} />
      <div className="section-h" style={{ marginBottom: 6 }}>
        <h2 style={{ fontSize: 17 }}>{q ? 'Résultats' : 'Bibliothèque'}</h2>
        {searching ? <Spinner /> : <span className="t3" style={{ fontSize: 12.5, fontWeight: 600 }}>{items.length} fichiers</span>}
      </div>
      {loading ? <BootList /> : items.length ? (
        <div className="list">
          {items.map((r, i) => (
            <Reveal key={r.id} delay={i * 40}>
              <button className="card tap row-card" style={{ width: '100%', textAlign: 'left' }} onClick={() => onOpen('ressource', r)}>
                <span style={{ width: 48, height: 48, borderRadius: 13, background: 'var(--c-t)', color: 'var(--c-i)', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>
                  <Icon n={RES_ICON[r.type] ?? 'filetext'} size={21} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5, letterSpacing: '-.01em', lineHeight: 1.3, marginBottom: 5 }}>{hl(r.titre, q)}</div>
                  <div className="metaline" style={{ fontSize: 11.5 }}>
                    <span className="tagpill" style={{ height: 20, fontSize: 10, background: 'var(--c-t)', color: 'var(--c-i)' }}>{r.fmt}</span>
                    <span>{r.taille}</span><span className="md" /><span>{r.date}</span>
                  </div>
                </div>
                <span className="iconbtn" style={{ color: 'var(--c-i)' }}><Icon n="dl" size={19} /></span>
              </button>
            </Reveal>
          ))}
        </div>
      ) : <EmptySearch label={q} />}
    </div>
  );
}

/* ---------- LIBRAIRIE ---------- */
export function PageLibrairie({ onOpen }: { onOpen: (t: string, i: unknown) => void }) {
  const [all, setAll] = useState<Livre[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    getLivres().then(data => { setAll(data); setLoading(false); });
  }, []);

  const { items, searching } = useSupabaseSearch(q, all, searchLivres);

  return (
    <div className="screen pagefade" style={accentStyle('res')}>
      <VerseBanner />
      <ModuleHero mkey="librairie" />
      <div style={{ padding: '12px 0 8px' }}><SearchBar placeholder="Rechercher un livre, un auteur…" value={q} onChange={setQ} /></div>
      <div className="section-h" style={{ marginBottom: 6 }}>
        <h2 style={{ fontSize: 17 }}>{q ? 'Résultats' : 'Vitrine'}</h2>
        {searching ? <Spinner /> : <span className="t3" style={{ fontSize: 12.5, fontWeight: 600 }}>Auteurs de la communauté</span>}
      </div>
      {loading ? <div className="list"><SkeletonCard /><SkeletonCard /></div> : items.length ? (
        <div className="list">
          {items.map((b, i) => (
            <Reveal key={b.id} delay={i * 55}>
              <button className="card tap" style={{ width: '100%', textAlign: 'left', padding: 15, display: 'flex', gap: 15 }} onClick={() => onOpen('livre', b)}>
                <Ph label="couverture" style={{ width: 84, height: 118, flex: '0 0 auto', borderRadius: 10, boxShadow: 'var(--sh-2)' }} />
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <Tag c="res">{b.cat}</Tag>
                  <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-.02em', lineHeight: 1.2, margin: '9px 0 4px' }}>{hl(b.titre, q)}</div>
                  <div className="t3" style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>{b.auteur} · {b.annee}</div>
                  <p className="muted" style={{ margin: 0, fontSize: 13, lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{b.desc}</p>
                  <div style={{ flex: 1 }} />
                  <div className="metaline" style={{ fontSize: 11.5, marginTop: 10 }}>
                    <Icon n="book" size={13} /><span>{b.pages} pages</span><span className="md" />
                    <span style={{ color: 'var(--c-i)', fontWeight: 700 }}>Voir la fiche</span>
                  </div>
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      ) : <EmptySearch label={q} />}
    </div>
  );
}

/* ---------- ÉVANGÉLISATION ---------- */
export function PageEvangelisation({ onOpen }: { onOpen: (t: string, i: unknown) => void }) {
  const [all, setAll] = useState<Sortie[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    getSorties().then(data => { setAll(data); setLoading(false); });
  }, []);

  const { items, searching } = useSupabaseSearch(q, all, searchSorties);
  const aVenir = items.filter(s => s.statut === 'a_venir');
  const passees = items.filter(s => s.statut === 'passee');

  return (
    <div className="screen pagefade" style={accentStyle('eva')}>
      <VerseBlock />
      <ModuleHero mkey="evangelisation" />
      <div style={{ padding: '12px 0 8px' }}><SearchBar placeholder="Rechercher une sortie…" value={q} onChange={setQ} /></div>

      <div className="section-h" style={{ marginBottom: 8 }}><h2 style={{ fontSize: 17 }}>Calendrier des sorties</h2>{searching && <Spinner />}</div>
      {loading ? <BootList n={2} /> : aVenir.length ? (
        <div className="list">
          {aVenir.map((s, i) => (
            <Reveal key={s.id} delay={i * 55}>
              <button className="card tap" style={{ width: '100%', textAlign: 'left', padding: 0, overflow: 'hidden' }} onClick={() => onOpen('sortie', s)}>
                <div style={{ display: 'flex', alignItems: 'stretch' }}>
                  <div style={{ flex: '0 0 auto', width: 72, background: 'var(--c-t)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--c-i)', padding: '14px 0' }}>
                    <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1, letterSpacing: '-.02em' }}>{s.date.split(' ')[0]}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>{s.date.split(' ')[1]}</div>
                  </div>
                  <div style={{ padding: 15, flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 7, marginBottom: 8 }}><Tag c="eva" icon="sparkle">{s.theme}</Tag></div>
                    <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-.01em', lineHeight: 1.2, marginBottom: 7 }}>{hl(s.titre, q)}</div>
                    <div className="metaline" style={{ fontSize: 12 }}><Icon n="clock" size={13} /><span>{s.heure}</span><span className="md" /><Icon n="users" size={13} /><span>{s.equipe} équipiers</span></div>
                  </div>
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      ) : <div className="t3" style={{ padding: '4px 20px 8px', fontSize: 13.5 }}>Aucune sortie à venir pour l&apos;instant.</div>}

      <div className="section-h" style={{ marginBottom: 8, marginTop: 20 }}><h2 style={{ fontSize: 17 }}>Rapports des sorties passées</h2></div>
      {!loading && (
        <div className="list">
          {passees.map((s, i) => (
            <Reveal key={s.id} delay={i * 55}>
              <button className="card tap" style={{ width: '100%', textAlign: 'left', padding: 15 }} onClick={() => onOpen('sortie', s)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                  <span className="tagpill" style={{ background: 'var(--bg-soft)', color: 'var(--ink-2)' }}><Icon n="check" size={11} sw={2.4} />Terminée</span>
                  <span style={{ flex: 1 }} /><span className="t3" style={{ fontSize: 11.5 }}>{s.date}</span>
                </div>
                <div style={{ fontWeight: 800, fontSize: 15.5, letterSpacing: '-.01em', lineHeight: 1.25, marginBottom: 12 }}>{hl(s.titre, q)}</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {([['users', s.equipe, 'équipe'], ['chart', s.contacts, 'contacts'], ['heart', s.decisions, 'décisions']] as [string, number | undefined, string][]).map((m, k) => (
                    <div key={k} style={{ flex: 1, background: 'var(--bg-soft)', borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--c-i)', marginBottom: 4 }}><Icon n={m[0]} size={15} /></div>
                      <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-.02em' }}>{m[1]}</div>
                      <div className="t3" style={{ fontSize: 10.5, fontWeight: 600 }}>{m[2]}</div>
                    </div>
                  ))}
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
