'use client';
import React, { useState, useEffect } from 'react';
import Icon from '@/components/icons';
import { Reveal, ModuleHero, BootList, Segmented, Sheet, Spinner } from '@/components/ui';
import { accentStyle, INP_STYLE } from '@/lib/accent';
import type { FrictionConfig, IPBCours, IPBProgramme } from '@/lib/types';
import DB from '@/lib/data';
import { getIPBProgramme, getIPBCours, getIPBVitrine, IPB_VITRINE_DEFAUT, parseGalerie } from '@/lib/queries';

/* ---------- Course card (étudiant) ---------- */
function CourseCard({ c, delay, onOpen }: { c: IPBCours; delay: number; onOpen: (t: string, i: unknown) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Reveal delay={delay}>
      <div className="card" style={{ overflow: 'hidden' }}>
        <button onClick={() => setOpen(o => !o)} style={{ width: '100%', textAlign: 'left', padding: 15 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
            <span className="tagpill" style={{ background: 'var(--c-t)', color: 'var(--c-i)' }}>{c.code}</span>
            <span style={{ flex: 1 }} /><span className="t3" style={{ fontSize: 11.5, fontWeight: 600 }}>{c.fait}/{c.modules} modules</span>
            <Icon n="cd" size={17} style={{ color: 'var(--ink-3)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .3s var(--ease)' }} />
          </div>
          <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-.01em', lineHeight: 1.25, marginBottom: 5 }}>{c.titre}</div>
          <div className="t3" style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 12 }}>{c.prof}</div>
          <div style={{ height: 7, borderRadius: 4, background: 'var(--bg-soft)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: c.prog + '%', background: 'var(--c)', borderRadius: 4, transition: 'width .9s var(--ease-out)' }} />
          </div>
          <div className="metaline" style={{ fontSize: 11.5, marginTop: 7 }}>
            <span style={{ color: 'var(--c-i)', fontWeight: 700 }}>{c.prog}%</span><span>complété</span>
          </div>
        </button>
        <div style={{ maxHeight: open ? 420 : 0, overflow: 'hidden', transition: 'max-height .4s var(--ease)' }}>
          <div style={{ padding: '4px 15px 15px', borderTop: '1px solid var(--line)' }}>
            <div className="eyebrow" style={{ margin: '13px 0 10px' }}>Documentation du cours</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {c.docs.map((d, i) => (
                <button key={i} onClick={() => onOpen('doc', { ...d, course: c.titre })} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', borderRadius: 11, background: 'var(--bg-soft)', textAlign: 'left', transition: 'background .18s' }}>
                  <span style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--surface)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', color: 'var(--c-i)', flex: '0 0 auto' }}>
                    <Icon n="filetext" size={16} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 600, fontSize: 13.5, lineHeight: 1.3 }}>{d.t}</span>
                    <span className="t3" style={{ fontSize: 11.5 }}>{d.f}</span>
                  </span>
                  <Icon n={d.f === 'Texte' ? 'cr' : 'dl'} size={17} style={{ color: 'var(--ink-3)' }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/* ---------- Inscription form ---------- */
function InscriptionForm({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ nom: '', email: '', tel: '', niveau: 'Année 1' });
  const ok = f.nom && f.email && f.tel;
  function submit() { setStep(1); setTimeout(() => setStep(2), 1300); }
  return (
    <Sheet onClose={onClose}>
      {step === 2 ? (
        <div style={{ textAlign: 'center', padding: '10px 6px 6px' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--c-t)', color: 'var(--c-i)', display: 'grid', placeItems: 'center', margin: '0 auto 16px', animation: 'pop .4s var(--ease-out)' }}>
            <Icon n="check" size={32} sw={2.2} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.02em', marginBottom: 8 }}>Demande envoyée</div>
          <p className="lead" style={{ margin: '0 0 20px' }}>Merci {f.nom.split(' ')[0]}. Un responsable de l&apos;IPB vous recontactera sous quelques jours.</p>
          <button className="btn btn-primary btn-block" onClick={onClose}>Fermer</button>
        </div>
      ) : (
        <>
          <div className="eyebrow" style={{ marginBottom: 6 }}><Icon n="cap" size={14} sw={2} />Inscription IPB</div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.02em', marginBottom: 18 }}>Formulaire d&apos;inscription</div>
          {(['nom', 'email', 'tel'] as const).map((k) => (
            <label key={k} style={{ display: 'block', marginBottom: 13 }}>
              <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--ink-2)', marginBottom: 6 }}>
                {k === 'nom' ? 'Nom complet' : k === 'email' ? 'Adresse email' : 'Téléphone / WhatsApp'}
              </span>
              <input type={k === 'email' ? 'email' : k === 'tel' ? 'tel' : 'text'}
                value={f[k]} placeholder={k === 'nom' ? 'Jean Dupont' : k === 'email' ? 'jean@exemple.com' : '+237 …'}
                onChange={e => setF({ ...f, [k]: e.target.value })} style={INP_STYLE} />
            </label>
          ))}
          <label style={{ display: 'block', marginBottom: 20 }}>
            <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--ink-2)', marginBottom: 6 }}>Niveau visé</span>
            <select value={f.niveau} onChange={e => setF({ ...f, niveau: e.target.value })} style={{ ...INP_STYLE, height: 46 }}>
              <option>Année 1</option><option>Année 2</option><option>Année 3</option>
            </select>
          </label>
          <button className="btn btn-primary btn-block" disabled={!ok || step === 1} style={{ opacity: ok ? 1 : .5 }} onClick={submit}>
            {step === 1 ? <><Spinner />Envoi…</> : <>Envoyer ma demande</>}
          </button>
        </>
      )}
    </Sheet>
  );
}

/* ---------- Lightbox plein écran ---------- */
// Overlay en position:absolute (et non fixed) : le cadre .phone a un
// transform:scale(), donc `fixed` se calerait sur le cadre. `absolute inset:0`
// se résout sur .phone-screen (comme le .scrim du projet) → couvre l'écran.
function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div onClick={onClose}
      style={{
        position: 'absolute', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 12, animation: 'lb-fade .25s var(--ease-out)',
      }}>
      <style>{'@keyframes lb-fade{from{opacity:0}to{opacity:1}}@keyframes lb-zoom{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}'}</style>
      <button type="button" aria-label="Fermer" onClick={onClose}
        style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top,0px) + 12px)', right: 12, width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,255,255,.16)', color: '#fff', display: 'grid', placeItems: 'center', zIndex: 1, backdropFilter: 'blur(4px)' }}>
        <Icon n="x" size={22} sw={2} />
      </button>
      {/* stopPropagation : cliquer l'image ne ferme pas (seul le fond ferme).
          touch-action:pinch-zoom → zoom natif au pincement sur mobile. */}
      <img src={src} alt="" onClick={e => e.stopPropagation()}
        style={{ width: '100%', height: 'auto', maxHeight: '100%', objectFit: 'contain', borderRadius: 8, display: 'block', touchAction: 'pinch-zoom', animation: 'lb-zoom .3s var(--ease-out)' }} />
    </div>
  );
}

/* ---------- Volet vitrine ---------- */
function VoletVitrine({ onAuth }: { onAuth: (cfg: FrictionConfig | string) => void }) {
  const [programme, setProgramme] = useState<IPBProgramme[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(false);
  // Contenu vitrine éditable (Admin → IPB → Vitrine). Défauts = ancien contenu
  // codé en dur → aucun saut visuel ni mismatch d'hydratation au chargement.
  const [v, setV] = useState<Record<string, string>>(IPB_VITRINE_DEFAUT);
  // Lightbox : URL de l'image affichée plein écran (null = fermée).
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    getIPBProgramme().then(data => { setProgramme(data); setLoading(false); });
  }, []);
  useEffect(() => { getIPBVitrine().then(setV); }, []);

  const niveaux = Array.from(new Set(programme.map(p => p.niveau)));
  const banniere = v.banniere_url;
  const galerie = parseGalerie(v.photos_galerie);

  return (
    <div className="slidein">
      {/* Bannière épinglée — pleine largeur, en haut de la vitrine */}
      {banniere && (
        <div className="section" style={{ paddingTop: 14, paddingBottom: 0 }}>
          <Reveal>
            <img src={banniere} alt="Bannière IPB" onClick={() => setLightbox(banniere)}
              style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 16, boxShadow: 'var(--sh-2)', display: 'block', cursor: 'pointer' }} />
          </Reveal>
        </div>
      )}

      <div className="section" style={{ paddingTop: 14 }}>
        <Reveal>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Sans bannière épinglée : placeholder par défaut */}
            {!banniere && (
              <div style={{ width: '100%', height: 138, background: 'var(--c-t)', display: 'grid', placeItems: 'center', color: 'var(--c-i)' }}>
                <Icon n="cap" size={48} sw={1.2} />
              </div>
            )}
            <div style={{ padding: 16 }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}><Icon n="cap" size={14} sw={2} />{v.depuis}</div>
              <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-.02em', lineHeight: 1.2, marginBottom: 8 }}>Former des serviteurs enracinés dans la Parole</div>
              <p className="lead" style={{ margin: 0, fontSize: 14 }}>{v.description}</p>
              <div style={{ display: 'flex', gap: 9, marginTop: 16 }}>
                {[[v.cursus, 'Cursus'], [v.diplome, 'Diplôme'], [v.modalite, 'Modalité']].map((s, i) => (
                  <div key={i} style={{ flex: 1, background: 'var(--c-t)', borderRadius: 12, padding: '11px 8px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--c-i)', letterSpacing: '-.01em', lineHeight: 1.15 }}>{s[0]}</div>
                    <div className="t3" style={{ fontSize: 10.5, fontWeight: 600, marginTop: 3 }}>{s[1]}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Galerie photos — grille 2 colonnes */}
      {galerie.length > 0 && (
        <>
          <div className="section-h" style={{ marginBottom: 8 }}><h2 style={{ fontSize: 17 }}>En images</h2></div>
          <div className="section" style={{ paddingTop: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {galerie.map((u, i) => (
                <Reveal key={i} delay={i * 40} style={{ display: 'block' }}>
                  <img src={u} alt="" onClick={() => setLightbox(u)}
                    style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: 14, border: '1px solid var(--line)', display: 'block', cursor: 'pointer' }} />
                </Reveal>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="section-h" style={{ marginBottom: 8 }}><h2 style={{ fontSize: 17 }}>Programme académique</h2></div>
      <div className="section" style={{ paddingTop: 0 }}>
        {loading ? <BootList n={3} /> : niveaux.map((niv, ni) => (
          <Reveal key={niv} delay={ni * 50} style={{ marginBottom: 14, display: 'block' }}>
            <div className="eyebrow" style={{ marginBottom: 9 }}>{niv}</div>
            <div className="card" style={{ overflow: 'hidden' }}>
              {programme.filter(p => p.niveau === niv).map((p, i, arr) => (
                <div key={p.code} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px', borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 'none' }}>
                  <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 11, fontWeight: 700, color: 'var(--c-i)', background: 'var(--c-t)', padding: '4px 7px', borderRadius: 7, flex: '0 0 auto' }}>{p.code}</span>
                  <span style={{ flex: 1, fontWeight: 600, fontSize: 14, letterSpacing: '-.01em' }}>{p.titre}</span>
                  <span className="t3" style={{ fontSize: 12, fontWeight: 600, flex: '0 0 auto' }}>{p.credits} cr.</span>
                </div>
              ))}
            </div>
          </Reveal>
        ))}
      </div>

      <div className="section-h" style={{ marginBottom: 8 }}><h2 style={{ fontSize: 17 }}>Calendrier & admission</h2></div>
      <div className="section" style={{ paddingTop: 0 }}>
        <Reveal>
          <div className="card" style={{ padding: 16, marginBottom: 12 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}><Icon n="calendar" size={14} sw={2} />Dates clés 2026–2027</div>
            {[['Ouverture des inscriptions', v.date_inscriptions], ['Clôture des candidatures', v.date_cloture], ['Rentrée académique', v.date_rentree]].map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < 2 ? '1px solid var(--line)' : 'none' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--c)', flex: '0 0 auto' }} />
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>{d[0]}</span>
                <span className="t3" style={{ fontSize: 12.5, fontWeight: 600 }}>{d[1]}</span>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={60}>
          <div className="card" style={{ padding: 16 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}><Icon n="check" size={14} sw={2} />Conditions & frais</div>
            <ul style={{ margin: '0 0 14px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
              {[v.condition_1, v.condition_2, v.condition_3].map((t, i) => (
                <li key={i} style={{ display: 'flex', gap: 9, fontSize: 13.5, lineHeight: 1.4 }}>
                  <Icon n="check" size={16} sw={2.2} style={{ color: 'var(--c-i)', flex: '0 0 auto', marginTop: 1 }} />
                  <span className="muted">{t}</span>
                </li>
              ))}
            </ul>
            <div style={{ background: 'var(--c-t)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div className="t3" style={{ fontSize: 11.5, fontWeight: 700 }}>Frais de scolarité annuels</div>
                <div style={{ fontWeight: 800, fontSize: 19, color: 'var(--c-i)', letterSpacing: '-.02em' }}>{v.frais}</div>
              </div>
              <div className="t3" style={{ fontSize: 11, textAlign: 'right', lineHeight: 1.4 }}>{v.frais_note}</div>
            </div>
          </div>
        </Reveal>
      </div>

      <div className="section" style={{ paddingTop: 16 }}>
        <Reveal>
          <div className="card" style={{ padding: 20, background: 'var(--c-t)', border: '1px solid color-mix(in srgb,var(--c) 20%,var(--line))' }}>
            <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-.02em', marginBottom: 7 }}>Prêt à nous rejoindre ?</div>
            <p className="muted" style={{ margin: '0 0 16px', fontSize: 14, lineHeight: 1.5 }}>L&apos;inscription se fait en ligne, sans créer de compte membre. Un responsable vous recontactera.</p>
            <button className="btn btn-primary btn-block" onClick={() => setForm(true)}>
              <Icon n="pen" size={17} />Formulaire d&apos;inscription
            </button>
          </div>
        </Reveal>
      </div>

      {form && <InscriptionForm onClose={() => setForm(false)} />}
      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}

/* ---------- Volet cours ---------- */
function VoletCours({ etudiantIpb, onAuth, onOpen }: {
  etudiantIpb: boolean; onAuth: (cfg: FrictionConfig | string) => void; onOpen: (t: string, i: unknown) => void;
}) {
  const [cours, setCours] = useState<IPBCours[]>(DB.IPB_COURS);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    getIPBCours().then(data => { setCours(data); setLoading(false); });
  }, []);

  if (!etudiantIpb) {
    return (
      <div className="slidein section" style={{ paddingTop: 20 }}>
        <Reveal>
          <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
            <div style={{ padding: '30px 22px', textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: 17, background: 'var(--c-t)', color: 'var(--c-i)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
                <Icon n="lock" size={26} />
              </div>
              <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-.02em', marginBottom: 8 }}>Espace réservé aux étudiants</div>
              <p className="lead" style={{ margin: '0 auto 20px', maxWidth: 280 }}>Le volet Cours en ligne est accessible aux étudiants IPB. Inscrivez-vous à l&apos;école pour suivre vos modules et accéder à la documentation.</p>
              <button className="btn btn-primary" style={{ margin: '0 auto' }}
                onClick={() => onAuth({ ipb: true, title: 'Accès aux cours en ligne', benefit: "Ce volet est réservé aux étudiants de l'IPB. Inscrivez-vous à l'Institut pour accéder à votre parcours, vos modules et vos documents." })}>
                <Icon n="cap" size={17} />M&apos;inscrire à l&apos;IPB
              </button>
            </div>
            <div style={{ borderTop: '1px solid var(--line)', padding: '14px 18px', background: 'var(--bg-soft)', display: 'flex', gap: 10, alignItems: 'center' }}>
              <Icon n="info" size={17} style={{ color: 'var(--ink-3)', flex: '0 0 auto' }} />
              <span className="t3" style={{ fontSize: 12.5, lineHeight: 1.4 }}>Déjà étudiant ? Votre accès est activé par un responsable après validation de votre inscription.</span>
            </div>
          </div>
        </Reveal>
        <div style={{ marginTop: 18, position: 'relative' }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Aperçu du parcours</div>
          <div style={{ filter: 'blur(3px)', opacity: .55, pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {cours.slice(0, 2).map(c => (
              <div key={c.id} className="card" style={{ padding: 15 }}>
                <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 8 }}>{c.titre}</div>
                <div style={{ height: 7, borderRadius: 4, background: 'var(--bg-soft)' }}>
                  <div style={{ height: '100%', width: c.prog + '%', background: 'var(--c)', borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const overall = Math.round(cours.reduce((a, c) => a + c.prog, 0) / (cours.length || 1));
  const filtered = cours.filter(c => (c.titre + c.code + c.prof).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="slidein">
      <div className="section" style={{ paddingTop: 14 }}>
        <Reveal>
          <div className="card" style={{ padding: 18, background: 'linear-gradient(150deg,#5C3FA3,#7C5BC9)', border: 'none', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', opacity: .85, marginBottom: 10 }}>
              <Icon n="cap" size={13} sw={2} />Mon parcours · Année 1
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 12 }}>
              <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1 }}>{overall}%</div>
              <div style={{ fontSize: 13, opacity: .85, marginBottom: 5 }}>de progression globale</div>
            </div>
            <div style={{ height: 8, borderRadius: 5, background: 'rgba(255,255,255,.22)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: overall + '%', background: '#fff', borderRadius: 5, transition: 'width 1s var(--ease-out)' }} />
            </div>
            <div style={{ display: 'flex', gap: 18, marginTop: 14 }}>
              <div><div style={{ fontSize: 20, fontWeight: 800 }}>{cours.length}</div><div style={{ fontSize: 11, opacity: .8 }}>cours actifs</div></div>
              <div><div style={{ fontSize: 20, fontWeight: 800 }}>{cours.reduce((a, c) => a + c.fait, 0)}</div><div style={{ fontSize: 11, opacity: .8 }}>modules faits</div></div>
            </div>
          </div>
        </Reveal>
      </div>
      <div style={{ padding: '8px 0 4px' }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher dans mes cours…" className="searchbar" style={{ margin: '0 16px', display: 'flex', width: 'calc(100% - 32px)' }} />
      </div>
      <div className="section-h" style={{ marginBottom: 8 }}><h2 style={{ fontSize: 17 }}>Mes cours</h2></div>
      {loading ? <BootList /> : filtered.length
        ? <div className="list">{filtered.map((c, i) => <CourseCard key={c.id} c={c} delay={i * 55} onOpen={onOpen} />)}</div>
        : <div className="section"><p className="t3">Aucun cours trouvé.</p></div>}
    </div>
  );
}

/* ---------- Page IPB ---------- */
export default function PageIPB({ etudiantIpb = false, onAuth, onOpen, ipbTab, setIpbTab }: {
  etudiantIpb?: boolean;
  onAuth: (cfg: FrictionConfig | string) => void;
  onOpen: (t: string, i: unknown) => void;
  ipbTab: string;
  setIpbTab: (v: string) => void;
}) {
  return (
    <div className="screen pagefade" style={accentStyle('ipb')}>
      <ModuleHero mkey="ipb" />
      <Segmented
        tabs={[{ v: 'vitrine', l: 'Vitrine', icon: 'home' }, { v: 'cours', l: 'Cours en ligne', icon: 'book' }]}
        active={ipbTab} onPick={setIpbTab}
      />
      {ipbTab === 'vitrine'
        ? <VoletVitrine onAuth={onAuth} />
        : <VoletCours etudiantIpb={etudiantIpb} onAuth={onAuth} onOpen={onOpen} />}
    </div>
  );
}
