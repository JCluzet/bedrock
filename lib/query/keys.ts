/**
 * Example typed query-key factory. Query keys must come from a `*Keys` factory
 * like this one, never an inline array literal (enforced by the
 * `no-inline-query-key` guardrail). This keeps key shapes consistent so cache
 * invalidation targets exactly the entries you mean.
 * See .agents/rules/state.md#querykeys.
 *
 * Delete this file and write your own feature key factories, e.g.
 *   export const userKeys = {
 *     all: ["users"] as const,
 *     detail: (id: string) => ["users", id] as const,
 *   };
 */
export const exampleKeys = {
  all: ["example"] as const,
  lists: () => [...exampleKeys.all, "list"] as const,
  detail: (id: string) => [...exampleKeys.all, "detail", id] as const,
};
