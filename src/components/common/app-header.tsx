"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOutIcon } from "lucide-react";

import { clearMockSession } from "@/components/auth/mock-auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

type AppHeaderProps = {
  title?: string;
};

export function AppHeader({ title = "Awesome Journal" }: AppHeaderProps) {
  const router = useRouter();

  function handleLogout() {
    clearMockSession();
    router.push("/login");
  }

  return (
    <header className="flex min-h-14 items-center justify-between border-b px-4 py-3 md:px-6">
      <Link href="/dashboard" className="font-semibold tracking-tight">
        {title}
      </Link>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOutIcon aria-hidden="true" />
          Log out
        </Button>
      </div>
    </header>
  );
}
