import type { KnipConfig } from "knip";

const config: KnipConfig = {
  // Vendored shadcn output and CLI-invoked guardrail scripts are outside the app
  // dependency graph, so they are not analysed for dead code.
  ignore: ["components/ui/**", "hooks/**", "tools/**"],
  // The shadcn UI kit ships the full component set. Its exclusive dependencies
  // are intentionally present even before the starter app uses every component,
  // so they are not flagged as unused. Delete an entry here once your own code
  // stops relying on the vendored component that pulled it in.
  ignoreDependencies: [
    "shadcn",
    "tailwindcss",
    "tw-animate-css",
    "class-variance-authority",
    "cmdk",
    "date-fns",
    "embla-carousel-react",
    "input-otp",
    "lucide-react",
    "radix-ui",
    "react-day-picker",
    "react-hook-form",
    "@hookform/resolvers",
    "react-resizable-panels",
    "recharts",
    "sonner",
    "vaul",
  ],
  ignoreExportsUsedInFile: true,
  treatConfigHintsAsErrors: true,
};

export default config;
