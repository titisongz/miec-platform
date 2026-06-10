'use client';
import React, { useState, useEffect } from 'react';
import Icon from '@/components/icons';
import { Reveal, VerseBanner, VerseBlock, SearchBar, ChipRow, ModuleHero, BootList, Tag, Ph, EmptySearch, Spinner, hl } from '@/components/ui';
import { accentStyle } from '@/lib/accent';
import type { Enseignement, Serie, Temoignage, Annonce, Priere, FrictionConfig } from '@/lib/types';
import { getEnseignements, getSeries, getTemoignages, getAnnonces, getPrieres, searchEnseignements, searchTemoignages, searchAnnonces } from '@/lib/queries';
import { useSupabaseSearch } from '@/lib/use-search';

/* ---------- ENSEIGNEMENTS ---------- */
function EnsRow({ e, q, onOpen, delay }: { e: Enseignement; q: string; onOpen: (t: string, i: unknown) => void; delay: number }) {
  return (
    <Reveal delay={delay}>
      <button className="card tap row-card" style={{ width: '100%', textAlign: 'left' }} onClick={() => onOpen('enseignement', e)}>
        <Ph label={e.type === 'video' ? 'vidéo' : 'texte'} style={{ width: 66, height: 66 }}>
          <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'var(--c)' }}>
            <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,.92)', display: 'grid', placeItems: 'center', boxShadow: 'var(--sh-1)' }}>
              <Icon n={e.type === 'video' ? 'play' : 'filetext'} size={15} />
            </span>
          </span>
        </Ph>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="eyebrow" style={{ marginBottom: 4, fontSize: 10.5 }}>{e.serie} · {e.n}/{e.total}</div>
          <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-.01em', lineHeight: 1.25, marginBottom: 5 }}>{hl(e.titre, q)}</div>
          <div className="metaline" style={{ fontSize: 11.5 }}><span>{e.auteur}</span><span className="md" /><Icon n="clock" size={12} /><span>{e.duree}</span></div>
        </div>
      </button>
    </Reveal>
  );
}

export function PageEnseignements({ onOpen }: { onOpen: (t: string, i: unknown) => void }) {
  const [all, setAll] = useState<Enseignement[]>([]);
  const [series, setSeries] = useState<Serie[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [theme, setTheme] = useState('Tous');

  useEffect(() => {
    Promise.all([getEnseignements(), getSeries()]).then(([ens, ser]) => {
      setAll(ens);
      setSeries(ser);
      setLoading(false);
    });
  }, []);

  const { items: found, searching } = useSupabaseSearch(q, all, searchEnseignements);
  const themes = ['Tous', ...Array.from(new Set(all.map(e => e.theme).filter(Boolean)))];
  const items = found.filter(e => theme === 'Tous' || e.theme === theme);

  return (
    <div className="screen pagefade" style={accentStyle('ens')}>
      <VerseBlock />
      <ModuleHero mkey="enseignements" />
      <div style={{ padding: '12px 0 4px' }}><SearchBar placeholder="Rechercher un enseignement…" value={q} onChange={setQ} /></div>
      <ChipRow items={themes} active={theme} onPick={setTheme} />
      {loading ? <BootList /> : (
        <>
          {!q && (
            <>
              <div className="section-h" style={{ marginBottom: 8 }}><h2 style={{ fontSize: 17 }}>Séries</h2></div>
              <div className="chiprow" style={{ gap: 12, paddingBottom: 6 }}>
                {series.map((s, i) => (
                  <Reveal key={s.id} delay={i * 50} style={{ flex: '0 0 auto' }}>
                    <button className="card tap" style={{ width: 172, textAlign: 'left', padding: 14 }} onClick={() => setQ('')}>
                      <span style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--c-t)', color: 'var(--c-i)', display: 'grid', placeItems: 'center', marginBottom: 24 }}><Icon n="book" size={18} /></span>
                      <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-.01em', lineHeight: 1.2, marginBottom: 4 }}>{s.titre}</div>
                      <div className="t3" style={{ fontSize: 11.5, fontWeight: 600 }}>{s.meta} · {s.n} messages</div>
                    </button>
                  </Reveal>
                ))}
              </div>
            </>
          )}
          <div className="section-h" style={{ marginBottom: 6 }}>
            <h2 style={{ fontSize: 17 }}>{q ? 'Résultats' : 'Tous les enseignements'}</h2>
            {searching && <Spinner />}
          </div>
          {items.length
            ? <div className="list">{items.map((e, i) => <EnsRow key={e.id} e={e} q={q} onOpen={onOpen} delay={i * 45} />)}</div>
            : <EmptySearch label={q} />}
        </>
      )}
    </div>
  );
}

/* ---------- TÉMOIGNAGES ---------- */
export function PageTemoignages({ role, onOpen, onSubmit }: {
  role: string; onOpen: (t: string, i: unknown) => void; onSubmit: (cfg: FrictionConfig) => void;
}) {
  const [all, setAll] = useState<Temoignage[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('Tous');

  useEffect(() => {
    getTemoignages().then(data => { setAll(data); setLoading(false); });
  }, []);

  const { items: found, searching } = useSupabaseSearch(q, all, searchTemoignages);
  const cats = ['Tous', ...Array.from(new Set(all.map(t => t.cat).filter(Boolean)))];
  const items = found.filter(t => cat === 'Tous' || t.cat === cat);

  return (
    <div className="screen pagefade" style={accentStyle('tem')}>
      <VerseBanner />
      <ModuleHero mkey="temoignages" />
      <div style={{ padding: '12px 0 4px' }}><SearchBar placeholder="Rechercher un témoignage…" value={q} onChange={setQ} /></div>
      <ChipRow items={cats} active={cat} onPick={setCat} />
      <div className="section-h" style={{ marginBottom: 6 }}>
        <h2 style={{ fontSize: 17 }}>{q ? 'Résultats' : 'Témoignages'}</h2>
        {searching ? <Spinner /> : <span className="t3" style={{ fontSize: 12.5, fontWeight: 600 }}>{items.length} publié{items.length > 1 ? 's' : ''}</span>}
      </div>
      {loading ? <BootList /> : items.length ? (
        <div className="list">
          {items.map((t, i) => (
            <Reveal key={t.id} delay={i * 45}>
              <button className="card tap" style={{ width: '100%', textAlign: 'left', padding: 16 }} onClick={() => onOpen('temoignage', t)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 11 }}>
                  <span style={{ fontFamily: 'Newsreader,serif', fontSize: 34, lineHeight: .6, color: 'var(--c)', opacity: .5, height: 18 }}>&ldquo;</span>
                  <Tag c="tem">{t.cat}</Tag>
                </div>
                <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-.01em', lineHeight: 1.25, marginBottom: 7 }}>{hl(t.titre, q)}</div>
                <p className="muted" style={{ margin: '0 0 13px', fontSize: 13.5, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t.excerpt}</p>
                <div className="metaline" style={{ fontSize: 12 }}>
                  <span className="avatar" style={{ width: 22, height: 22, fontSize: 9, background: 'var(--c)' }}>{t.auteur.slice(0, 1)}</span>
                  <span style={{ fontWeight: 600, color: 'var(--ink-2)' }}>{t.auteur}</span><span className="md" /><span>{t.date}</span>
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      ) : <EmptySearch label={q} />}
      <button className="fab" onClick={() => onSubmit({ mod: 'temoignages', title: 'Partagez votre témoignage', benefit: 'Créez un compte pour soumettre votre témoignage. Il sera relu puis publié pour encourager toute la communauté.' })}>
        <Icon n="plus" size={18} sw={2.4} />Soumettre
      </button>
    </div>
  );
}

/* ---------- ANNONCES ---------- */
export function PageAnnonces({ onOpen }: { onOpen: (t: string, i: unknown) => void }) {
  const [all, setAll] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('Toutes');

  useEffect(() => {
    getAnnonces().then(data => { setAll(data); setLoading(false); });
  }, []);

  const { items: found, searching } = useSupabaseSearch(q, all, searchAnnonces);
  const cats = ['Toutes', ...Array.from(new Set(all.map(a => a.cat).filter(Boolean)))];
  const items = found.filter(a => cat === 'Toutes' || a.cat === cat);

  return (
    <div className="screen pagefade" style={accentStyle('ann')}>
      <VerseBanner />
      <ModuleHero mkey="annonces" />
      <div style={{ padding: '12px 0 4px' }}><SearchBar placeholder="Rechercher une annonce…" value={q} onChange={setQ} /></div>
      <ChipRow items={cats} active={cat} onPick={setCat} />
      <div className="section-h" style={{ marginBottom: 6 }}><h2 style={{ fontSize: 17 }}>{q ? 'Résultats' : 'À la une'}</h2>{searching && <Spinner />}</div>
      {loading ? <BootList /> : items.length ? (
        <div className="list">
          {items.map((a, i) => (
            <Reveal key={a.id} delay={i * 45}>
              <button className="card tap" style={{ width: '100%', textAlign: 'left', padding: 0, overflow: 'hidden', borderColor: a.urgent ? 'color-mix(in srgb,var(--c) 28%,var(--line))' : 'var(--line)' }} onClick={() => onOpen('annonce', a)}>
                <div style={{ display: 'flex', gap: 0 }}>
                  <div style={{ width: 5, background: a.urgent ? 'var(--c)' : 'var(--line-2)', flex: '0 0 auto' }} />
                  <div style={{ padding: 15, flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
                      <Tag c="ann" icon="mega">{a.cat}</Tag>
                      {a.urgent && <span className="tagpill" style={{ background: 'var(--m-tem-t)', color: 'var(--m-tem-i)' }}>À ne pas manquer</span>}
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-.01em', lineHeight: 1.25, marginBottom: 6 }}>{hl(a.titre, q)}</div>
                    <p className="muted" style={{ margin: '0 0 11px', fontSize: 13.5, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.excerpt}</p>
                    <div className="metaline" style={{ fontSize: 12 }}><Icon n="calendar" size={13} /><span style={{ fontWeight: 600, color: 'var(--ink-2)' }}>{a.date}</span></div>
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

/* ---------- PRIÈRE ---------- */
export function PagePriere({ role, onOpen, onSubmit, prayed, onPray }: {
  role: string; onOpen: (t: string, i: unknown) => void;
  onSubmit: (cfg: FrictionConfig) => void;
  prayed: string[]; onPray: (id: string) => void;
}) {
  const [all, setAll] = useState<Priere[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('Tous');

  useEffect(() => {
    getPrieres().then(data => { setAll(data); setLoading(false); });
  }, []);

  const cats = ['Tous', ...Array.from(new Set(all.map(p => p.cat).filter(Boolean)))];
  const items = all.filter(p =>
    (cat === 'Tous' || p.cat === cat) &&
    (p.sujet + p.auteur).toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="screen pagefade" style={accentStyle('pri')}>
      <VerseBanner />
      <ModuleHero mkey="priere" />
      <div className="section" style={{ paddingTop: 14 }}>
        <Reveal>
          <button className="card tap" style={{ width: '100%', padding: 15, display: 'flex', alignItems: 'center', gap: 13, textAlign: 'left', background: 'var(--c-t)', borderColor: 'color-mix(in srgb,var(--c) 18%,var(--line))' }}
            onClick={() => onSubmit({ mod: 'priere', title: 'Déposez un sujet de prière', benefit: "Créez un compte pour partager un sujet de prière. La communauté s'unira pour intercéder avec vous." })}>
            <span style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--c)', color: '#fff', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}><Icon n="plus" size={20} sw={2.2} /></span>
            <span style={{ flex: 1 }}>
              <span style={{ display: 'block', fontWeight: 800, fontSize: 15, letterSpacing: '-.01em' }}>Déposer un sujet de prière</span>
              <span className="t3" style={{ fontSize: 12.5, fontWeight: 500 }}>La communauté priera avec vous</span>
            </span>
            <Icon n="cr" size={18} style={{ color: 'var(--c-i)' }} />
          </button>
        </Reveal>
      </div>
      <div style={{ padding: '4px 0 4px' }}><SearchBar placeholder="Rechercher un sujet…" value={q} onChange={setQ} /></div>
      <ChipRow items={cats} active={cat} onPick={setCat} />
      <div className="section-h" style={{ marginBottom: 6 }}><h2 style={{ fontSize: 17 }}>{q ? 'Résultats' : 'Sujets de la communauté'}</h2></div>
      {loading ? <BootList /> : items.length ? (
        <div className="list">
          {items.map((p, i) => {
            const on = prayed.includes(p.id);
            const count = p.prie + (on ? 1 : 0);
            return (
              <Reveal key={p.id} delay={i * 45}>
                <div className="card" style={{ padding: 15 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                    <Tag c="pri">{p.cat}</Tag>
                    {p.urgent && <span className="tagpill" style={{ background: 'var(--m-tem-t)', color: 'var(--m-tem-i)' }}><Icon n="flame" size={11} sw={2.2} />Urgent</span>}
                    <span style={{ flex: 1 }} /><span className="t3" style={{ fontSize: 11.5 }}>{p.date}</span>
                  </div>
                  <button onClick={() => onOpen('priere', p)} style={{ textAlign: 'left', display: 'block', width: '100%', marginBottom: 13 }}>
                    <span style={{ fontWeight: 700, fontSize: 15.5, letterSpacing: '-.01em', lineHeight: 1.3, display: 'block', marginBottom: 5 }}>{hl(p.sujet, q)}</span>
                    <span className="metaline" style={{ fontSize: 12 }}>
                      <span className="avatar" style={{ width: 20, height: 20, fontSize: 9, background: 'var(--c)' }}>{p.auteur.slice(0, 1)}</span>
                      <span style={{ fontWeight: 600, color: 'var(--ink-2)' }}>{p.auteur}</span>
                    </span>
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
                    <button className={'btn btn-sm ' + (on ? 'btn-primary' : 'btn-soft')} onClick={() => onPray(p.id)} style={{ transition: 'all .25s' }}>
                      <Icon n="flame" size={15} sw={2} />{on ? 'Vous priez' : 'Je prie'}
                    </button>
                    <span className="t3" style={{ fontSize: 12.5, fontWeight: 600 }}>
                      <b style={{ color: 'var(--c-i)' }}>{count}</b> personnes prient
                    </span>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      ) : <EmptySearch label={q} />}
    </div>
  );
}
