export interface HeroCopy {
  eyebrow: string;
  title: string;
  tagline: string;
  body: string;
}

export interface ComponentRole {
  name: string;
  folder: string;
  responsibility: string;
}

export interface SolidPrinciple {
  letter: string;
  title: string;
  description: string;
}

export const HERO = {
  eyebrow: "Next.js + Tailwind, built for AI",
  title: "Bedrock",
  tagline: "The starter where clean architecture is enforced, not hoped for.",
  body: "Every rule is a pass or fail gate wired into one command. Your AI cannot drift: it ships scalable, SOLID code by construction, or the build stops. Start by reading AGENTS.md.",
  primaryCta: "Next.js 16 docs",
  docsUrl: "https://nextjs.org/docs/app",
  repoUrl: "https://github.com/JCluzet/bedrock",
  installCommand: "pnpm check",
} as const;

export const ROLES: ComponentRole[] = [
  {
    name: "Orchestrator",
    folder: "orchestrators/",
    responsibility:
      "Wires data and state to a presenter. Calls hooks, passes ready props down.",
  },
  {
    name: "Presenter",
    folder: "presenters/",
    responsibility:
      "Pure and presentational. Props in, JSX out. No transforms, no effects.",
  },
  {
    name: "Hook",
    folder: "hooks/",
    responsibility: "Logic and state. Returns data and handlers, never JSX.",
  },
];

export const SOLID: SolidPrinciple[] = [
  {
    letter: "S",
    title: "Single Responsibility",
    description: "One component or function does one thing.",
  },
  {
    letter: "O",
    title: "Open/Closed",
    description: "Extend via composition or props, never by editing internals.",
  },
  {
    letter: "L",
    title: "Liskov Substitution",
    description: "A variant is usable wherever the base is used.",
  },
  {
    letter: "I",
    title: "Interface Segregation",
    description: "No component is forced to accept props it does not use.",
  },
  {
    letter: "D",
    title: "Dependency Inversion",
    description: "Depend on abstractions, not concrete implementations.",
  },
];
