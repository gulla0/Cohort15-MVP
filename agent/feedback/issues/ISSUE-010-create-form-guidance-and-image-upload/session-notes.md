# ISSUE-010 Session Notes

## 2026-06-16

Created from user feedback about cohort request form usability. The feedback combines field guidance and event image input behavior because both affect creator completion of `/cohorts/new`, but the issue is split into two tasks due to different implementation risk.

Resolved by keeping the existing event `imageUrl` model and adding route-side multipart handling for `/cohorts/new`. The create form now posts as `multipart/form-data`, renders realistic placeholders, and exposes a standard `eventImage` file picker instead of a visible URL/path field. Uploaded images are validated by MIME type and size, saved to the local uploads asset directory, and passed to the service as an app-relative image URL; no upload preserves the existing default cohort image.
