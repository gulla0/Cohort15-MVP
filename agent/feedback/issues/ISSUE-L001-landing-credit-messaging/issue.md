# ISSUE-L001 - Make Landing Credit Messaging Instinctive

## Summary

The landing page should first explain why Cohort15 is useful, make the concept concrete with small examples from familiar categories, then explain the complete credit bargain in a short, plain-language block.

## User Impact

Visitors currently see the abstract group-formation flow but get no immediate examples of what they might form. They also cannot understand the cost and refund model without reaching action-specific screens. Together, those gaps create avoidable uncertainty about both the product and its credits.

## Affected Flow

Public landing page from first impression through the Create and Browse calls to action.

## Likely Technical Area

- `docs/cohort15-piece-of-pie-mvp-spec.md`
- `src/ui/home.mjs`
- `src/ui/styles.css`
- landing and launch UI tests

## Evidence

- The hero currently says only that a visitor can propose a cohort and gather interest.
- Credit costs appear later on creation, interest, sign-in, and purchase screens.
- The approved direction is value-first copy followed by: create costs 2 credits, join costs 1, unsuccessful groups return credits, and new accounts start with 2.
- The user also requested small, instantly recognizable examples so first-time visitors can connect “cohort” to familiar uses.

## Scope

In scope:
- Value-first landing headline and supporting copy.
- A compact set of clearly illustrative examples from familiar categories, such as interview practice, language learning, founder accountability, or a focused book group.
- One compact, non-technical explanation of credit costs, return behavior, and the signup grant.
- Preserve clear Create and Browse actions and responsive accessibility.

Out of scope:
- Changing credit prices, grant amounts, ledger behavior, quorum, expiry, or Stripe packaging.
- A long credit tutorial, dashboard, or broader visual redesign.
- Presenting illustrative examples as real, currently forming cohorts or adding seeded product records.

## Notes

Avoid internal words such as “ledger” and “hold” in first-impression copy. Examples must be terse, diverse, and visibly examples rather than fabricated live listings. Resolution must update the canonical UI contract in `docs/cohort15-piece-of-pie-mvp-spec.md` before or with implementation.
