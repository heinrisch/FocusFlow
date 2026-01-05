# FocusFlow — Usage & Behavior

This document describes how users interact with FocusFlow and exactly what happens in the browser when a Focus Session runs.

## Installation & first run

After installing, the user opens the Options page to review and edit the default block list.  
Settings are stored via `chrome.storage`, which is asynchronous and persists even if the user clears cache and browsing history. [page:0]

## Starting a Focus Session (popup)

1. User clicks the toolbar icon to open the popup.
2. User selects a duration (presets + custom minutes).
3. User clicks “Start Focus”.

When “Start Focus” is clicked, the extension creates/updates DNR rules to redirect blocked domains during the session. [page:2]  
The timer is scheduled via `chrome.alarms` so the session end is enforced even if the popup closes. [page:1]

## What happens when a blocked site is opened

When the user navigates to a blocked domain in the top-level frame, the request is redirected using a DNR redirect rule (`action.type = "redirect"`). [page:2]  
The redirect target is an extension page (`pages/blocked.html`) and must be declared in `web_accessible_resources` or Chrome will reject the redirect. [page:2]  
Only `main_frame` navigations are redirected in v1 to keep behavior predictable. [page:3]

### Blocked page: layout & UX spec

The blocked page is the “moment of truth,” so it must be calming and frictionless:

**Content (centered card, max width ~420px)**
- Title: “Focus Session Active”
- Subtitle: “This site is blocked until your session ends.”
- Remaining time: large, monospace-like digits (e.g. 42:17)
- Secondary info: “You can close this tab or go back.”
- Primary button: “Go back” (calls `history.back()` if possible; otherwise opens a new tab to the New Tab Page).
- Secondary button: “Open block list” (opens Options page to the block list section).

**Visual design**
- Background: soft neutral (light) or near-black (dark), with a subtle gradient.
- Card: elevated, rounded corners, gentle shadow, no harsh borders.
- Accent color: used only for the remaining-time ring/indicator and primary button.
- No red error styling; it should not feel like punishment.

**Behavior**
- The blocked page should not offer “Disable blocking” in v1 (to prevent instant self-bypass).  
- If the session is already over, the blocked page should show “Session ended” and offer a “Retry site” button that reloads the original domain manually (user copies/opens it).

## Ending a Focus Session

A session ends when its alarm fires (or when the user stops it manually in the popup). [page:1]  
At end, the extension removes the dynamic DNR rules so navigation returns to normal. [page:2]  
If the device was asleep, the alarm won’t wake it; the session will be ended promptly after wake when missed alarms fire. [page:1]

## Reliability rules (MV3)

Because alarms may be cleared on browser restart, the service worker must check for an active session on startup and re-create the alarm if needed. [page:1]  
If the alarm is missing but the session is marked active, the extension should end the session safely (remove DNR rules) to avoid “stuck blocking.” [page:1][page:2]

## Data model (recommended)

**Settings (sync)**
- `blockedDomains`: array of domain patterns (small; sync quota is limited). [page:0]
- `uiTheme`: light/dark/system
- `durationPresets`: [25, 45, 60, 90] (optional)

**Session state (local)**
- `active`: boolean
- `endsAtEpochMs`: number
- `activeRuleIds`: number[] (rule IDs currently installed)

`storage.local` has a larger quota than sync and is suitable for state that doesn’t need cross-device roaming. [page:0]

## Subscription (product behavior)

Subscription unlocks “power features” while keeping the core blocker usable for free:
- Free: limited presets + limited number of blocked domains.
- Pro: unlimited domains, strict mode, stats, cross-device preset sync.

(Implementation choice: subscription verification is out of scope for this doc; it’s intentionally modular so you can plug in Stripe/LemonSqueezy/etc.)
