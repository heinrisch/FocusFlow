# FocusFlow coding agent instructions

## Role
You are a coding agent working in this repository. Your goal is to implement FocusFlow as a clean, open-source-ready Chrome extension (Manifest V3) with minimal UI, strong reliability, and least-privilege permissions.

## Hard constraints
- Use Vanilla TypeScript (no frameworks).
- No React, Svelte, or other UI libraries.
- Use TypeScript everywhere.
- Keep code clean and readable; avoid over-documentation.
- Comments: only when they explain a non-obvious constraint or a tricky edge case. No “what this line does” comments.
- Follow the TODO.md file for a feature checklist. Check of completed features.
- Follow README.md for implementation details.
- Make sure DOCS.md are followed and up to date.

## Recommended stack
- Vanilla TypeScript + HTML for UI surfaces (popup/options/blocked page).
- Vite for bundling.
- Optional: use a Vite MV3 extension bundling plugin/template (e.g., vite-plugin-chrome-extension).

## Product surfaces to implement
- Popup (toolbar): start/stop focus session + select duration + show remaining time.
- Options page: manage blocked domains + basic preferences.
- Blocked page: calm redirect target shown when user tries to open a blocked site during an active session.
- Background service worker: single source of truth for session state, alarms, and rule installation.

## Architecture rules
### Single source of truth
- Session state lives in `chrome.storage.local` (active, endsAtEpochMs, installedRuleIds).
- User settings live in `chrome.storage.sync` when small enough; fall back to local for large lists.

### Blocking model
- Use `chrome.declarativeNetRequest` dynamic rules during a focus session.
- Only target `main_frame` navigations in v1 to keep behavior predictable.
- Redirect to an extension-owned `pages/blocked.html`.
- Ensure the redirect target is declared in `web_accessible_resources` in `manifest.json`.

### Timer model
- Use `chrome.alarms` for session end enforcement.
- On service worker startup:
  - Load session state
  - If session is active but alarm is missing, fail safe (end session, remove rules) to avoid “stuck blocking”.

## Repository layout (target)
- `public/`
  - `manifest.json`
  - `icons/` (16/32/48/128)
  - `pages/blocked.html` (built output target or static shell)
- `src/`
  - `background/`
    - `service_worker.ts`
    - `session.ts` (start/stop/status)
    - `dnr.ts` (rule generation + install/uninstall)
    - `storage.ts` (typed wrapper)
    - `domain.ts` (normalize/validate)
  - `popup/`
    - `popup.html`
    - `popup.ts`
  - `options/`
    - `options.html`
    - `options.ts`
  - `blocked/`
    - `blocked.html`
    - `blocked.ts`
  - `shared/`
    - `time.ts`
    - `constants.ts`
    - `types.ts`

Keep modules small. Prefer pure functions for domain normalization and rule generation.

## Implementation directives
### Domain normalization (must)
- Accept user input like:
  - `reddit.com`
  - `www.reddit.com`
  - `https://reddit.com/r/foo`
- Normalize to a canonical domain pattern you will use for DNR matching.
- Reject invalid entries with a helpful message in the UI.

### Rule IDs (must)
- Reserve a stable numeric range, e.g. 10_000–19_999 for session rules.
- Deterministically map a normalized domain to a rule ID (hash -> int in range).
- Store installed IDs in session state and remove exactly those on stop.

### UI/UX (must)
- One primary action in the popup: Start Focus / Stop.
- Calm visual language: no red warnings, no “punishment” copy.
- Blocked page must show:
  - “Focus Session Active”
  - remaining time
  - primary button: Go back
  - secondary: Open settings (Options page)
- Do not offer “Disable blocking” on the blocked page in v1.

### Styling
- Keep styling consistent across popup/options/blocked page.
- Use a minimal design system (typography scale, spacing scale).
- Prefer system fonts and a neutral palette with one accent color.
- Avoid heavy animations; respect reduced-motion if you add any transitions.

## Communication between contexts
Prefer simple message passing:
- UI reads state from storage and requests actions via `chrome.runtime.sendMessage`.
- Background executes privileged actions (alarms, DNR) and writes the resulting state to storage.

Avoid introducing extra libraries for messaging unless absolutely needed.
