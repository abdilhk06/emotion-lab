"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import * as React from "react";

function cx(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function Avatar({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      className={cx("relative flex size-10 shrink-0 overflow-hidden rounded-full ring-2 ring-purple-100", className)}
      {...props}
    />
  );
}

function AvatarFallback({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      className={cx("flex size-full items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 text-sm font-bold text-white", className)}
      {...props}
    />
  );
}

export { Avatar, AvatarFallback };
