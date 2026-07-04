import type { Metadata } from "next";
import { Suspense } from "react";

import { LandingOrchestrator } from "@/features/landing/components/orchestrators/LandingOrchestrator";

export const metadata: Metadata = {
  title: { absolute: "Bedrock: the AI-native Next.js template" },
  description:
    "A Next.js and Tailwind starter where clean, scalable, SOLID architecture is enforced by algorithmic guardrails, not left to chance.",
};

export default function LandingPage() {
  return (
    <Suspense>
      <LandingOrchestrator />
    </Suspense>
  );
}
