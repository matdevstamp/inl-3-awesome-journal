import Link from "next/link";
import { LockKeyholeIcon } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AccessDeniedPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-4 py-3 md:px-6">
        <Link href="/" className="font-semibold tracking-tight">
          Awesome Journal
        </Link>
        <ThemeToggle />
      </header>
      <section className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <LockKeyholeIcon className="size-5" aria-hidden="true" />
            </div>
            <CardTitle>Access denied</CardTitle>
            <CardDescription>
              This account is not allowed to view patient records in the demo flow.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/login">Back to login</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
