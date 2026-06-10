import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';

// Callback de confirmation email Supabase.
// Gère les DEUX flux possibles selon le template d'email du projet :
//   1. PKCE      → paramètre `code`        → exchangeCodeForSession (même navigateur requis)
//   2. OTP/verify → `token_hash` + `type`  → verifyOtp (fonctionne cross-device)
// Dans les deux cas la session est écrite dans les cookies de la réponse,
// puis App.tsx (client) la lit via getSession() au rechargement de '/'.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  // `next` permet de revenir sur une page précise ; sinon l'accueil.
  const next = searchParams.get('next') ?? '/';

  // Log temporaire (visible dans les logs de fonction Vercel) pour diagnostic.
  console.log('[auth/callback] params:', {
    hasCode: !!code,
    hasTokenHash: !!tokenHash,
    type,
  });

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );

  // Flux 1 — PKCE (paramètre `code`)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
    console.error('[auth/callback] exchangeCodeForSession error:', error.message);
  }

  // Flux 2 — vérification OTP (token_hash + type), fonctionne cross-device
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, origin));
    console.error('[auth/callback] verifyOtp error:', error.message);
  }

  // Échec ou paramètres manquants : retour à l'accueil avec un indicateur d'erreur.
  return NextResponse.redirect(new URL('/?auth_error=1', origin));
}
