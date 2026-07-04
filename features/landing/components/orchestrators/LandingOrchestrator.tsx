import { CopyCommandOrchestrator } from "@/features/landing/components/orchestrators/CopyCommandOrchestrator";
import { CounterOrchestrator } from "@/features/landing/components/orchestrators/CounterOrchestrator";
import { HeroActions } from "@/features/landing/components/presenters/HeroActions";
import { HeroSection } from "@/features/landing/components/presenters/HeroSection";
import { LandingPresenter } from "@/features/landing/components/presenters/LandingPresenter";
import { RolesSection } from "@/features/landing/components/presenters/RolesSection";
import { SolidSection } from "@/features/landing/components/presenters/SolidSection";
import { HERO, ROLES, SOLID } from "@/features/landing/lib/content";

// Composition root: wires content to the section presenters and drops the
// interactive orchestrators into their slots. Adding a section is one more line
// here, not a wider prop list on a mega-component.
export function LandingOrchestrator() {
  return (
    <LandingPresenter
      hero={
        <HeroSection
          copy={HERO}
          actions={
            <HeroActions
              docsUrl={HERO.docsUrl}
              repoUrl={HERO.repoUrl}
              primaryCta={HERO.primaryCta}
              copyControl={<CopyCommandOrchestrator command={HERO.installCommand} />}
            />
          }
        />
      }
      demo={<CounterOrchestrator />}
      roles={<RolesSection roles={ROLES} />}
      solid={<SolidSection principles={SOLID} />}
    />
  );
}
