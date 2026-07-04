import "server-only";

import { tryUseLogger } from "@/lib/evlog";

export interface AppStatus {
  status: "ok";
  service: string;
}

// Server-only helper. The `server-only` import makes the build fail if this
// module is ever pulled into a client bundle. It uses `tryUseLogger()` so it
// works whether or not it runs inside a withEvlog() request context.
export function getAppStatus(): AppStatus {
  const status: AppStatus = { status: "ok", service: "app" };
  tryUseLogger().set({ healthCheck: true });
  return status;
}
