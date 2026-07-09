// next-pwa n'embarque pas ses propres types : déclaration minimale pour next.config.ts.
declare module 'next-pwa' {
  import type { NextConfig } from 'next';

  type Handler =
    | 'CacheFirst'
    | 'CacheOnly'
    | 'NetworkFirst'
    | 'NetworkOnly'
    | 'StaleWhileRevalidate';

  interface RuntimeCachingRule {
    urlPattern:
      | RegExp
      | string
      | ((options: { request: Request; url: URL; sameOrigin: boolean }) => boolean);
    handler: Handler;
    method?: string;
    options?: {
      cacheName?: string;
      networkTimeoutSeconds?: number;
      expiration?: { maxEntries?: number; maxAgeSeconds?: number };
      cacheableResponse?: { statuses?: number[]; headers?: Record<string, string> };
      matchOptions?: { ignoreSearch?: boolean };
    };
  }

  interface PWAConfig {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    scope?: string;
    sw?: string;
    skipWaiting?: boolean;
    reloadOnOnline?: boolean;
    cacheStartUrl?: boolean;
    dynamicStartUrl?: boolean;
    runtimeCaching?: RuntimeCachingRule[];
    publicExcludes?: string[];
    buildExcludes?: (string | RegExp)[];
    fallbacks?: Record<string, string>;
    [key: string]: unknown;
  }

  function withPWAInit(config?: PWAConfig): (nextConfig: NextConfig) => NextConfig;
  export = withPWAInit;
}
