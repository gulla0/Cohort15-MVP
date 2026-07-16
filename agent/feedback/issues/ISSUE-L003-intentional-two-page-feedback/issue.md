# ISSUE-L003 - Replace Feedback Survey With An Intentional Two-Page Flow

## Summary

The feedback dialog should open only after a visitor clicks Feedback and should contain exactly two form pages: general text feedback, then the current founder-social and optional contact page.

## User Impact

The current six-step survey interrupts visitors automatically based on routes, timers, and actions. It asks qualification questions before allowing open-ended feedback, making feedback feel random and burdensome.

## Affected Flow

Feedback capture on landing, research, creation, and cohort pages across desktop and mobile.

## Likely Technical Area

- `docs/cohort15-piece-of-pie-mvp-spec.md`
- `src/ui/feedback-widget.mjs`
- `src/ui/styles.css`
- `src/services/feedback.mjs` and persistence compatibility
- `tests/feedback.test.mjs`

## Evidence

- The widget currently defines six steps and timed or action-triggered `autoOpen` behavior.
- Existing persistence accepts partial survey and contact fields.
- The user explicitly requested two pages and clarified that the dialog must not randomly pop up.

## Scope

In scope:
- Click-only opening from the visible Feedback control.
- Page 1: one general feedback textarea.
- Page 2: preserve the existing founder introduction, social links, and optional contact fields.
- Preserve private storage, validation, rate limiting, accessible dialog behavior, and responsive presentation.

Out of scope:
- Automatic prompts, behavioral qualification questions, route/timer triggers, or survey branching.
- A provider migration unless implementation proves the existing optional schema cannot safely accept the simplified payload.

## Notes

Resolution should map general feedback to the existing `whyOrWhyNot` field if compatible, avoiding a production migration. Removed survey fields may remain nullable historical columns so existing records are preserved.
