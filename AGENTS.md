# Project working agreement

## For every coding task

1. Work from this project folder, not the home directory. Keep implementation,
   supporting scripts and project notes in the workspace.
2. Make focused changes to real project code that fulfil the user's request.
   Preserve unrelated work and keep the existing stack and dependencies.
3. Run the smallest meaningful local test or application check after changing
   code. Use a production build when the change affects the running website.
4. Investigate failures, fix issues caused by the change, and rerun the relevant
   check. If blocked, explain the blocker instead of claiming success.
5. Let started commands and delegated work finish before the final response.
   Intentional preview servers may remain running; identify their URL.
6. Finish with what changed, the checks actually run, how to try the result,
   and any remaining validation gaps.

Prefer portable local tools. Avoid `gh`, `ssh`, `aws`, `osascript` and similar
machine/account-specific tools unless the requested task explicitly needs them.
Do not change global settings, publish work, or modify source Blender assets
without the required user instruction.

## Existing checks

- Seat mapping, selector and camera behaviour: `node scripts/check-seats.cjs`
- Field detail, wicket dimensions and resource lifecycle: `node scripts/check-field.cjs`
- CPU scene-setup benchmark (warm, no GPU/FPS claim): `node scripts/bench-viewer.cjs`
- Real model geometry, seat coordinates and visibility: `node scripts/check-model.cjs --asset`
- Loading states and viewer integration: `node scripts/check-loading.cjs`
- Catalog and UI checks: `node scripts/check-ui.cjs`
- Running preview checks: `node scripts/check-ui.cjs http://127.0.0.1:3001`
- App validation: `npm run lint`, `npx tsc --noEmit --incremental false`, `npm run build`

Choose checks relevant to the change; do not repeatedly run unrelated checks.
Browser/GPU appearance is not proven by mathematical, component or HTTP tests.

## Quality over activity

Do not invent code changes, tests, success claims or extra work to improve a
session score. Questions and preference updates do not require artificial code
edits. Follow the workflow for useful project work; do not promise a rating,
reward or evaluation outcome controlled by the app.
