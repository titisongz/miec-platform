import { supabase } from './supabase';

// Upload d'images vers Supabase Storage (bucket public « media »).
// Le bucket et ses policies sont créés par supabase/fix-media-modules.sql.

export const MAX_PHOTOS = 5;
export const MAX_PHOTO_MB = 5;
const MAX_BYTES = MAX_PHOTO_MB * 1024 * 1024;
const BUCKET = 'media';

// Valide une sélection d'images. Renvoie un message d'erreur, ou null si OK.
// `max` permet de surcharger la limite par défaut (ex. 1 pour une bannière,
// 6 pour la galerie IPB) sans toucher au plafond global MAX_PHOTOS.
export function validatePhotos(files: File[], existingCount = 0, max = MAX_PHOTOS): string | null {
  if (files.length === 0) return null;
  if (files.length + existingCount > max) return `Maximum ${max} photo${max > 1 ? 's' : ''} au total.`;
  for (const f of files) {
    if (!f.type.startsWith('image/')) return `« ${f.name} » n'est pas une image.`;
    if (f.size > MAX_BYTES) return `« ${f.name} » dépasse ${MAX_PHOTO_MB} Mo.`;
  }
  return null;
}

// Téléverse les fichiers dans folder/ et renvoie leurs URLs publiques.
export async function uploadPhotos(files: File[], folder: string): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const ext = file.name.includes('.') ? file.name.split('.').pop() : 'jpg';
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: '3600', upsert: false, contentType: file.type,
    });
    if (error) {
      console.error('[storage] upload échec:', error.message);
      throw error;
    }
    urls.push(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
  }
  return urls;
}

// Variante pour une seule image (couverture de livre, photo de ressource).
export async function uploadPhoto(file: File, folder: string): Promise<string> {
  const [url] = await uploadPhotos([file], folder);
  return url;
}

// ── Fichiers non-image (PDF, audio, vidéo) ──────────────────────────────────────
export const MAX_FILE_MB = 10;
// Extensions acceptées par défaut pour les documents/ressources.
export const FILE_EXTS = ['pdf', 'mp3', 'wav', 'mp4'];

// Valide un fichier (extension + taille). Renvoie un message d'erreur ou null.
export function validateFile(file: File, exts: string[] = FILE_EXTS, maxMb = MAX_FILE_MB): string | null {
  const ext = file.name.includes('.') ? (file.name.split('.').pop() ?? '').toLowerCase() : '';
  if (!exts.includes(ext)) return `Format non supporté (${exts.map(e => '.' + e).join(', ')}).`;
  if (file.size > maxMb * 1024 * 1024) return `« ${file.name} » dépasse ${maxMb} Mo.`;
  return null;
}

// Téléverse un fichier quelconque dans folder/ et renvoie son URL publique.
export async function uploadFile(file: File, folder: string): Promise<string> {
  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600', upsert: false, contentType: file.type || 'application/octet-stream',
  });
  if (error) {
    console.error('[storage] upload fichier échec:', error.message);
    throw error;
  }
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
