# FocusFlow — Focus Sessions for Chrome

FocusFlow is a Chrome (Manifest V3) extension that starts an explicit “Focus Session” and blocks a user-defined list of distracting sites until the session ends. [page:2]  
Site blocking is implemented with `chrome.declarativeNetRequest`, which blocks or modifies network requests using declarative rules (without intercepting and viewing request contents), improving privacy compared to request-interception approaches. [page:2]  
This extension uses declarative rules instead of blocking `chrome.webRequest` listeners, which (in MV2) could degrade performance and required invasive permissions. [page:3]

## Core idea

- User clicks the toolbar icon → chooses duration → starts session.
- While active, navigating to a blocked domain is redirected to a calm “Blocked” page (owned by the extension).
- When the timer ends, blocking rules are removed automatically.

## Non-goals (v1)

- No “social posting” features.
- No complicated task/project system—this is a session-based blocker.
- No attempt to bypass OS-level restrictions (extension only).

## How blocking works (MV3)

FocusFlow uses the Declarative Net Request API to block/redirect requests via rulesets, rather than intercepting requests in JavaScript. [page:2]  
The extension uses **dynamic rules** for the active session, because dynamic rules persist across browser sessions and extension upgrades (until removed), which fits “enable now, disable later.” [page:2]  
Rules target `resourceTypes: ["main_frame"]` so only the top-level page navigation is redirected. [page:3]

### Redirect requirements

Redirecting to an extension page requires the target resource to be declared as a web accessible resource via `web_accessible_resources`. [page:2]  
FocusFlow’s blocked experience is delivered via `pages/blocked.html`, declared in `web_accessible_resources` and referenced by DNR `redirect.extensionPath`. [page:2]

## Timing model

The timer is scheduled with the `chrome.alarms` API. [page:1]  
Alarms continue while a device sleeps, but they will not wake the device; missed alarms fire when the device wakes. [page:1]  
Alarms may be cleared when the browser restarts, so the service worker should verify/recreate required alarms on startup. [page:1]

## Data storage

User settings (block list, UI preferences) are stored using `chrome.storage` (not `window.localStorage`), because service workers can’t use Web Storage and because Web Storage can be cleared when users clear browsing history. [page:0]  
`storage.sync` is used for small settings that should roam with the user, but it has a small quota (about 100 KB total, about 8 KB per item). [page:0]  
Session state can be stored in `storage.local` (10 MB by default, and can be increased with `unlimitedStorage`) to survive restarts if desired. [page:0]

## UI surfaces

- Popup (toolbar): start/stop session, choose duration, show remaining time.
- Options page: manage blocked sites list, subscription, appearance.
- Blocked page: shown when user attempts to open a blocked site during an active session.

## Look & feel

FocusFlow is designed to feel calm, minimal, and fast: a single primary action, little text, no clutter.  
The blocked page and popup should use the same visual language so the product feels cohesive.

### Icon requirements

The extension must have a simple, high-contrast icon that reads well at 16–48px, and a slightly more detailed version for the Chrome Web Store listing.  
The icon should communicate “focus/time” (e.g., a minimal ring/clock) without looking like a warning symbol.

## Permissions (initial)

- `declarativeNetRequest` (blocking/redirect rules). [page:2]  
- `alarms` (timer scheduling). [page:1]  
- `storage` (settings + session state). [page:0]
