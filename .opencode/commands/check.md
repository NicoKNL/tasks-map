---
description: Run build, lint, tests, and format check
agent: build
---

Run the full verification suite in this order:

1. `npm run build` -- typecheck and bundle
2. `npm run lint` -- ESLint check
3. `npm test` -- Jest tests
4. `npm run format` -- Prettier check

If any step fails, fix the issues before moving to the next step.
Re-run failed steps after fixing. Report a summary when everything passes.
