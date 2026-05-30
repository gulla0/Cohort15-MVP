# Session Notes - ISSUE-002

Append-only issue-local notes.

### 2026-05-30 08:45 EDT

User Feedback:
- Event creators should be able to add an image for the event.
- There should be a nice default image.
- Use the attached image as the default.

Observed:
- Repository search found no existing event image, cover, hero, or thumbnail field.
- Attached PNG is available in the repository root as `ChatGPT Image May 30, 2026, 08_33_01 AM.png`.
- File metadata: PNG, 1448 x 1086, RGB.

Decision:
- Track event imagery as a separate feedback issue from flow/copy/navigation repair because it touches domain, asset serving, and visual rendering.

### 2026-05-30 08:51 EDT

Resolved:
- Copied the provided PNG to `public/assets/default-cohort.png`.
- Added `imageUrl` to event domain objects, validation, schema metadata, and create input normalization.
- Defaulted blank image values to the local default image and preserved custom http(s) or app-relative image values.
- Added optional creator image input.
- Rendered event images on feed cards, detail pages, and dashboard rows with stable dimensions and alt text.

Verification:
- `npm run check` passed with 41 tests.
- Browser smoke on `http://localhost:3001` verified default image rendering on the detail page.
