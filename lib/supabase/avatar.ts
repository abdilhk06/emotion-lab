"use client";

import { getSupabaseClient } from "@/lib/supabase/client";

const AVATAR_BUCKET = "avatars";
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function extensionFromType(type: string): string {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "";
}

export function validateAvatarFileType(file: File): void {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Type invalide. Formats acceptes: JPEG, PNG, WEBP.");
  }
}

export function validateAvatarFileSize(file: File): void {
  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error("Fichier trop volumineux. Taille max: 5 MB.");
  }
}

export function buildAvatarPath(userId: string, file: File): string {
  const ext = extensionFromType(file.type);
  if (!ext) throw new Error("Impossible de determiner l'extension du fichier.");
  return `${userId}/avatar-${Date.now()}.${ext}`;
}

export async function uploadAvatarFile(userId: string, file: File): Promise<string> {
  validateAvatarFileType(file);
  validateAvatarFileSize(file);
  const path = buildAvatarPath(userId, file);
  const supabase = getSupabaseClient();
  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw new Error(`Echec upload avatar: ${error.message}`);
  return path;
}

export function getAvatarPublicUrl(avatarPath: string | null | undefined): string | null {
  if (!avatarPath?.trim()) return null;
  const supabase = getSupabaseClient();
  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(avatarPath);
  const url = data.publicUrl;
  if (!url) throw new Error("Impossible de resoudre l'URL publique de l'avatar.");
  return url;
}

export async function deleteAvatarBestEffort(avatarPath: string | null | undefined): Promise<void> {
  if (!avatarPath?.trim()) return;
  const supabase = getSupabaseClient();
  await supabase.storage.from(AVATAR_BUCKET).remove([avatarPath]);
}

