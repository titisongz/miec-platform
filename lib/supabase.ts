import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singleton pour les composants clients ('use client')
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Instance partagée — usage direct dans les composants clients
export const supabase = createClient();
