'use client';
import { useEffect, useState } from 'react';

// L'événement beforeinstallprompt n'est pas encore standardisé côté types DOM.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISS_KEY = 'miec-install-dismissed';
const SHOW_DELAY_MS = 4000; // laisse l'utilisateur naviguer quelques secondes avant de proposer

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Déjà installée (mode standalone) ou déjà refusée : on ne propose rien.
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // iOS Safari
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;
    if (localStorage.getItem(DISMISS_KEY) === '1') return;

    let timer: ReturnType<typeof setTimeout> | undefined;

    const onBeforeInstall = (e: Event) => {
      // Empêche la mini-infobar native : on affichera notre propre invite.
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    };

    const onInstalled = () => {
      setVisible(false);
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
    if (outcome === 'accepted' || outcome === 'dismissed') {
      // Une invite native ne peut être rejouée : on la retire dans les deux cas.
      setDeferred(null);
      setVisible(false);
    }
    if (outcome === 'dismissed') localStorage.setItem(DISMISS_KEY, '1');
  }

  function dismiss() {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, '1');
  }

  if (!visible || !deferred) return null;

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
