'use client';
import React, { useState, useEffect, useRef } from 'react';
import Icon from '@/components/icons';
import { Reveal, Tag, Ph, Lightbox } from '@/components/ui';
import { accentStyle, RES_ICON } from '@/lib/accent';
import { getParticipation, toggleParticipation, getParticipantsCount } from '@/lib/queries';
import type { Enseignement, Temoignage, Annonce, Sortie, Livre, Priere, Ressource, FrictionConfig } from '@/lib/types';

/* ---------- galerie de photos (taille naturelle, ouverture au clic) ---------- */
function PhotoStrip({ photos, alt = '' }: { photos?: string[]; alt?: string }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!photos || photos.length === 0) return null;
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {photos.map((src, i) => (
          // height:auto → la photo garde son ratio, elle n'est pas déformée/recadrée.
          <img key={i} src={src} alt={alt} loading="lazy" onClick={() => setOpen(src)}
            style={{ width: '100%', height: 'auto', display: 'block', cursor: 'zoom-in' }} />
        ))}
      </div>
      {open && (
        <div onClick={() => setOpen(null)} role="dialog" aria-modal="true"
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,.93)', display: 'grid', placeItems: 'center', padding: 16 }}>
          <img src={open} alt={alt} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          <button onClick={() => setOpen(null)} aria-label="Fermer"
            style={{ position: 'absolute', top: 14, right: 14, width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,.55)', border: '1.5px solid rgba(255,255,255,.7)', color: '#fff', display: 'grid', placeItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,.4)' }}>
            <Icon n="x" size={22} sw={2.4} />
          </button>
        </div>
      )}
    </>
  );
}

/* ---------- shared detail header ---------- */
function DetailTop({ back, label }: { back: () => void; label: string }) {
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 30, background: 'color-mix(in srgb,var(--bg) 82%,transparent)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 6, padding: '9px 12px' }}>
      <button className="iconbtn" onClick={back}><Icon n="cl" size={22} /></button>
      <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-.01em', color: 'var(--c-i)' }}>{label}</span>
    </div>
  );
}

function FavBtn({ on, onTog }: { on: boolean; onTog: () => void }) {
  return (
    <button className="iconbtn" onClick={onTog} style={{ color: on ? 'var(--c)' : 'var(--ink-2)', transition: 'transform .2s' }}>
      <Icon n="heart" size={21} fill={on ? 'currentColor' : 'none'} />
    </button>
  );
}

/* ---------- Enseignement ---------- */
export function DEnseignement({ item: e, back, fav, onFav, onShare }: {
  item: Enseignement; back: () => void; fav: boolean; onFav: () => void; onShare: () => void;
}) {
  function handleShare() {
    // Partage natif (feuille de partage iOS/Android) si disponible, sinon
    // copie du lien dans le presse-papier + toast « Lien copié » (via onShare).
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: e.titre, text: e.excerpt, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      onShare();
    }
  }
  return (
    <div className="screen slidein" style={{ ...accentStyle('ens'), paddingBottom: 40 }}>
      <DetailTop back={back} label="Enseignement" />
      {e.yt && (
        <iframe
          width="100%"
          height="200"
          src={`https://www.youtube.com/embed/${e.yt}`}
          title={e.titre}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ display: 'block', border: 0 }}
        />
      )}
      <div style={{ padding: '18px 18px 0' }}>
        <div style={{ display: 'flex', gap: 7, marginBottom: 13 }}>
          <Tag c="ens" icon="book">{e.serie}</Tag>
          <span className="tagpill" style={{ background: 'var(--bg-soft)', color: 'var(--ink-2)' }}><Icon n="clock" size={11} sw={2.2} />{e.duree}</span>
          <span style={{ flex: 1 }} /><FavBtn on={fav} onTog={onFav} />
          <button className="iconbtn" onClick={handleShare} style={{ color: 'var(--ink-2)' }}><Icon n="share" size={19} /></button>
        </div>
        <h1 className="h1" style={{ fontSize: 25, marginBottom: 12 }}>{e.titre}</h1>
        <div className="metaline" style={{ fontSize: 13, marginBottom: 18 }}>
          <span className="avatar" style={{ width: 30, height: 30, fontSize: 11, background: 'var(--c)' }}>{e.auteur.split(' ').slice(-1)[0].slice(0, 1)}</span>
          <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{e.auteur}</span><span className="md" /><span>{e.date}</span>
        </div>
        {e.texte && (
          <p style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 16, color: 'var(--ink-2)', whiteSpace: 'pre-wrap' }}>
            {e.texte}
          </p>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button className="btn btn-soft" style={{ flex: 1 }} onClick={handleShare}><Icon n="share" size={17} />Partager</button>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onFav}><Icon n="bookmark" size={17} fill={fav ? 'currentColor' : 'none'} />{fav ? 'Enregistré' : 'Enregistrer'}</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Témoignage ---------- */
export function DTemoignage({ item: t, back, fav, onFav, onShare }: {
  item: Temoignage; back: () => void; fav: boolean; onFav: () => void; onShare: () => void;
}) {
  return (
    <div className="screen slidein" style={{ ...accentStyle('tem'), paddingBottom: 40 }}>
      <DetailTop back={back} label="Témoignage" />
      <div style={{ padding: '22px 20px 0' }}>
        <span style={{ fontFamily: 'Newsreader,serif', fontSize: 64, lineHeight: .5, color: 'var(--c)', opacity: .45, display: 'block', height: 34 }}>&ldquo;</span>
        <div style={{ display: 'flex', gap: 7, margin: '8px 0 14px' }}><Tag c="tem">{t.cat}</Tag><span style={{ flex: 1 }} /><FavBtn on={fav} onTog={onFav} /></div>
        <h1 className="h1" style={{ fontSize: 26, marginBottom: 18 }}>{t.titre}</h1>
        <p style={{ fontFamily: 'Newsreader,serif', fontSize: 19, fontStyle: 'italic', lineHeight: 1.6, color: 'var(--ink)', marginBottom: 20 }}>{t.full}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '14px 16px', background: 'var(--c-t)', borderRadius: 14, marginBottom: 20 }}>
          <span className="avatar" style={{ width: 42, height: 42, fontSize: 15, background: 'var(--c)' }}>{t.auteur.slice(0, 1)}</span>
          <div><div style={{ fontWeight: 700, fontSize: 15 }}>{t.auteur}</div><div className="t3" style={{ fontSize: 12.5 }}>Membre · {t.date}</div></div>
        </div>
        <button className="btn btn-soft btn-block" onClick={onShare}><Icon n="share" size={17} />Partager ce témoignage</button>
      </div>
    </div>
  );
}

/* ---------- Annonce ---------- */
export function DAnnonce({ item: a, back, fav, onFav, onShare }: {
  item: Annonce; back: () => void; fav: boolean; onFav: () => void; onShare: () => void;
}) {
  return (
    <div className="screen slidein" style={{ ...accentStyle('ann'), paddingBottom: 40 }}>
      <DetailTop back={back} label="Annonce" />
      <PhotoStrip photos={a.photos} alt={a.titre} />
      <div style={{ padding: '18px 20px 0' }}>
        <div style={{ display: 'flex', gap: 7, marginBottom: 14 }}>
          <Tag c="ann" icon="mega">{a.cat}</Tag>
          {a.urgent && <span className="tagpill" style={{ background: 'var(--m-tem-t)', color: 'var(--m-tem-i)' }}>À ne pas manquer</span>}
          <span style={{ flex: 1 }} /><FavBtn on={fav} onTog={onFav} />
        </div>
        <h1 className="h1" style={{ fontSize: 25, marginBottom: 14 }}>{a.titre}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 15px', background: 'var(--c-t)', borderRadius: 13, marginBottom: 18 }}>
          <span style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--c)', color: '#fff', display: 'grid', placeItems: 'center' }}><Icon n="calendar" size={19} /></span>
          <div><div className="t3" style={{ fontSize: 11.5, fontWeight: 700 }}>Date</div><div style={{ fontWeight: 700, fontSize: 15 }}>{a.date}</div></div>
        </div>
        <p className="muted" style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 20 }}>{a.full}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" style={{ flex: 1 }}><Icon n="calendar" size={17} />Ajouter au calendrier</button>
          <button className="btn btn-ghost" onClick={onShare} style={{ flex: '0 0 auto' }}><Icon n="share" size={17} /></button>
        </div>
      </div>
    </div>
  );
}

/* ---------- carrousel bannière (réutilisé : détail sortie + vitrine IPB) ---------- */
export function SortieBanner({ photos, onOpen }: { photos: string[]; onOpen: (i: number) => void }) {
  const [i, setI] = useState(0);
  const n = photos.length;
  const touchX = useRef<number | null>(null);

  function onTouchStart(e: React.TouchEvent) { touchX.current = e.touches[0].clientX; }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    // swipe gauche (dx<0) → photo suivante ; swipe droite → précédente.
    if (Math.abs(dx) > 40) setI(p => (p + (dx < 0 ? 1 : -1) + n) % n);
  }

  return (
    <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <img src={photos[i]} alt="" onClick={() => onOpen(i)}
        style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block', cursor: 'zoom-in' }} />
      {n > 1 && (
        <>
          {/* compteur 1 / N — bas droite */}
          <div style={{ position: 'absolute', right: 10, bottom: 10, background: 'rgba(0,0,0,.6)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 20, backdropFilter: 'blur(4px)' }}>{i + 1} / {n}</div>
          {/* flèches (desktop) */}
          <button type="button" aria-label="Photo précédente" onClick={() => setI(p => (p - 1 + n) % n)}
            style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,.45)', color: '#fff', display: 'grid', placeItems: 'center', backdropFilter: 'blur(4px)' }}>
            <Icon n="cl" size={20} />
          </button>
          <button type="button" aria-label="Photo suivante" onClick={() => setI(p => (p + 1) % n)}
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,.45)', color: '#fff', display: 'grid', placeItems: 'center', backdropFilter: 'blur(4px)' }}>
            <Icon n="cr" size={20} />
          </button>
          {/* points de navigation — bas centre */}
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 11, display: 'flex', justifyContent: 'center', gap: 6 }}>
            {photos.map((_, k) => (
              <button key={k} type="button" aria-label={`Photo ${k + 1}`} onClick={() => setI(k)}
                style={{ width: k === i ? 18 : 6, height: 6, borderRadius: 3, padding: 0, border: 'none', background: k === i ? '#fff' : 'rgba(255,255,255,.55)', transition: 'width .2s' }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- Sortie ---------- */
export function DSortie({ item: s, back, onShare, role, profileId, onAuth }: {
  item: Sortie; back: () => void; onShare: () => void;
  role: string; profileId?: string; onAuth: (cfg: FrictionConfig | string) => void;
}) {
  const passee = s.statut === 'passee';
  const [participe, setParticipe] = useState(false);
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [lb, setLb] = useState<number | null>(null);   // index photo ouverte en lightbox
  const photos = s.photos ?? [];

  useEffect(() => {
    if (!s.id) return;
    getParticipantsCount(s.id).then(setCount);
    if (profileId) getParticipation(s.id, profileId).then(setParticipe);
    else setParticipe(false);
  }, [s.id, profileId]);

  async function toggle() {
    // Visiteur (ou non connecté) → friction douce, pas d'écriture.
    if (role === 'visiteur' || !profileId) {
      onAuth({ title: 'Rejoindre cette sortie', benefit: "Connectez-vous pour vous inscrire à une sortie d'évangélisation et rejoindre l'équipe." });
      return;
    }
    if (busy) return;
    setBusy(true);
    const next = !participe;                              // mise à jour optimiste
    setParticipe(next);
    setCount(c => Math.max(0, c + (next ? 1 : -1)));
    try {
      await toggleParticipation(s.id, profileId);
    } catch {
      setParticipe(!next);                               // rollback en cas d'échec
      setCount(c => Math.max(0, c + (next ? -1 : 1)));
    }
    setBusy(false);
  }

  return (
    <div className="screen slidein" style={{ ...accentStyle('eva'), paddingBottom: 40 }}>
      <DetailTop back={back} label={passee ? 'Rapport de sortie' : "Sortie d'évangélisation"} />
      {photos.length > 0
        ? <SortieBanner photos={photos} onOpen={(idx) => setLb(idx)} />
        : <Ph label="Sortie d'évangélisation" style={{ width: '100%', height: 200 }} />}
      <div style={{ padding: '18px 20px 0' }}>
        <div style={{ display: 'flex', gap: 7, marginBottom: 13 }}>
          <Tag c="eva" icon="sparkle">Thème · {s.theme}</Tag>
          {passee
            ? <span className="tagpill" style={{ background: 'var(--bg-soft)', color: 'var(--ink-2)' }}><Icon n="check" size={11} sw={2.4} />Terminée</span>
            : <span className="tagpill" style={{ background: 'var(--c-t)', color: 'var(--c-i)' }}><Icon n="clock" size={11} sw={2.2} />À venir</span>}
        </div>
        <h1 className="h1" style={{ fontSize: 24, marginBottom: 14 }}>{s.titre}</h1>
        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          <div style={{ flex: 1, background: 'var(--c-t)', borderRadius: 12, padding: '12px 14px' }}><div className="t3" style={{ fontSize: 11, fontWeight: 700, marginBottom: 3 }}>Date</div><div style={{ fontWeight: 700, fontSize: 14 }}>{s.date}</div></div>
          <div style={{ flex: 1, background: 'var(--c-t)', borderRadius: 12, padding: '12px 14px' }}><div className="t3" style={{ fontSize: 11, fontWeight: 700, marginBottom: 3 }}>Heure</div><div style={{ fontWeight: 700, fontSize: 14 }}>{s.heure}</div></div>
        </div>
        {passee && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            {([['users', s.equipe, 'équipiers'], ['chart', s.contacts, 'contacts'], ['heart', s.decisions, 'décisions']] as [string, number | undefined, string][]).map((m, i) => (
              <div key={i} style={{ flex: 1, border: '1px solid var(--line)', borderRadius: 13, padding: '13px 8px', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--c-i)', marginBottom: 5 }}><Icon n={m[0]} size={17} /></div>
                <div style={{ fontWeight: 800, fontSize: 21, letterSpacing: '-.02em' }}>{m[1]}</div>
                <div className="t3" style={{ fontSize: 10.5, fontWeight: 600 }}>{m[2]}</div>
              </div>
            ))}
          </div>
        )}
        <div className="eyebrow" style={{ marginBottom: 9 }}>{passee ? 'Résumé' : 'Programme'}</div>
        <p className="muted" style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 20 }}>{s.full}</p>
        {!passee ? (
          <>
            <button className={'btn btn-block ' + (participe ? 'btn-soft' : 'btn-primary')} onClick={toggle} disabled={busy}>
              <Icon n="check" size={18} />{participe ? 'Je ne participe plus' : 'Je participe'}
            </button>
            <div className="t3" style={{ textAlign: 'center', fontSize: 12.5, marginTop: 10 }}>
              {count > 0 ? `${count} participant${count > 1 ? 's' : ''}` : 'Soyez le premier à participer'}
            </div>
          </>
        ) : (
          <button className="btn btn-soft btn-block" onClick={onShare}><Icon n="share" size={17} />Partager le rapport</button>
        )}
      </div>
      {lb !== null && photos.length > 0 && <Lightbox photos={photos} start={lb} onClose={() => setLb(null)} />}
    </div>
  );
}

/* ---------- Livre ---------- */
export function DLivre({ item: b, back, fav, onFav }: {
  item: Livre; back: () => void; fav: boolean; onFav: () => void;
}) {
  return (
    <div className="screen slidein" style={{ ...accentStyle('res'), paddingBottom: 40 }}>
      <DetailTop back={back} label="Librairie" />
      <div style={{ padding: '20px 20px 0', display: 'flex', gap: 18 }}>
        {b.couverture
          ? <img src={b.couverture} alt={b.titre} style={{ width: 118, height: 166, flex: '0 0 auto', borderRadius: 12, objectFit: 'cover', boxShadow: 'var(--sh-3)' }} />
          : <Ph label="couverture" style={{ width: 118, height: 166, flex: '0 0 auto', borderRadius: 12, boxShadow: 'var(--sh-3)' }} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Tag c="res">{b.cat}</Tag>
          <h1 className="h1" style={{ fontSize: 22, margin: '10px 0 6px' }}>{b.titre}</h1>
          <div className="t3" style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 10 }}>{b.auteur}</div>
          <div className="metaline" style={{ fontSize: 12 }}><span>{b.annee}</span><span className="md" /><Icon n="book" size={13} /><span>{b.pages} p.</span></div>
        </div>
      </div>
      <div style={{ padding: '20px 20px 0' }}>
        <p className="muted" style={{ fontSize: 15, lineHeight: 1.65, marginBottom: 18 }}>{b.desc}</p>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Extrait</div>
        <div style={{ fontFamily: 'Newsreader,serif', fontSize: 18, fontStyle: 'italic', lineHeight: 1.6, color: 'var(--ink)', padding: '18px 20px', background: 'var(--c-t)', borderRadius: 14, marginBottom: 22 }}>{b.extrait}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {b.lien_acces
            ? <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => b.lien_acces && window.open(b.lien_acces, '_blank', 'noopener,noreferrer')}><Icon n="book" size={17} />Lire / Accéder</button>
            : <button className="btn btn-primary" style={{ flex: 1, opacity: .5 }} disabled><Icon n="book" size={17} />Non disponible</button>}
          <button className="btn btn-ghost" onClick={onFav} style={{ flex: '0 0 auto' }}>
            <Icon n="heart" size={18} fill={fav ? 'currentColor' : 'none'} style={{ color: fav ? 'var(--c)' : 'inherit' }} />
          </button>
          <button className="btn btn-ghost" style={{ flex: '0 0 auto' }}><Icon n="dl" size={18} /></button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Prière ---------- */
export function DPriere({ item: p, back, prayed, onPray }: {
  item: Priere; back: () => void; prayed: string[]; onPray: (id: string) => void;
}) {
  const on = prayed.includes(p.id);
  const count = p.prie + (on ? 1 : 0);
  return (
    <div className="screen slidein" style={{ ...accentStyle('pri'), paddingBottom: 40 }}>
      <DetailTop back={back} label="Sujet de prière" />
      <div style={{ padding: '22px 20px 0' }}>
        <div style={{ display: 'flex', gap: 7, marginBottom: 14 }}>
          <Tag c="pri">{p.cat}</Tag>
          {p.urgent && <span className="tagpill" style={{ background: 'var(--m-tem-t)', color: 'var(--m-tem-i)' }}><Icon n="flame" size={11} sw={2.2} />Urgent</span>}
        </div>
        <h1 className="h1" style={{ fontSize: 24, marginBottom: 16 }}>{p.sujet}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 20 }}>
          <span className="avatar" style={{ width: 40, height: 40, fontSize: 14, background: 'var(--c)' }}>{p.auteur.slice(0, 1)}</span>
          <div><div style={{ fontWeight: 700, fontSize: 14.5 }}>{p.auteur}</div><div className="t3" style={{ fontSize: 12.5 }}>{p.date}</div></div>
        </div>
        <p className="muted" style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 22 }}>{p.full}</p>
        <div style={{ background: 'var(--c-t)', borderRadius: 16, padding: 18, textAlign: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--c-i)', letterSpacing: '-.02em' }}>{count}</div>
          <div className="muted" style={{ fontSize: 13, marginBottom: 14 }}>personnes prient pour ce sujet</div>
          <button className="btn btn-block btn-primary" onClick={() => onPray(p.id)} style={{ opacity: on ? .7 : 1 }}>
            <Icon n="flame" size={18} sw={2} />{on ? 'Vous priez 🙏' : 'Je prie pour ce sujet'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Document ---------- */
export function DDoc({ item: d, back }: {
  item: { t: string; f: string; course?: string }; back: () => void;
}) {
  return (
    <div className="screen slidein" style={{ ...accentStyle('ipb'), paddingBottom: 40 }}>
      <DetailTop back={back} label={d.course ?? 'Document'} />
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 20 }}>
          <span style={{ width: 54, height: 54, borderRadius: 14, background: 'var(--c-t)', color: 'var(--c-i)', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>
            <Icon n="filetext" size={26} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-.01em', lineHeight: 1.25 }}>{d.t}</div>
            <div className="t3" style={{ fontSize: 12.5, fontWeight: 600, marginTop: 3 }}>{d.f}</div>
          </div>
        </div>
        <Ph label="aperçu du document" style={{ width: '100%', height: 280, borderRadius: 14, marginBottom: 18 }} />
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" style={{ flex: 1 }}><Icon n="book" size={17} />Consulter</button>
          <button className="btn btn-soft" style={{ flex: 1 }}><Icon n="dl" size={17} />Télécharger</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Ressource ---------- */
export function DRessource({ item: r, back }: {
  item: Ressource; back: () => void;
}) {
  return (
    <div className="screen slidein" style={{ ...accentStyle('res'), paddingBottom: 40 }}>
      <DetailTop back={back} label="Ressource" />
      <div style={{ padding: '22px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 20 }}>
          <span style={{ width: 58, height: 58, borderRadius: 15, background: 'var(--c-t)', color: 'var(--c-i)', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>
            <Icon n={RES_ICON[r.type] ?? 'filetext'} size={28} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}><Tag c="res">{r.fmt}</Tag><div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-.01em', lineHeight: 1.25, marginTop: 7 }}>{r.titre}</div></div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, background: 'var(--bg-soft)', borderRadius: 12, padding: '11px 14px' }}><div className="t3" style={{ fontSize: 11, fontWeight: 700 }}>Catégorie</div><div style={{ fontWeight: 700, fontSize: 13.5 }}>{r.cat}</div></div>
          <div style={{ flex: 1, background: 'var(--bg-soft)', borderRadius: 12, padding: '11px 14px' }}><div className="t3" style={{ fontSize: 11, fontWeight: 700 }}>Taille</div><div style={{ fontWeight: 700, fontSize: 13.5 }}>{r.taille}</div></div>
        </div>
        {r.type === 'audio'
          ? <div style={{ background: 'var(--c-t)', borderRadius: 16, padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
              <button style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--c)', color: '#fff', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}><Icon n="play" size={22} /></button>
              <div style={{ flex: 1 }}>
                <div style={{ height: 6, borderRadius: 3, background: 'rgba(0,0,0,.08)', marginBottom: 7 }}><div style={{ height: '100%', width: '32%', background: 'var(--c)', borderRadius: 3 }} /></div>
                <div className="t3" style={{ fontSize: 11.5, display: 'flex', justifyContent: 'space-between' }}><span>2:00</span><span>{r.taille}</span></div>
              </div>
            </div>
          : r.photo
            ? <PhotoStrip photos={[r.photo]} alt={r.titre} />
            : <Ph label="aperçu du fichier" style={{ width: '100%', height: 260, borderRadius: 14 }} />}
        <button className="btn btn-primary btn-block" style={{ marginTop: 18, opacity: r.fichier ? 1 : .5 }} disabled={!r.fichier}
          onClick={() => r.fichier && window.open(r.fichier, '_blank', 'noopener,noreferrer')}>
          <Icon n="dl" size={18} />Télécharger</button>
      </div>
    </div>
  );
}
