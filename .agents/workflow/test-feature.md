# Test Feature Workflow

> Follow this workflow when testing a feature end-to-end after implementation.

---

## Prerequisites

- The user has launched `pnpm dev`.
- For browser testing: a browser automation tool connected to the running app.

---

## Step 1: Check for existing errors

Before testing the new feature, check the current error state:

1. Read today's structured logs (written by the fs drain in dev):
   ```
   Read .evlog/logs/YYYY-MM-DD.jsonl
   ```
2. Filter for errors only:
   ```
   Grep '"level":"error"' .evlog/logs/YYYY-MM-DD.jsonl
   ```

Browser warnings and errors are also forwarded to the dev terminal
(`logging.browserToTerminal` in `next.config.ts`), so watch that output too.

---

## Step 2: Test in the browser (requires a browser automation tool)

1. Navigate to the page under test.
2. Perform the user flow (clicks, form submissions, navigation).
3. Read the browser console for errors.
4. Take a screenshot if visual verification is needed.

Example prompts:
- "Go to localhost:3000/ and click the primary call to action"
- "Check the console for any errors after the page loads"
- "Take a screenshot of the current page"

---

## Step 3: Verify logs after action

1. Re-read `.evlog/logs/YYYY-MM-DD.jsonl` and look for the wide event from your action.
2. Verify: correct status code, reasonable duration, no error fields.
3. If there is an error, read the `why` and `fix` fields for guidance.

---

## Step 4: Report

- Confirm the feature works as expected.
- List any errors found with their `why` / `fix` context.
- If fixes were applied, re-test to confirm resolution.

---

## Troubleshooting

### "I can't see any logs"
- The user may not have started the server yet, ask them.
- The `.evlog/logs/` directory is created on the first request, so trigger one action first.

### "Browser automation not working"
- Check the connection status of your browser automation tool.
- The user needs its browser extension installed and connected to the tab.
- Try reconnecting the extension, then reload the page.
