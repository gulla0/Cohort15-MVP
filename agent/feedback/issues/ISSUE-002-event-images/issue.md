# ISSUE-002 - Add Event Images

## Summary

Creators should be able to add an image for an event. When no custom image is provided, the MVP should use the attached online cohort illustration as a polished default image.

## User Impact

Events currently render as plain text cards and details. The product feels weak visually, and creators cannot make events more recognizable or appealing. A good default image gives every cohort a better visual baseline even when creators do not provide custom art.

## Affected Flow

- Create cohort form
- Public cohort feed
- Cohort detail page
- Creator dashboard
- Participant dashboard
- Social promotion outbox, if image metadata is added there later

## Likely Technical Area

- `src/domain/models.mjs`
- `src/domain/validation.mjs`
- `src/persistence/schema.mjs`
- `src/services/create-cohort.mjs`
- `src/services/event-browsing.mjs`
- `src/services/dashboards.mjs`
- `src/ui/create-cohort.mjs`
- `src/ui/cohorts.mjs`
- `src/ui/dashboards.mjs`
- `src/ui/styles.css`
- `src/server/app.mjs`
- `tests/`

## Evidence

- Repository search found no existing event image, thumbnail, hero, or cover field in product code.
- Attached default asset exists at `/Users/gzero/Desktop/cohort15/cohort15-mvp/ChatGPT Image May 30, 2026, 08_33_01 AM.png`.
- Asset file is a PNG image, 1448 x 1086, RGB.

## Scope

In scope:
- Add event image support to event creation and rendering.
- Use the attached PNG as the default image when no creator image is provided.
- Render event images on feed cards and detail pages.
- Include dashboard image treatment if it improves scanability without clutter.
- Add tests for default image behavior and custom image input.

Out of scope:
- Full file upload/storage infrastructure.
- Image cropping/editing tools.
- External CDN integration.
- Moderation or image safety review.
- Real social image publishing.

## Product Decisions

- Use the attached image as the default cohort image.
- For MVP resolution, a URL/path-based custom image field is acceptable unless the user explicitly asks for binary upload.
- Default image should feel like a product asset, not a placeholder.

## Notes

This can be resolved independently from ISSUE-001, but visual treatment will overlap with feed/detail/dashboard UI changes.
