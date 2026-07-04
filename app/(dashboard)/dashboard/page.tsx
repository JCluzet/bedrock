import type { Metadata } from "next";

import { SystemStatusOrchestrator } from "@/features/system-status/components/orchestrators/SystemStatusOrchestrator";

export const metadata: Metadata = {
  title: "Dashboard",
};

// Placeholder for the app area. The (dashboard) route group is where your
// authenticated product lives, kept separate from the (marketing) group.
// Build it out with feature orchestrators, exactly like the landing.
export default function DashboardPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-4 px-6 py-20">
      <h1 className="font-display text-3xl font-bold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground">
        Your app lives here, in the (dashboard) route group. Replace this page with
        your first feature.
      </p>
      <SystemStatusOrchestrator />
    </main>
  );
}
