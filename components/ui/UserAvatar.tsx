"use client";

import { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarPublicUrl } from "@/lib/supabase/avatar";

type UserAvatarProps = {
  name: string;
  avatarPath?: string | null;
  imageUrl?: string | null;
  size: number;
  className?: string;
};

function toInitials(name: string): string {
  const source = name.trim().replace(/^@+/, "");
  if (!source) return "?";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function UserAvatar({ name, avatarPath, imageUrl, size, className }: UserAvatarProps) {
  const [failed, setFailed] = useState(false);
  const src = useMemo(() => {
    if (imageUrl) return imageUrl;
    if (!avatarPath || failed) return null;
    try {
      return getAvatarPublicUrl(avatarPath);
    } catch {
      return null;
    }
  }, [avatarPath, failed, imageUrl]);
  const initials = toInitials(name);

  return (
    <Avatar className={className} style={{ width: size, height: size }}>
      {src ? <AvatarImage src={src} alt={`Avatar de ${name}`} onError={() => setFailed(true)} /> : null}
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}
