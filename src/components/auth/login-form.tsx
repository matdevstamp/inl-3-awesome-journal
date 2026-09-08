"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheckIcon } from "lucide-react";

import { signInWithMockUser, MOCK_USERS, roleLabel } from "@/components/auth/mock-auth";
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
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState("");

  const selectedUser = useMemo(
    () => MOCK_USERS.find((user) => user.username === username),
    [username],
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const user = signInWithMockUser(username, password);
    if (!user) {
      setError("Invalid demo credentials. Try password demo123.");
      return;
    }

    if (user.role === "unauthorized") {
      router.push("/access-denied");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ShieldCheckIcon className="size-5" aria-hidden="true" />
        </div>
        <CardTitle>Sign in to Awesome Journal</CardTitle>
        <CardDescription>
          Demo login for the role-based health record flow. Backend auth will replace this mock.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
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
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </div>

          {selectedUser ? (
            <p className="text-sm text-muted-foreground">
              Signing in as {roleLabel(selectedUser.role)}.
            </p>
          ) : null}

          {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

          <Button className="w-full" type="submit">
            Sign in
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
