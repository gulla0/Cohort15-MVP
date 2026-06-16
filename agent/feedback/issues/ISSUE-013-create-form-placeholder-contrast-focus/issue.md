# ISSUE-013 - Lighten Create Form Placeholders

## Summary

The cohort request form placeholder text is too visually prominent. Placeholder text should be very light, and it should disappear when the user focuses the field.

## User Impact

Creators can confuse placeholder examples with entered content when the placeholder color is too dark. Keeping placeholder text visible after focus also makes the form feel less clean while the user is preparing to type.

## Affected Flow

- Creating a cohort request at `/cohorts/new`.
- Reading and interacting with text fields that include placeholder examples.

## Likely Technical Area

- `src/ui/create-cohort.mjs`
- `src/ui/styles.css`
- `tests/create-cohort.test.mjs`
- possible browser smoke for placeholder/focus styling

## Evidence

- User feedback: the placeholder text in the cohort request form is too dark.
- User feedback: placeholder text has to be very light.
- User feedback: placeholder text has to disappear when the user clicks on the field.
- Related resolved issue: ISSUE-010 added meaningful placeholder content, but did not cover placeholder contrast or focus behavior.

## Scope

In scope:
- Adjust create-form placeholder styling so placeholder text is visually light.
- Add focus behavior so placeholders disappear when users focus/click into affected fields.
- Preserve the meaningful placeholder examples from ISSUE-010 for unfocused empty fields.
- Verify behavior across relevant text inputs and textareas on `/cohorts/new`.
- Add focused test coverage where practical.

Out of scope:
- Rewriting create-form field labels or validation copy.
- Changing image upload behavior.
- Adding JavaScript-heavy form framework behavior unless needed for the focus requirement.
- Implementing broader visual redesign beyond placeholder/focus treatment.

## Notes

The resolver should check whether pure CSS can satisfy the focus behavior consistently for inputs and textareas before adding client-side scripting.
