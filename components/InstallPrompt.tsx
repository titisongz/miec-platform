'use client';
import { useEffect, useState } from 'react';

// L'événement beforeinstallprompt n'est pas encore standardisé côté types DOM.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISS_KEY = 'miec-install-dismissed';
const SHOW_DELAY_MS = 4000; // laisse l'utilisateur naviguer quelques secondes avant de proposer

// 'native' : invite automatique (Chrome/Edge/Android) — 'ios' : instructions manuelles (iOS Safari).
type View = 'native' | 'ios';

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [view, setView] = useState<View | null>(null);
  const [device, setDevice] = useState<'iPhone' | 'iPad'>('iPhone');

  useEffect(() => {
    // Déjà installée (mode standalone) ou déjà refusée : on ne propose rien.
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // iOS : navigator.standalone === true une fois ajoutée à l'écran d'accueil.
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;
    if (localStorage.getItem(DISMISS_KEY) === '1') return;

    const ua = window.navigator.userAgent;
    // iPadOS 13+ : Safari s'annonce comme un Mac → on rattrape l'iPad via le tactile
    // (aucun Mac de bureau n'a d'écran tactile, maxTouchPoints y vaut 0).
    const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    const isIOS = /iphone|ipad|ipod/i.test(ua) || isIPadOS;
    // iOS Safari ne connaît pas beforeinstallprompt ; les autres plateformes oui.
    const supportsInstallPrompt = 'onbeforeinstallprompt' in window;

    let timer: ReturnType<typeof setTimeout> | undefined;

    // --- iOS Safari : pas d'installation automatique possible → instructions manuelles. ---
    if (isIOS && !supportsInstallPrompt) {
      setDevice(/ipad/i.test(ua) || isIPadOS ? 'iPad' : 'iPhone');
      timer = setTimeout(() => setView('ios'), SHOW_DELAY_MS);
      return () => {
        if (timer) clearTimeout(timer);
      };
    }

    // --- Autres navigateurs : on capture l'invite native. ---
    const onBeforeInstall = (e: Event) => {
      // Empêche la mini-infobar native : on affichera notre propre invite.
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      timer = setTimeout(() => setView('native'), SHOW_DELAY_MS);
    };

    const onInstalled = () => {
      setView(null);
      setDeferred(null);
      localStorage.setItem(DISMISS_KEY, '1');
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      if (timer) clearTimeout(timer);
    };
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    // Une invite native ne peut être rejouée : on la retire dans tous les cas.
    setDeferred(null);
    setView(null);
    if (outcome === 'dismissed') localStorage.setItem(DISMISS_KEY, '1');
  }

  function dismiss() {
    setView(null);
    localStorage.setItem(DISMISS_KEY, '1');
  }

  if (!view) return null;

  // --- Carte iOS : instructions manuelles, sans bouton d'installation (iOS ne le permet pas). ---
  if (view === 'ios') {
    return (
      <div role="dialog" aria-label={`Installer MIEC sur votre ${device}`} style={styles.wrap}>
        <div style={styles.card}>
          <img src="/icons/icon-192x192.png" alt="" width={44} height={44} style={styles.icon} />
          <div style={styles.text}>
            <strong style={styles.title}>Installez MIEC sur votre {device}</strong>
            <span style={styles.steps}>
              Appuyez sur <ShareGlyph /> puis «&nbsp;<strong style={styles.stepStrong}>Sur l’écran d’accueil</strong>&nbsp;»
            </span>
          </div>
          <button type="button" onClick={dismiss} aria-label="Ne plus proposer" style={styles.close}>×</button>
        </div>
      </div>
    );
  }

  // --- Carte native : bouton d'installation en un clic. ---
  return (
    <div role="dialog" aria-label="Installer l'application MIEC" style={styles.wrap}>
      <div style={styles.card}>
        <img src="/icons/icon-192x192.png" alt="" width={44} height={44} style={styles.icon} />
        <div style={styles.text}>
          <strong style={styles.title}>Installer MIEC</strong>
          <span style={styles.sub}>Accès rapide depuis votre écran d’accueil</span>
        </div>
        <button type="button" onClick={install} style={styles.install}>Installer MIEC</button>
        <button type="button" onClick={dismiss} aria-label="Ne plus proposer" style={styles.close}>×</button>
      </div>
    </div>
  );
}

// Glyphe « Partager » iOS (carré avec flèche vers le haut).
function ShareGlyph() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#3C4654"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Partager"
      style={{ verticalAlign: '-3px', margin: '0 1px' }}
    >
      <path d="M8 12H6a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-2" />
      <path d="M12 3v13" />
      <path d="M8 7l4-4 4 4" />
    </svg>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 'calc(env(safe-area-inset-bottom, 0px) + 14px)',
    display: 'flex',
    justifyContent: 'center',
    padding: '0 14px',
    zIndex: 9999,
    pointerEvents: 'none',
  },
  card: {
    pointerEvents: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    maxWidth: 440,
    padding: '10px 12px',
    borderRadius: 16,
    background: '#ffffff',
    border: '1px solid rgba(60,70,84,0.12)',
    boxShadow: '0 8px 28px rgba(60,70,84,0.18)',
    fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
    animation: 'none',
  },
  icon: { borderRadius: 10, flex: '0 0 auto' },
  text: { display: 'flex', flexDirection: 'column', lineHeight: 1.25, minWidth: 0, flex: 1 },
  title: { fontSize: 14, fontWeight: 700, color: '#3C4654' },
  sub: { fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  // Instructions iOS : peuvent passer sur deux lignes.
  steps: { fontSize: 12.5, color: '#4b5563', lineHeight: 1.4, marginTop: 2 },
  stepStrong: { color: '#3C4654', fontWeight: 700 },
  install: {
    flex: '0 0 auto',
    border: 'none',
    background: '#3C4654',
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 700,
    padding: '9px 14px',
    borderRadius: 10,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  close: {
    flex: '0 0 auto',
    border: 'none',
    background: 'transparent',
    color: '#9aa1ab',
    fontSize: 22,
    lineHeight: 1,
    width: 28,
    height: 28,
    cursor: 'pointer',
    borderRadius: 8,
  },
};
