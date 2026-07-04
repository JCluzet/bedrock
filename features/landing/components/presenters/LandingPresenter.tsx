import type { ReactNode } from "react";

interface LandingPresenterProps {
  hero: ReactNode;
  demo: ReactNode;
  roles: ReactNode;
  solid: ReactNode;
}

// Layout shell. It only arranges the sections it is handed; each section owns its
// own content. No data, no logic, just composition.
export function LandingPresenter({ hero, demo, roles, solid }: LandingPresenterProps) {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-16 px-6 py-20">
      {hero}
      {demo}
      {roles}
      {solid}
    </main>
  );
}
