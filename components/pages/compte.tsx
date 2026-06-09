'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import Icon from '@/components/icons';
import { Reveal, Toggle, Sheet, Spinner } from '@/components/ui';
import { accentStyle, INP_STYLE } from '@/lib/accent';
import type { FavItem, AccentKey } from '@/lib/types';
import DB from '@/lib/data';

/* ---------- Auth screen ---------- */
export function AuthScreen({ mode: initial = 'login', onLogin }: {
  mode?: string; onLogin: () => void;
}) {
  const [mode, setMode] = useState(initial);
  const signup = mode === 'signup';
  const [f, setF] = useState({ nom: '', email: '', pass: '' });
  const [busy, setBusy] = useState(false);
  const ok = f.email && f.pass && (!signup || f.nom);
  function go() { if (!ok) return; setBusy(true); setTimeout(() => onLogin(), 1100); }
  return (
    <div className="screen pagefade" style={{ ...accentStyle('slate'), paddingTop: 8 }}>
      <div style={{ padding: '30px 24px 0', textAlign: 'center' }}>
        <Reveal>
          <Image src="/emblem.jpeg" alt="MIEC" width={160} height={160} style={{ objectFit: 'contain', display: 'block', margin: '0 auto 20px' }} />
          <h1 className="h1" style={{ fontSize: 26, marginBottom: 8 }}>{signup ? 'Rejoindre MIEC' : 'Bon retour'}</h1>
          <p className="lead" style={{ margin: '0 auto', maxWidth: 290 }}>
            {signup ? 'Créez votre compte pour participer pleinement à la vie de la communauté.' : 'Connectez-vous à votre espace communautaire.'}
          </p>
        </Reveal>
      </div>
      <div style={{ padding: '26px 24px 0' }}>
        <Reveal delay={80}>
          {signup && (
            <label style={{ display: 'block', marginBottom: 13 }}>
              <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--ink-2)', marginBottom: 6 }}>Nom complet</span>
              <input value={f.nom} onChange={e => setF({ ...f, nom: e.target.value })} placeholder="Grâce Mbarga" style={INP_STYLE} />
            </label>
          )}
          <label style={{ display: 'block', marginBottom: 13 }}>
            <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--ink-2)', marginBottom: 6 }}>Adresse email</span>
            <input type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} placeholder="vous@exemple.com" style={INP_STYLE} />
          </label>
          <label style={{ display: 'block', marginBottom: 18 }}>
            <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--ink-2)', marginBottom: 6 }}>Mot de passe</span>
            <input type="password" value={f.pass} onChange={e => setF({ ...f, pass: e.target.value })} placeholder="••••••••" style={INP_STYLE} />
          </label>
          <button className="btn btn-primary btn-block" style={{ height: 50, opacity: ok ? 1 : .55 }} disabled={!ok || busy} onClick={go}>
            {busy ? <><Spinner />{signup ? 'Création…' : 'Connexion…'}</> : (signup ? 'Créer mon compte' : 'Se connecter')}
          </button>
        </Reveal>
        {signup && (
          <Reveal delay={140}>
            <div style={{ margin: '20px 0', display: 'flex', flexDirection: 'column', gap: 11 }}>
              {[['heart', 'Sauvegardez vos favoris et reprenez où vous en étiez'], ['quote', 'Soumettez témoignages et sujets de prière'], ['mail', 'Recevez les annonces par email et WhatsApp']].map((b, i) => (
                <div key={i} style={{ display: 'flex', gap: 11, alignItems: 'center' }}>
                  <span style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--bg-soft)', color: 'var(--ink-2)', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>
                    <Icon n={b[0]} size={17} />
                  </span>
                  <span className="muted" style={{ fontSize: 13.5, lineHeight: 1.4 }}>{b[1]}</span>
                </div>
              ))}
            </div>
          </Reveal>
        )}
        <div style={{ textAlign: 'center', marginTop: 22, fontSize: 13.5 }} className="muted">
          {signup ? 'Déjà un compte ? ' : 'Pas encore de compte ? '}
          <button onClick={() => setMode(signup ? 'login' : 'signup')} style={{ fontWeight: 700, color: 'var(--brand-slate)' }}>
            {signup ? 'Se connecter' : 'Créer un compte'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Submit sheet ---------- */
export function SubmitSheet({ config, onClose }: {
  config: { mod: string; title: string };
  onClose: () => void;
}) {
  const pri = config.mod === 'priere';
  const [step, setStep] = useState(0);
  const [v, setV] = useState({ titre: '', texte: '', anon: false });
  const ok = v.titre && v.texte;
  function go() { setStep(1); setTimeout(() => setStep(2), 1200); }
  return (
    <Sheet onClose={onClose}>
      {step === 2 ? (
        <div style={{ textAlign: 'center', padding: '8px 6px', ...accentStyle(pri ? 'pri' : 'tem') }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--c-t)', color: 'var(--c-i)', display: 'grid', placeItems: 'center', margin: '0 auto 16px', animation: 'pop .4s var(--ease-out)' }}>
            <Icon n="check" size={32} sw={2.2} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.02em', marginBottom: 8 }}>{pri ? 'Sujet déposé' : 'Témoignage envoyé'}</div>
          <p className="lead" style={{ margin: '0 0 20px' }}>
            {pri ? 'La communauté pourra désormais prier avec vous.' : 'Merci ! Votre témoignage sera relu puis publié pour encourager la communauté.'}
          </p>
          <button className="btn btn-primary btn-block" onClick={onClose}>Fermer</button>
        </div>
      ) : (
        <div style={accentStyle(pri ? 'pri' : 'tem')}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>
            <Icon n={pri ? 'flame' : 'quote'} size={14} sw={2} />{pri ? 'Sujet de prière' : 'Témoignage'}
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.02em', marginBottom: 16 }}>{config.title}</div>
          <label style={{ display: 'block', marginBottom: 13 }}>
            <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--ink-2)', marginBottom: 6 }}>{pri ? 'Sujet' : 'Titre'}</span>
            <input value={v.titre} onChange={e => setV({ ...v, titre: e.target.value })} placeholder={pri ? 'Pour…' : 'Ce que Dieu a fait…'} style={INP_STYLE} />
          </label>
          <label style={{ display: 'block', marginBottom: 13 }}>
            <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--ink-2)', marginBottom: 6 }}>{pri ? 'Détails' : 'Votre récit'}</span>
            <textarea value={v.texte} onChange={e => setV({ ...v, texte: e.target.value })} rows={4} placeholder="Partagez en quelques mots…"
              style={{ ...INP_STYLE, height: 'auto', padding: '12px 15px', resize: 'none', lineHeight: 1.5 }} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, cursor: 'pointer' }}>
            <Toggle on={v.anon} onTog={() => setV({ ...v, anon: !v.anon })} accent={pri ? 'pri' : 'tem'} />
            <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-2)' }}>Publier de façon anonyme</span>
          </label>
          <button className="btn btn-primary btn-block" disabled={!ok || step === 1} style={{ opacity: ok ? 1 : .5 }} onClick={go}>
            {step === 1 ? <><Spinner />Envoi…</> : (pri ? 'Déposer le sujet' : 'Envoyer pour validation')}
          </button>
        </div>
      )}
    </Sheet>
  );
}

/* ---------- Page Compte ---------- */
export default function PageCompte({ role, onLogin, favs, onOpen, onNav, notif, setNotif, onLogout }: {
  role: string; onLogin: () => void;
  favs: FavItem[]; onOpen: (t: string, i: unknown) => void;
  onNav: (p: string, params?: string) => void;
  notif: Record<string, boolean>; setNotif: (n: Record<string, boolean>) => void;
  onLogout: () => void;
}) {
  if (role === 'visiteur') return <AuthScreen onLogin={onLogin} />;
  const etu = role === 'etudiant';
  const submitted = [
    { ...DB.TEMOIGNAGES[0], statut: 'publie' },
    { titre: 'Délivré de la peur', cat: 'Libération', date: 'il y a 3 jours', statut: 'attente' },
  ];
  const history = [
    { type: 'enseignement', item: DB.ENSEIGNEMENTS[0], icon: 'book', accent: 'ens' as AccentKey, label: 'Enseignement', when: 'il y a 1 h' },
    { type: 'annonce', item: DB.ANNONCES[1], icon: 'mega', accent: 'ann' as AccentKey, label: 'Annonce', when: 'hier' },
    { type: 'sortie', item: DB.SORTIES[2], icon: 'compass', accent: 'eva' as AccentKey, label: 'Rapport', when: 'il y a 2 j' },
  ];
  return (
    <div className="screen pagefade" style={accentStyle('slate')}>
      <div style={{ padding: '22px 20px 0' }}>
        <Reveal>
          <div className="card" style={{ padding: 20, background: 'linear-gradient(150deg,#2c333e,#454f5e)', border: 'none', color: '#fff', position: 'relative', overflow: 'hidden' }}>
            <span style={{ position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle,rgba(226,169,63,.35),transparent 70%)' }} />
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 15 }}>
              <span style={{ width: 62, height: 62, borderRadius: '50%', background: 'rgba(255,255,255,.16)', border: '2px solid rgba(255,255,255,.35)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 22 }}>
                {etu ? 'AB' : 'GM'}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-.02em' }}>{etu ? 'Abel Bcongo' : 'Grâce Mbarga'}</div>
                <div style={{ display: 'flex', gap: 7, marginTop: 7 }}>
                  <span className="tagpill" style={{ background: 'rgba(255,255,255,.16)', color: '#fff' }}><Icon n="check" size={11} sw={2.4} />Membre</span>
                  {etu && <span className="tagpill" style={{ background: 'rgba(124,91,201,.9)', color: '#fff' }}><Icon n="cap" size={11} sw={2} />Étudiant IPB</span>}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {etu && (
        <>
          <div className="section-h" style={{ margin: '22px 16px 12px' }}><h2 style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}><Icon n="cap" size={18} />Mon parcours IPB</h2></div>
          <div className="section" style={{ paddingTop: 0 }}>
            <Reveal>
              <button className="card tap" style={{ ...accentStyle('ipb'), width: '100%', textAlign: 'left', padding: 16 }} onClick={() => onNav('ipb', 'cours')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--c)', color: '#fff', display: 'grid', placeItems: 'center' }}><Icon n="cap" size={21} /></span>
                  <div style={{ flex: 1 }}><div style={{ fontWeight: 800, fontSize: 15.5 }}>Année 1 · Semestre 2</div><div className="t3" style={{ fontSize: 12.5, fontWeight: 600 }}>{DB.IPB_COURS.length} cours actifs</div></div>
                  <Icon n="cr" size={18} style={{ color: 'var(--c-i)' }} />
                </div>
                <div style={{ height: 7, borderRadius: 4, background: 'var(--bg-soft)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '38%', background: 'var(--c)', borderRadius: 4 }} />
                </div>
                <div className="metaline" style={{ fontSize: 11.5, marginTop: 7 }}>
                  <span style={{ color: 'var(--c-i)', fontWeight: 700 }}>38%</span><span>de progression · accéder à mes documents</span>
                </div>
              </button>
            </Reveal>
          </div>
        </>
      )}

      <div className="section-h" style={{ margin: '22px 16px 12px' }}><h2 style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}><Icon n="heart" size={18} />Favoris</h2></div>
      {favs.length ? (
        <div className="list" style={{ paddingTop: 0 }}>
          {favs.map((fv, i) => (
            <Reveal key={i} delay={i * 40}>
              <button className="card tap row-card" style={{ ...accentStyle(fv.accent), width: '100%', textAlign: 'left' }} onClick={() => onOpen(fv.type, fv.item)}>
                <span style={{ width: 42, height: 42, borderRadius: 11, background: 'var(--c-t)', color: 'var(--c-i)', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>
                  <Icon n={fv.icon} size={19} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fv.title}</div>
                  <div className="t3" style={{ fontSize: 11.5, fontWeight: 600 }}>{fv.label}</div>
                </div>
                <Icon n="heart" size={18} fill="currentColor" style={{ color: 'var(--c)' }} />
              </button>
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="section" style={{ paddingTop: 0 }}>
          <div className="card" style={{ padding: '24px 18px', textAlign: 'center', color: 'var(--ink-3)', background: 'var(--bg-soft)', border: '1px dashed var(--line-2)' }}>
            <Icon n="heart" size={24} style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>Aucun favori pour l&apos;instant</div>
            <div style={{ fontSize: 12.5, marginTop: 3 }}>Touchez ♡ sur un contenu pour le retrouver ici.</div>
          </div>
        </div>
      )}

      <div className="section-h" style={{ margin: '22px 16px 12px' }}><h2 style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}><Icon n="quote" size={18} />Mes témoignages</h2></div>
      <div className="list" style={{ paddingTop: 0 }}>
        {submitted.map((t, i) => (
          <Reveal key={i} delay={i * 40}>
            <div className="card" style={{ ...accentStyle('tem'), padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--c-t)', color: 'var(--c-i)', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>
                <Icon n="quote" size={18} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.3, marginBottom: 5 }}>{t.titre}</div>
                {t.statut === 'publie'
                  ? <span className="tagpill" style={{ background: 'var(--m-ens-t)', color: 'var(--m-ens-i)' }}><Icon n="check" size={11} sw={2.4} />Publié · {t.date}</span>
                  : <span className="tagpill" style={{ background: 'var(--m-eva-t)', color: 'var(--m-eva-i)' }}><Icon n="clock" size={11} sw={2} />En attente de validation</span>}
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="section-h" style={{ margin: '22px 16px 12px' }}><h2 style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}><Icon n="bell" size={18} />Notifications</h2></div>
      <div className="section" style={{ paddingTop: 0 }}>
        <Reveal>
          <div className="card" style={{ overflow: 'hidden' }}>
            {[['mail', 'Email', 'Annonces, enseignements et rappels', 'email', 'ann'], ['wa', 'WhatsApp', 'Alertes importantes et sorties', 'whatsapp', 'ens']].map((r, i) => (
              <div key={r[3]} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '15px 16px', borderBottom: i === 0 ? '1px solid var(--line)' : 'none' }}>
                <span style={{ width: 40, height: 40, borderRadius: 11, display: 'grid', placeItems: 'center', flex: '0 0 auto', background: r[3] === 'whatsapp' ? 'var(--m-ens-t)' : 'var(--m-ann-t)', color: r[3] === 'whatsapp' ? 'var(--m-ens-i)' : 'var(--m-ann-i)' }}>
                  <Icon n={r[0]} size={19} />
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5 }}>{r[1]}</div>
                  <div className="t3" style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.35 }}>{r[2]}</div>
                </div>
                <Toggle on={!!notif[r[3]]} onTog={() => setNotif({ ...notif, [r[3]]: !notif[r[3]] })} accent={r[4] as AccentKey} />
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      <div className="section-h" style={{ margin: '22px 16px 12px' }}><h2 style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}><Icon n="history" size={18} />Historique de consultation</h2></div>
      <div className="list" style={{ paddingTop: 0 }}>
        {history.map((h, i) => (
          <Reveal key={i} delay={i * 40}>
            <button className="card tap row-card" style={{ ...accentStyle(h.accent), width: '100%', textAlign: 'left', padding: 12 }} onClick={() => onOpen(h.type, h.item)}>
              <span style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--c-t)', color: 'var(--c-i)', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>
                <Icon n={h.icon} size={17} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5, lineHeight: 1.3, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {(h.item as { titre?: string }).titre}
                </div>
                <div className="t3" style={{ fontSize: 11.5 }}>{h.label} · {h.when}</div>
              </div>
              <Icon n="cr" size={16} style={{ color: 'var(--ink-3)' }} />
            </button>
          </Reveal>
        ))}
      </div>

      <div className="section" style={{ paddingTop: 18 }}>
        <Reveal>
          <div className="card" style={{ padding: '4px 0' }}>
            {[['Profil personnel', 'user'], ['Confidentialité', 'lock'], ['Aide & contact', 'info']].map((r, i) => (
              <button key={i} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px', borderBottom: '1px solid var(--line)', textAlign: 'left' }}>
                <Icon n={r[1]} size={18} style={{ color: 'var(--ink-2)', flex: '0 0 auto' }} />
                <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{r[0]}</span>
                <Icon n="cr" size={16} style={{ color: 'var(--ink-3)' }} />
              </button>
            ))}
            <button onClick={onLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px', textAlign: 'left', color: 'var(--m-tem-i)' }}>
              <Icon n="logout" size={18} style={{ flex: '0 0 auto' }} />
              <span style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>Se déconnecter</span>
            </button>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
