# Plan A3a — Verified private folder backup

Status: **DRAFT PR candidate. Verify exact-head CI and owner Windows/Chrome behavior before merge. Not a production release-safety certificate.**

## Delivered

- New self-contained, **same-origin** support page: verified-backup.html; separate from the existing billing index page. It does not load app scripts, start billing migrations, access network services or modify browser localStorage.
- It embeds the exact Plan A2 original V1 codec, verified byte-for-byte by qa/plan-a3a/verify-backup-source.cjs. It preserves raw records, saved settings/credentials, preferences, audit and supported unknown keys. Corrupt or missing required collections and pending import markers cause refusal.
- On a **user click** in compatible secure desktop Chrome/Edge, it invokes the browser's directory picker immediately, then captures a V1 private backup. It generates a UTC sortable timestamp plus 128-bit random token, rejects a known file-name collision, creates a new file, writes/closes and independently reads it back. Exact serialized strings and V1 SHA-256 codec decoding must match. It rechecks current local source key membership/raw bytes after write; if source changed, it refuses a current-data success claim.
- A separate fallback action requests a normal browser file download, with **not verified** status. No timers, auto-backups, persistent directory handles, credential exchange, permission storage, local status flags, IndexedDB, Google Drive API or background task.
- All messages omit private records, filenames, folder paths and raw errors. Backup files themselves are **private and not encrypted**. SHA-256 is not encryption or proof of disk physical durability.

## What 'verified' does and does not mean

'LOCAL FILE VERIFIED' means this browser created and closed a file, reread the file handle and compared its exact bytes and checked the existing V1 checksum. It does **not** confirm Google Drive upload, file existence after reboot, hardware flush, encryption, accounting integrity, complete portability, independent recovery or a tested restore.

Select a folder configured for Google Drive for desktop; the app cannot establish if it is really a synced folder or whether the file is uploaded. Drive for desktop sync status must be checked **separately**. Prefer a private folder with an offline local copy. A streamed Drive mount may have different offline behavior from a mirrored/local folder, so verify on the owner's Windows PC.

The File System Access API does not expose an atomic *create only if absent* reservation. A 128-bit random name and preflight collision refusal make accidental duplicates negligible in practice, but concurrent external writers/permission revocations remain an unproven limitation. A failed partial new file is **not deleted automatically**, so earlier generations are not intentionally touched. In native storage terms, only browser readback has been validated.

No read-only reports or new-PC restore automation are included here. Existing Import Restore is still restricted to a separate empty browser profile; starting the regular application can run existing migrations. A future A6 drill must reconcile invoice, payment and audit records before any cutover.

## Acceptance and evidence

- qa/plan-a3a/verify-backup-source.cjs tests exact pin to unchanged production index, private V1 integrity, missing/invalid records, denied access, folder cancel, collision, write/close failure, readback mismatch, concurrent external writer, unsupported fallback and synthetic invoice sizes 0/86/500/2,000/5,000. All localStorage mutations by the tool cause test failure.
- qa/plan-a3a/verify-backup-browser.cjs uses disposable loopback origins and mocked native file picker/handles, with Chromium/Firefox/WebKit real browser load. It verifies readback status and rejects picker cancellation, denied write/close and corruption; compares exact localStorage keys and raw bytes; blocks non-local network requests prior to navigation. **File System Access operations are mocks in this test.**
- .github/workflows/plan-a3a-backup.yml uses pinned official GitHub Actions SHAs, exact PR head, official Node 22.23.3 and ephemeral Playwright 1.64.0. CI is the actual pass/fail authority; the presence of tests is not evidence they passed.
- Existing A1a/A1b/A2 workflows must continue to pass. No existing files are changed in this PR.

## Owner-only PC steps after a reviewed merge

1. Keep current browser private backup and one independent copy; do not reset, clear or switch Chrome profiles.
2. Install/sign into Google Drive for desktop on Windows if needed; configure a **private, locally available sync folder**.
3. Open the backup tool from the **same Chrome profile and same HTTPS GitHub Pages host** as live billing. Do not use a file:// copy (different storage origin).
4. Choose the Drive-synced folder. The page should show LOCAL FILE VERIFIED. If failure occurs, preserve existing backups, inspect for an incomplete unique file and retry only after understanding failure. No overwrite is authorized.
5. Wait until Drive for desktop shows sync complete, then retrieve that **specific file** from an independent Drive client/connection and verify its checksum/format. The app cannot verify the off-device copy or restore automatically.
6. A separate empty-profile-only restore drill is required before relying on the backup for migration.

Do not run tests on owner's actual billing profile; do not upload backups to GitHub or attach their private contents to review reports.

## Deferred A3b / A6

A3b may add **explicitly opted-in** periodic backups only while the billing app is open AND a currently permissioned folder handle is available. Browser scheduling is not an OS background service; user-gesture permission and cloud-upload verification cannot be skipped. Run A3a owner-device file readback and recovery test first.

New-PC guided restore, encryption at rest, local SQLite, automatic expiry and a backup-only read-only financial report viewer remain independently scoped.
