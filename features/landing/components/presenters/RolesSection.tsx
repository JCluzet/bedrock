import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { ComponentRole } from "@/features/landing/lib/content";

interface RolesSectionProps {
  roles: ComponentRole[];
}

export function RolesSection({ roles }: RolesSectionProps) {
  return (
    <section className="flex flex-col gap-5">
      <h2 className="font-display text-sm font-semibold tracking-widest text-muted-foreground uppercase">
        Every component, three roles
      </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {roles.map((role) => (
          <Card key={role.name}>
            <CardHeader>
              <CardTitle className="font-display text-lg">{role.name}</CardTitle>
              <code className="font-mono text-xs text-muted-foreground">
                {role.folder}
              </code>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {role.responsibility}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
