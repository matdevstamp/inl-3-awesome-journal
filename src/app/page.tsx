import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <span className="font-semibold tracking-tight">Awesome Journal</span>
        <ThemeToggle />
      </header>
      <section className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Secure health-record access</CardTitle>
            <CardDescription>
              Cross-organization access to patient records with full audit logging. The feature UI
              lands here next (Gate 3).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href="/api/health">Check API health</a>
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
