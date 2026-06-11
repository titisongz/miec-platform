'use client';
import React, { useState, useRef, useEffect } from 'react';
import Icon from '@/components/icons';
import { AppBar, FrictionModal, Sheet, Toggle, Spinner } from '@/components/ui';
import { accentStyle, INP_STYLE } from '@/lib/accent';
import { supabase } from '@/lib/supabase';
import { addFavori, removeFavori } from '@/lib/queries';
import PageAccueil from '@/components/pages/accueil';
import { PageEnseignements, PageTemoignages, PageAnnonces, PagePriere } from '@/components/pages/modules1';
import { PageRessources, PageLibrairie, PageEvangelisation } from '@/components/pages/modules2';
import PageIPB from '@/components/pages/ipb';
import PageRecherche from '@/components/pages/recherche';
import PageCompte from '@/components/pages/compte';
import {
  DEnseignement, DTemoignage, DAnnonce, DSortie, DLivre, DPriere, DDoc, DRessource,
} from '@/components/details';
import type { AccentKey, Role, StackEntry, FavItem, FrictionConfig, UserProfile } from '@/lib/types';

/* ---------- constants ---------- */
const TYPEMAP: Record<string, { accent: AccentKey; icon: string; label: string; tf: string }> = {
  enseignement: { accent: 'ens', icon: 'book',     label: 'Enseignement', tf: 'titre' },
  temoignage:   { accent: 'tem', icon: 'quote',    label: 'Témoignage',   tf: 'titre' },
  annonce:      { accent: 'ann', icon: 'mega',     label: 'Annonce',      tf: 'titre' },
  sortie:       { accent: 'eva', icon: 'compass',  label: 'Évangélisation', tf: 'titre' },
  livre:        { accent: 'res', icon: 'books',    label: 'Livre',        tf: 'titre' },
  priere:       { accent: 'pri', icon: 'flame',    label: 'Prière',       tf: 'sujet' },
  ressource:    { accent: 'res', icon: 'folder',   label: 'Ressource',    tf: 'titre' },
  doc:          { accent: 'ipb', icon: 'filetext', label: 'Document',     tf: 't'     },
};

const TABS = [
  { k: 'accueil',   l: 'Accueil',    i: 'home'   },
  { k: 'recherche', l: 'Rechercher', i: 'search' },
  { k: 'priere',    l: 'Prière',     i: 'flame'  },
  { k: 'compte',    l: 'Compte',     i: 'user'   },
];

/* ---------- Toast ---------- */
function Toast({ msg, accent }: { msg: string; accent: AccentKey }) {
  return (
    <div style={{
      position: 'absolute', left: '50%', bottom: 92, transform: 'translateX(-50%)', zIndex: 80,
      background: '#23262E', color: '#fff', padding: '11px 16px', borderRadius: 12,
      fontSize: 13.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 9,
      boxShadow: 'var(--sh-3)', animation: 'toast-in .35s var(--ease-out)', whiteSpace: 'nowrap',
      ...accentStyle(accent),
    }}>
      <Icon n="check" size={16} sw={2.4} style={{ color: '#fff' }} />{msg}
    </div>
  );
}

/* ---------- SubmitSheet ---------- */
function SubmitSheet({ config, onClose, userId }: {
  config: FrictionConfig; onClose: () => void; userId?: string | null;
}) {
  const pri = config.mod === 'priere';
  const [step, setStep] = useState(0);
  const [v, setV] = useState({ titre: '', texte: '', cat: pri ? 'Santé' : 'Guérison', anon: false });
  const ok = v.titre && v.texte;

  async function go() {
    if (!ok) return;
    setStep(1);
    try {
      if (userId) {
        if (pri) {
          await supabase.from('prieres').insert({
            profile_id: userId,
            sujet: v.titre,
            details: v.texte,
            categorie: v.cat,
            anonyme: v.anon,
            urgent: false,
          });
        } else {
          await supabase.from('temoignages').insert({
            profile_id: userId,
            titre: v.titre,
            contenu: v.texte,
            categorie: v.cat,
            anonyme: v.anon,
            statut: 'en_attente',
          });
        }
      }
      setStep(2);
    } catch {
      setStep(0);
    }
  }

  return (
    <Sheet onClose={onClose}>
      {step === 2 ? (
        <div style={{ textAlign: 'center', padding: '8px 6px', ...accentStyle(pri ? 'pri' : 'tem') }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--c-t)', color: 'var(--c-i)', display: 'grid', placeItems: 'center', margin: '0 auto 16px', animation: 'pop .4s var(--ease-out)' }}>
            <Icon n="check" size={32} sw={2.2} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.02em', marginBottom: 8 }}>
            {pri ? 'Sujet déposé' : 'Témoignage envoyé'}
          </div>
          <p className="lead" style={{ margin: '0 0 20px' }}>
            {pri ? 'La communauté pourra désormais prier avec vous.' : 'Merci ! Votre témoignage sera relu puis publié pour encourager la communauté.'}
          </p>
          <button className="btn btn-primary btn-block" onClick={onClose}>Fermer</button>
        </div>
      ) : (
        <div style={accentStyle(pri ? 'pri' : 'tem')}>
          <div className="eyebrow" style={{ marginBottom: 6 }}><Icon n={pri ? 'flame' : 'quote'} size={14} sw={2} />{pri ? 'Sujet de prière' : 'Témoignage'}</div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.02em', marginBottom: 16 }}>{config.title}</div>
          <label style={{ display: 'block', marginBottom: 13 }}>
            <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--ink-2)', marginBottom: 6 }}>{pri ? 'Sujet' : 'Titre'}</span>
            <input value={v.titre} onChange={e => setV({ ...v, titre: e.target.value })} placeholder={pri ? 'Pour…' : 'Ce que Dieu a fait…'} style={INP_STYLE} />
          </label>
          <label style={{ display: 'block', marginBottom: 13 }}>
            <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--ink-2)', marginBottom: 6 }}>{pri ? 'Détails' : 'Votre récit'}</span>
            <textarea value={v.texte} onChange={e => setV({ ...v, texte: e.target.value })} rows={4} placeholder="Partagez en quelques mots…" style={{ ...INP_STYLE, height: 'auto', padding: '12px 15px', resize: 'none', lineHeight: '1.5' }} />
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

/* ---------- App ---------- */
export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stack, setStack] = useState<StackEntry[]>([{ page: 'accueil' }]);
  const view = stack[stack.length - 1];
  const [favs, setFavs] = useState<FavItem[]>([]);
  const [prayed, setPrayed] = useState<string[]>([]);
  const [notif, setNotif] = useState({ email: true, whatsapp: false });
  const [friction, setFriction] = useState<FrictionConfig | null>(null);
  const [submit, setSubmit] = useState<FrictionConfig | null>(null);
  const [toast, setToast] = useState<{ msg: string; accent: AccentKey } | null>(null);
  const [ipbTab, setIpbTab] = useState('vitrine');
  const appRef = useRef<HTMLDivElement>(null);

  /* derived auth state */
  const role: Role = profile?.role ?? 'visiteur';
  const etudiantIpb = profile?.etudiant_ipb ?? false;
  const initials = profile
    ? profile.nom_complet.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase()
    : '';
  const displayName = profile?.nom_complet.split(' ')[0] ?? '';

  /* ── Supabase auth ────────────────────────────────────────────────── */
  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nom_complet, role, etudiant_ipb')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('[auth] fetchProfile error:', error.message);
      return;
    }
    if (!data) {
      console.warn('[auth] aucune ligne profile pour', userId, '— le trigger handle_new_user a-t-il bien créé le profil ?');
      return;
    }
    setProfile(data as UserProfile);
  }

  useEffect(() => {
    // Confirmation email (PKCE) : si la redirection arrive sur '/' (ou ailleurs)
    // avec ?code=… au lieu de passer par /auth/callback, on échange le code
    // contre une session côté client (le code verifier est dans ce navigateur).
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) console.error('[auth] exchangeCodeForSession (client):', error.message);
        url.searchParams.delete('code');
        window.history.replaceState({}, '', url.pathname + url.search + url.hash);
      });
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Log temporaire de diagnostic — à retirer une fois la confirmation email validée.
      console.log('[auth] event:', event, '| session:', session ? session.user.email : null);
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setFavs([]);
        setPrayed([]);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── UI effects ───────────────────────────────────────────────────── */
  useEffect(() => {
    function fit() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const s = Math.min(1, (vh - 78) / 858, (vw - 24) / 402);
      document.documentElement.style.setProperty('--ps', String(s));
    }
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  useEffect(() => { if (appRef.current) appRef.current.scrollTop = 0; }, [stack.length, view.page, (view as { type?: string }).type]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  /* ── Navigation ───────────────────────────────────────────────────── */
  function nav(page: string, params?: string) {
    if (page === 'ipb' && params) setIpbTab(params);
    setStack(s => {
      const top = s[s.length - 1];
      if (top.page === page && !(top as { type?: string }).type) return s;
      return [...s, { page, params } as unknown as StackEntry];
    });
  }
  function openDetail(type: string, item: unknown) { setStack(s => [...s, { page: 'detail', type, item } as unknown as StackEntry]); }
  function back() { setStack(s => s.length > 1 ? s.slice(0, -1) : s); }
  function tab(k: string) { setStack([{ page: k } as unknown as StackEntry]); }

  /* ── Favourites ───────────────────────────────────────────────────── */
  const isFav = (type: string, item: Record<string, unknown>) =>
    favs.some(f => f.type === type && f.id === (item.id ?? item.titre));

  function toggleFav(type: string, item: Record<string, unknown>) {
    const m = TYPEMAP[type];
    const id = (item.id ?? item.titre) as string;
    const entry: FavItem = { type: type as import('@/lib/types').DetailType, id, item, title: item[m.tf] as string, label: m.label, accent: m.accent, icon: m.icon };
    const alreadyFav = favs.some(x => x.type === type && x.id === id);
    setFavs(f => {
      if (alreadyFav) return f.filter(x => !(x.type === type && x.id === id));
      setToast({ msg: 'Ajouté aux favoris', accent: m.accent });
      return [...f, entry];
    });
    if (profile?.id) {
      if (alreadyFav) removeFavori(profile.id, type, id);
      else addFavori(profile.id, type, id);
    }
  }

  /* ── Prayers ──────────────────────────────────────────────────────── */
  function pray(id: string) {
    setPrayed(p => {
      if (p.includes(id)) return p.filter(x => x !== id);
      setToast({ msg: 'Merci, vous priez 🙏', accent: 'pri' });
      return [...p, id];
    });
  }

  /* ── Auth flow ────────────────────────────────────────────────────── */
  function onAuth(x: FrictionConfig | string) {
    if (x && typeof x === 'object') setFriction(x as FrictionConfig);
    else tab('compte');
  }
  function onSubmit(cfg: FrictionConfig) {
    if (role === 'visiteur') setFriction(cfg);
    else setSubmit(cfg);
  }
  function frictionCreate() {
    const ipb = friction?.ipb;
    setFriction(null);
    if (ipb) { setIpbTab('vitrine'); nav('ipb', 'vitrine'); }
    else tab('compte');
  }
  async function handleLogout() {
    await supabase.auth.signOut();
    tab('accueil');
  }

  /* ── Render ───────────────────────────────────────────────────────── */
  const tabKey = ['accueil', 'recherche', 'priere', 'compte'].includes(view.page) ? view.page : '';
  const isDetail = view.page === 'detail';
  const detailView = view as { page: string; type?: string; item?: unknown };

  function renderPage() {
    if (isDetail && detailView.type) {
      const m = TYPEMAP[detailView.type];
      const item = detailView.item as Record<string, unknown>;
      const common = { item, back, onShare: () => setToast({ msg: 'Lien copié', accent: m.accent }) };
      /* eslint-disable @typescript-eslint/no-explicit-any */
      if (detailView.type === 'priere') return <DPriere item={item as any} back={back} prayed={prayed} onPray={pray} />;
      if (detailView.type === 'doc') return <DDoc item={item as any} back={back} />;
      if (detailView.type === 'ressource') return <DRessource item={item as any} back={back} />;
      if (detailView.type === 'sortie') return <DSortie item={item as any} back={back} onShare={common.onShare} />;
      const favProps = { fav: isFav(detailView.type, item), onFav: () => toggleFav(detailView.type!, item) };
      if (detailView.type === 'enseignement') return <DEnseignement item={item as any} back={back} onShare={common.onShare} {...favProps} />;
      if (detailView.type === 'temoignage') return <DTemoignage item={item as any} back={back} onShare={common.onShare} {...favProps} />;
      if (detailView.type === 'annonce') return <DAnnonce item={item as any} back={back} onShare={common.onShare} {...favProps} />;
      if (detailView.type === 'livre') return <DLivre item={item as any} back={back} {...favProps} />;
      /* eslint-enable @typescript-eslint/no-explicit-any */
    }
    switch (view.page) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      case 'accueil':       return <PageAccueil role={role} displayName={displayName} onNav={nav} onOpen={openDetail} onAuth={onAuth as any} />;
      case 'enseignements': return <PageEnseignements onOpen={openDetail} />;
      case 'temoignages':   return <PageTemoignages role={role} onOpen={openDetail} onSubmit={onSubmit} />;
      case 'annonces':      return <PageAnnonces onOpen={openDetail} />;
      case 'priere':        return <PagePriere role={role} onOpen={openDetail} onSubmit={onSubmit} prayed={prayed} onPray={pray} />;
      case 'ressources':    return <PageRessources onOpen={openDetail} />;
      case 'librairie':     return <PageLibrairie onOpen={openDetail} />;
      case 'evangelisation':return <PageEvangelisation onOpen={openDetail} />;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      case 'ipb':           return <PageIPB etudiantIpb={etudiantIpb} onAuth={onAuth as any} onOpen={openDetail} ipbTab={ipbTab} setIpbTab={setIpbTab} />;
      case 'recherche':     return <PageRecherche onOpen={openDetail} onNav={nav} />;
      case 'compte':        return (
        <PageCompte
          role={role}
          onLogin={() => tab('accueil')}
          favs={favs}
          onOpen={openDetail}
          onNav={nav}
          notif={notif}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setNotif={setNotif as any}
          onLogout={handleLogout}
          etudiantIpb={etudiantIpb}
          displayName={profile?.nom_complet ?? ''}
          initials={initials}
        />
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      default:              return <PageAccueil role={role} displayName={displayName} onNav={nav} onOpen={openDetail} onAuth={onAuth as any} />;
    }
  }

  return (
    <div id="stage">
      <div className="phone">
        <div className="notch" />
        <div className="phone-screen">
          {!isDetail && (
            <AppBar
              role={role}
              initials={initials}
              onSearch={() => tab('recherche')}
              onProfile={() => tab('compte')}
              onBell={() =>
                role === 'visiteur'
                  ? setFriction({ title: 'Vos notifications', benefit: 'Créez un compte pour recevoir et gérer vos notifications par email et WhatsApp.' })
                  : tab('compte')
              }
            />
          )}
          <div className="app" ref={appRef}>
            <div key={`${stack.length}${view.page}${(detailView.type ?? '')}`}>{renderPage()}</div>
          </div>
          {!isDetail && (
            <nav className="tabbar" style={accentStyle('slate')}>
              {TABS.map(t => (
                <button key={t.k} className={`tab${tabKey === t.k ? ' on' : ''}`} onClick={() => tab(t.k)}>
                  <span className="tibox"><Icon n={t.i} size={22} /></span>{t.l}
                </button>
              ))}
            </nav>
          )}
          {toast && <Toast msg={toast.msg} accent={toast.accent} />}
          {friction && <FrictionModal config={friction} onCreate={frictionCreate} onContinue={() => setFriction(null)} onClose={() => setFriction(null)} />}
          {submit && <SubmitSheet config={submit} onClose={() => setSubmit(null)} userId={profile?.id} />}
        </div>
      </div>
    </div>
  );
}
