"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { HeartPulseIcon, ShieldCheckIcon } from "lucide-react";

import { setMockSession, MOCK_USERS, roleLabel } from "@/components/auth/mock-auth";
import { ApiClientError, apiRequest } from "@/lib/api/client";
import type { LoginResponse } from "@/lib/types/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState(MOCK_USERS[0]?.username ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedUser = useMemo(
    () => MOCK_USERS.find((user) => user.username === username),
    [username],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const { user } = await apiRequest<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      setMockSession(user);
      router.push(user.role === "unauthorized" ? "/access-denied" : "/dashboard");
    } catch (cause) {
      setError(
        cause instanceof ApiClientError && cause.status === 401
          ? "Invalid username or password."
          : "Sign-in service is unavailable. Check that the database and app server are running.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-[420px] border-0 shadow-none ring-0">
      <CardHeader className="px-4 md:px-5">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
          <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <ShieldCheckIcon className="size-4" aria-hidden="true" />
          </span>
          Secure journal access
        </div>
        <CardTitle className="text-2xl">Sign in to Awesome Journal</CardTitle>
        <CardDescription>Sign in with a seeded test account to access the journal.</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <form
          method="post"
          className="space-y-5 rounded-lg bg-muted/30 p-4 md:p-5"
          onSubmit={handleSubmit}
        >
          <div className="space-y-2">
            <Label htmlFor="demo-user">Demo user</Label>
            <Select value={username} onValueChange={setUsername}>
              <SelectTrigger id="demo-user" className="w-full">
                <SelectValue placeholder="Choose role" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_USERS.map((user) => (
                  <SelectItem key={user.username} value={user.username}>
                    {user.displayName} - {roleLabel(user.role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </div>

          {selectedUser ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <HeartPulseIcon className="size-4 text-emerald-600" aria-hidden="true" />
              Signing in as {roleLabel(selectedUser.role)}.
            </p>
          ) : null}

          {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

          <Button className="w-full" type="submit" disabled={isSubmitting}>
            Sign in
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
