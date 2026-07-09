import type { NextConfig } from 'next';
import withPWAInit from 'next-pwa';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Autorise les images publiques du Storage Supabase pour next/image.
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
    ],
  },
};

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  // En dev on utilise Turbopack : next-pwa (webpack) est désactivé pour éviter tout conflit.
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    // 1) Données dynamiques Supabase (REST, Auth, Realtime, Functions) :
    //    JAMAIS mises en cache — on ne veut jamais afficher du contenu périmé.
    {
      urlPattern: /^https:\/\/[a-z0-9-]+\.supabase\.co\/(rest|auth|realtime|functions)\/.*/i,
      handler: 'NetworkOnly',
    },
    // 2) Fichiers publics du Storage Supabase (images, docs) : ce sont des fichiers
    //    statiques → cache avec rafraîchissement en arrière-plan.
    {
      urlPattern: /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'supabase-storage',
        expiration: { maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
    // 3) Polices Google.
    {
      urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
    // 4) Assets de build Next (JS/CSS immuables, hashés).
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static',
        expiration: { maxEntries: 250, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    // 5) Images locales de l'app (icônes, emblème, etc.).
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'images',
        expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    // 6) Pages statiques (accueil, modules…) : NetworkFirst → toujours frais quand
    //    on est en ligne, disponible hors-ligne via le cache en secours.
    {
      urlPattern: ({ request }) => request.mode === 'navigate',
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages',
        networkTimeoutSeconds: 4,
        expiration: { maxEntries: 40, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
  ],
});

export default withPWA(nextConfig);
