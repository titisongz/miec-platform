import type { Metadata } from 'next';
import './globals.css';
import InstallPrompt from '@/components/InstallPrompt';

export const metadata: Metadata = {
  title: "MIEC — Mission Internationale d'Évangile de Christ",
  description: 'Plateforme communautaire de la Mission Internationale d\'Évangile de Christ',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning={true}>
      <head>
        <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,maximum-scale=1,user-scalable=no" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3C4654" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&family=Newsreader:ital,wght@1,400;1,500;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}
