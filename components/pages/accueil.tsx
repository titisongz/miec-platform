'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Icon from '@/components/icons';
import { Reveal, VerseBanner, Tag, Ph } from '@/components/ui';
import { accentStyle, ACCENT } from '@/lib/accent';
import type { AccentKey, Enseignement, Annonce, Temoignage, Sortie } from '@/lib/types';
import DB from '@/lib/data';
import { getActivityRecente, getModuleCounts } from '@/lib/queries';

// Libellé des tuiles = nombre réel d'éléments + nom du module (singulier/pluriel).
const MOD_NOUNS: Record<string, [string, string]> = {
  enseignements: ['enseignement', 'enseignements'],
  priere:        ['sujet', 'sujets'],
  temoignages:   ['témoignage', 'témoignages'],
  evangelisation:['sortie', 'sorties'],
  annonces:      ['annonce', 'annonces'],
  ipb:           ['cours', 'cours'],
  ressources:    ['ressource', 'ressources'],
  librairie:     ['livre', 'livres'],
};
function metaLabel(mkey: string, n: number): string {
  const [s, p] = MOD_NOUNS[mkey] ?? ['élément', 'éléments'];
  return `${n} ${n > 1 ? p : s}`;
}

export function Tile({ mkey, onNav, delay, count }: { mkey: string; onNav: (p: string) => void; delay: number; count?: number }) {
  const m = DB.MODULES[mkey];
  const a = ACCENT[m.c as AccentKey];
  return (
    <Reveal delay={delay} style={{ display: 'contents' }}>
      <button className="tile" onClick={() => onNav(mkey)}
        style={{ '--tc': a.c, '--tbg': a.t, '--tl': `color-mix(in srgb,${a.c} 16%,var(--line))` } as React.CSSProperties}>
        <span className="glow" />
        <span className="ti"><Icon n={m.icon} size={21} sw={1.9} /></span>
        <span>
          <span className="tname" style={{ display: 'block' }}>{m.label}</span>
          {count !== undefined && <span className="tmeta">{metaLabel(mkey, count)}</span>}
        </span>
      </button>
    </Reveal>
  );
}

function ActivityCard({ accent, icon, kicker, title, meta, thumb, onClick, delay }: {
  accent: AccentKey; icon: string; kicker: string; title: string; meta: string;
  thumb?: string | false; onClick: () => void; delay: number;
}) {
  return (
    <Reveal delay={delay}>
      <button className="card tap" style={{ ...accentStyle(accent), width: '100%', textAlign: 'left', display: 'flex', gap: 13, padding: 13, alignItems: 'center' }} onClick={onClick}>
        {thumb !== false && <Ph label={thumb} style={{ width: 58, height: 58, flex: '0 0 auto', borderRadius: 13 }} />}
        <span style={{ flex: 1, minWidth: 0 }}>
          <span className="eyebrow" style={{ marginBottom: 5 }}><Icon n={icon} size={13} sw={2} />{kicker}</span>
          <span style={{ display: 'block', fontWeight: 700, fontSize: 14.5, letterSpacing: '-.01em', lineHeight: 1.25, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
          <span className="t3" style={{ fontSize: 12, fontWeight: 500 }}>{meta}</span>
        </span>
        <span style={{ color: 'var(--c-i)' }}><Icon n="cr" size={18} /></span>
      </button>
    </Reveal>
  );
}

export default function PageAccueil({ role, displayName = '', onNav, onOpen, onAuth }: {
  role: string;
  displayName?: string;
  onNav: (p: string) => void;
  onOpen: (type: string, item: unknown) => void;
  onAuth: (mode: string) => void;
}) {
  const [activity, setActivity] = useState(DB.ACTIVITY);
  const [counts, setCounts] = useState<Record<string, number>>({});
  // new Date() ne doit pas servir au rendu initial : l'heure/le fuseau du serveur
  // diffèrent du client → hydration mismatch (React #418). On le calcule après montage.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { getActivityRecente().then(setActivity); }, []);
  useEffect(() => { getModuleCounts().then(setCounts); }, []);
  useEffect(() => { setNow(new Date()); }, []);

  const hour = now?.getHours() ?? 12;
  const greet = hour < 5 ? 'Bonne nuit' : hour < 12 ? 'Bonjour' : hour < 18 ? 'Bel après-midi' : 'Bonsoir';
  const name = role === 'visiteur' ? '' : (displayName ? ', ' + displayName : '');
  const e = activity.enseignement;
  const hasActivity = !!(activity.annonce || activity.temoignage || activity.sortie || activity.ipb);

  return (
    <div className="screen pagefade" style={accentStyle('slate')}>
      <VerseBanner />

      <div className="hero-head">
        <Reveal>
          <div className="metaline" style={{ marginBottom: 6 }}>
            <Icon n="calendar" size={14} />
            {now ? now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : ' '}
          </div>
          <div className="h1" style={{ marginBottom: 4 }}>{greet}{name}.</div>
          <p className="lead" style={{ margin: 0 }}>« Que la grâce et la paix vous soient multipliées. » Voici la vie de la communauté aujourd&apos;hui.</p>
        </Reveal>
      </div>

      {/* featured enseignement — uniquement si un vrai enseignement existe */}
      {e && (
      <div className="section" style={{ paddingTop: 14 }}>
        <Reveal>
          <button className="card tap" style={{ ...accentStyle('ens'), width: '100%', textAlign: 'left', overflow: 'hidden' }} onClick={() => onOpen('enseignement', e)}>
            <Ph label="aperçu vidéo · 16:9" style={{ width: '100%', height: 150, borderRadius: 0 }}>
              <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                <span style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(255,255,255,.92)', display: 'grid', placeItems: 'center', color: 'var(--c)', boxShadow: 'var(--sh-2)' }}>
                  <Icon n="play" size={22} />
                </span>
              </span>
            </Ph>
            <div style={{ padding: 15 }}>
              <div style={{ display: 'flex', gap: 7, marginBottom: 9 }}>
                <Tag c="ens" icon="book">Enseignement</Tag>
                <span className="tagpill" style={{ background: 'var(--bg-soft)', color: 'var(--ink-2)' }}><Icon n="clock" size={11} sw={2.2} />{e.duree}</span>
              </div>
              <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-.02em', lineHeight: 1.2, marginBottom: 6 }}>{e.titre}</div>
              <div className="metaline"><span>{e.auteur}</span><span className="md" /><span>Série « {e.serie} »</span></div>
            </div>
          </button>
        </Reveal>
      </div>
      )}

      <div className="section-h"><h2>Explorer</h2></div>
      <div className="tilegrid">
        {DB.HUB_ORDER.map((k, i) => <Tile key={k} mkey={k} onNav={onNav} delay={i * 40} count={counts[k]} />)}
      </div>

      {/* « Cette semaine » — affichée seulement s'il existe de vraies données */}
      {hasActivity && (
      <>
      <div className="section-h"><h2>Cette semaine</h2></div>
      <div className="list" style={{ paddingBottom: 4 }}>
        {activity.annonce && (
          <ActivityCard accent="ann" icon="mega" kicker="Annonce" delay={0}
            title={activity.annonce.titre} meta={activity.annonce.date}
            thumb="affiche" onClick={() => onOpen('annonce', activity.annonce)} />
        )}
        {activity.temoignage && (
          <ActivityCard accent="tem" icon="quote" kicker="Témoignage récent" delay={50}
            title={activity.temoignage.titre} meta={activity.temoignage.auteur + ' · ' + activity.temoignage.date}
            thumb={false} onClick={() => onOpen('temoignage', activity.temoignage)} />
        )}
        {activity.sortie && (
          <ActivityCard accent="eva" icon="compass" kicker="Prochaine sortie" delay={100}
            title={activity.sortie.titre} meta={activity.sortie.date + ' · ' + activity.sortie.heure}
            thumb={false} onClick={() => onOpen('sortie', activity.sortie)} />
        )}
        {activity.ipb && (
          <ActivityCard accent="ipb" icon="cap" kicker="IPB" delay={150}
            title={activity.ipb.titre} meta={activity.ipb.date}
            thumb={false} onClick={() => onNav('ipb')} />
        )}
      </div>
      </>
      )}

      {role === 'visiteur' && (
        <div className="section" style={{ paddingTop: 14 }}>
          <Reveal>
            <div className="card" style={{ ...accentStyle('slate'), padding: 20, background: 'linear-gradient(150deg,#2c333e,#454f5e)', border: 'none', color: '#fff', position: 'relative', overflow: 'hidden' }}>
              <span style={{ position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle,rgba(226,169,63,.4),transparent 70%)' }} />
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: '#E2A93F', marginBottom: 10 }}>
                  <Icon n="sparkle" size={13} sw={2} />Rejoindre la communauté
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.2, marginBottom: 8 }}>Créez votre compte MIEC</div>
                <p style={{ margin: '0 0 16px', fontSize: 14, lineHeight: 1.5, color: 'rgba(255,255,255,.82)' }}>Sauvegardez vos favoris, soumettez témoignages et sujets de prière, et recevez les annonces par email et WhatsApp.</p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-block" style={{ background: '#fff', color: '#2c333e' }} onClick={() => onAuth('signup')}>Créer un compte</button>
                  <button className="btn" style={{ background: 'rgba(255,255,255,.12)', color: '#fff', flex: '0 0 auto' }} onClick={() => onAuth('login')}>Se connecter</button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      )}

      <div style={{ textAlign: 'center', padding: '28px 24px 8px', color: 'var(--ink-3)' }}>
        <Image src="/emblem.jpeg" alt="" width={114} height={114} style={{ opacity: .5, display: 'block', margin: '0 auto 6px' }} />
        <div style={{ fontSize: 11, marginTop: 0 }}>« Allez, faites de toutes les nations des disciples »</div>
      </div>
    </div>
  );
}
