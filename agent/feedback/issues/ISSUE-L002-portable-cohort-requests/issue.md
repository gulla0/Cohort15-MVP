# ISSUE-L002 - Add Portable Tweet-Length Cohort Requests

## Summary

Every public cohort request needs a copy control that produces a useful, self-contained text card—not just a link—whose complete payload is at most 280 characters.

## User Impact

A visitor can currently open a public cohort URL, but moving a request into a text, post, email, or community requires manually rewriting its context. That friction limits distribution and makes copied links hard to understand on their own.

## Affected Flow

Public cohort cards and cohort detail pages, including anonymous browsing before quorum.

## Likely Technical Area

- `docs/cohort15-piece-of-pie-mvp-spec.md`
- `src/ui/cohorts.mjs`
- `src/ui/home.mjs`
- `src/ui/styles.css`
- event-browsing and UI tests

## Evidence

- Stable public cohort detail URLs and social metadata already exist.
- No visible copy/share control or compact plain-text payload exists.
- The user requested enough detail to understand the request and a maximum length matching a free-account tweet; intake records this as 280 characters total.

## Scope

In scope:
- A deterministic public-text summary capped at 280 characters including its public URL.
- Essential context such as title, condensed purpose, schedule, and formation status as space permits.
- Copy controls on listing cards and detail pages with accessible success/failure feedback.

Out of scope:
- Automatic posting to external services, OAuth, image generation, analytics expansion, or a social scheduler.
- Copying private email, an unreleased meeting link, secrets, or unescaped user content into markup.

## Notes

Resolution must define deterministic truncation and priority rules before implementation. The portable text must remain useful even when pasted outside Cohort15 and must preserve the existing pre-quorum meeting-link boundary.
