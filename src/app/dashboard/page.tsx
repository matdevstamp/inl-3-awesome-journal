import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/common/dashboard-shell";
import { getSession } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getSession();

  if (!user) redirect("/login");
  if (user.role === "unauthorized") redirect("/access-denied");

  return <DashboardShell user={user} />;
}
