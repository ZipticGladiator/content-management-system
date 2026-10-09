"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { changeMemberRole } from "@/app/team/actions";
import type { UserRole } from "@/app/generated/prisma/client";

export default function RoleSelect({
  userId,
  role,
  disabled,
}: {
  userId: string;
  role: UserRole;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onChange(next: string) {
    startTransition(async () => {
      await changeMemberRole(userId, next as "OWNER" | "EDITOR");
      router.refresh();
    });
  }

  return (
    <select value={role} disabled={disabled || pending} onChange={(e) => onChange(e.target.value)}>
      <option value="EDITOR">Editor</option>
      <option value="OWNER">Owner</option>
    </select>
  );
}
