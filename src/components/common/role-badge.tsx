"use client";

import type { Role } from "@/lib/types/api";
import { Badge } from "@/components/ui/badge";
import { roleLabel } from "@/components/auth/mock-auth";

type RoleBadgeProps = {
  role: Role;
};

export function RoleBadge({ role }: RoleBadgeProps) {
  const variant = role === "unauthorized" ? "destructive" : role === "patient" ? "secondary" : "default";

  return <Badge variant={variant}>{roleLabel(role)}</Badge>;
}
