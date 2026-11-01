# Image upload implementation plan

Goal: Upload bounded static raster images into existing assets without changing notes.
Architecture: A session/CSRF protected raw-body tool validates and canonicalizes images, exclusively publishes content-addressed assets, and returns note-relative Markdown. A dialog uploads and exposes an explicit insertion action.
Spec: ../specs/2026-11-01-image-uploads.md

1. Write failing route tests for upload/readback, validation, auth/CSRF, no-follow, duplicates, quotas and uncertainty. Implement `wiki/image_uploads.py` and register `/tools/images/`; pin Pillow.
2. Write failing browser tests for dialog, unchanged draft, explicit insertion, fallback, mobile and stale selection. Add `static/src/image-upload.js`, editor integration and template controls.
3. Document API/storage/limits. Run full Python, Node/build and browser suites; inspect screenshots. Obtain independent review, resolve findings, publish draft PR and verify exact-head CI. Stop before merge.

Constraints: no overwrite, no new directory, no auth/CSP expansion or deployment. Existing note and assets policy applies. Private data never enters fixtures.
Review focus: duplicate submissions after lost responses; parent directory substitution; large compressed images; stale editor state during upload; keyboard focus and mobile scroll.
