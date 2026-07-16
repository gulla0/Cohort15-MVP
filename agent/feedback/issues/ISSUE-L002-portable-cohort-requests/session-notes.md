# Session Notes - ISSUE-L002

Append-only.

## 2026-07-15 - Intake

- A copied cohort must contain useful context rather than only its URL.
- The full plain-text payload is capped at 280 characters, the requested free-account tweet-sized boundary.
- The control should make requests easy to paste into any channel without platform-specific integration.

## 2026-07-15 - Resolution

- Locked one deterministic, anonymous four-line portable-text contract before implementation.
- Kept the canonical cohort URL mandatory and untruncated while limiting the complete payload to 280 Unicode code points.
- Removed URL-shaped and email-shaped tokens from user-authored portable fields and excluded the meeting link in every lifecycle state.
- Added the same `Copy cohort request` control to public listing cards and detail pages without requiring sign-in.
- Added accessible clipboard success feedback and a visible, focused, selectable fallback when clipboard access is missing or fails; the text also remains visible without JavaScript.
- Fifteen focused browsing, privacy, interest, rendering, length, and DOM-script tests passed. The in-app browser runtime was unavailable for literal desktop/mobile smoke, so clipboard success and fallback were exercised through an executable VM DOM harness.
- User preview review found the ISO timestamp, semicolons, `x`, slash counts, and parenthetical lifecycle label difficult to scan.
- Replaced that machine-like context with fixed English UTC text such as `Jul 24, 2026 at 10:00 PM UTC · Weekly · 2 meetings × 60 min · 2 of 3 interested`, with readable quorum-met and closed variants.
- User preview review found the card's details link and large copy button visually competitive, especially with the visible keyboard-focus ring.
- Kept `View cohort details →` primary, changed the card action to a quieter icon-labeled `Copy request`, separated them by 32px in a horizontal row, and stacked them with a 16px gap at the existing mobile breakpoint. The detail page retains `Copy cohort request`.
- The horizontal preview revealed that the details link's arrow visually pointed at the neighboring copy button. Removed the arrow while retaining the underlined `View cohort details` link and its destination.
- Final user direction retained the arrow as an important cue that another page exists, kept copy at the opposite end on larger views and below details on mobile, and made the rest of the card navigate to the request page.
- Implemented progressive whole-card navigation that excludes links, copy controls, form/editable elements, default-prevented events, and non-empty text selections. Title and details links remain functional without JavaScript.
