'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * Recherche Supabase débouncée pour les barres de recherche des modules.
 *
 * - Tant que la requête est vide, on retourne `fallback` (la liste complète déjà chargée).
 * - Dès qu'un terme est saisi, on appelle `searchFn` après `delay` ms d'inactivité.
 * - Un compteur de séquence ignore les réponses arrivées dans le désordre.
 */
export function useSupabaseSearch<T>(
  query: string,
  fallback: T[],
  searchFn: (q: string) => Promise<T[]>,
  delay = 300,
): { items: T[]; searching: boolean; active: boolean } {
  const [results, setResults] = useState<T[] | null>(null);
  const [searching, setSearching] = useState(false);
  const seq = useRef(0);

  useEffect(() => {
    const term = query.trim();
    if (!term) {
      setResults(null);
      setSearching(false);
      return;
    }

    setSearching(true);
    const id = ++seq.current;
    const t = setTimeout(async () => {
      try {
        const r = await searchFn(term);
        if (id === seq.current) {
          setResults(r);
          setSearching(false);
        }
      } catch {
        if (id === seq.current) {
          setResults([]);
          setSearching(false);
        }
      }
    }, delay);

    return () => clearTimeout(t);
  }, [query, searchFn, delay]);

  const active = !!query.trim();
  return { items: active ? (results ?? fallback) : fallback, searching, active };
}
