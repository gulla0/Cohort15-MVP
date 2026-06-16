# ISSUE-010 - Improve Create Form Guidance and Image Upload

## Summary

The cohort request form needs meaningful placeholders that show users what kind of real content belongs in each field. The event image field should also use the familiar local file-picker pattern instead of only asking for an image URL or path.

## User Impact

Creators have to infer how detailed their cohort request should be, which makes weak or incomplete submissions more likely. The current custom image entry is less familiar than the standard click-to-choose local image control users expect, so adding an event image feels harder than it should.

## Affected Flow

- Creating a cohort request at `/cohorts/new`.
- Entering descriptive cohort details.
- Adding a custom event image.

## Likely Technical Area

- `src/ui/create-cohort.mjs`
- `src/server/app.mjs`
- `src/services/create-cohort.mjs`
- `src/domain/validation.mjs`
- `src/persistence/repositories.mjs`
- `tests/create-cohort.test.mjs`
- `tests/domain-validation.test.mjs`
- possible static asset handling under `public/` or a documented local image storage path

## Evidence

- User feedback: the cohort request form needs meaningful sample placeholders, not lorem ipsum.
- User feedback: the custom image field should follow the standard pattern where users click a box and choose an image from the local system.
- Current app already supports custom image URLs/paths and a default image, but the input pattern is not the normal local file-picker interaction.

## Scope

In scope:
- Add meaningful field placeholders or examples for the create form using realistic Cohort15 sample copy.
- Preserve existing validation rules and avoid placeholders that imply invalid dates, unsupported meeting providers, or private-link exposure.
- Replace or augment the image URL/path field with a standard local image file-picker UI.
- Store or reference the selected local image in a way compatible with the current dependency-free app foundation.
- Keep default image behavior for users who do not choose an image.
- Add focused tests for create-form rendering and image handling.

Out of scope:
- Building a full media library or drag-and-drop image manager.
- Adding third-party upload/storage providers.
- Changing the event image model beyond what is needed for local selection.
- Implementing production auth.

## Notes

The resolver should choose the smallest reliable local-image approach that works with the current Node app. If true upload persistence is not practical in the first pass, the issue should clearly document the temporary behavior instead of presenting URL entry as a complete fix.
