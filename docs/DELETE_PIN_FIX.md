# Delete PIN dialog fix

Requested task: invoice deletion does not work after entering the PIN. Base: merged PR #22, `beb42cfbb02069e818340ebecdef6b14499ddab5`. Branch: `codex/fix-invoice-delete-pin`. Paused A3b work is excluded.

## Cause and change

The old template placed JSON.stringify(pin) inside double-quoted oninput/onclick HTML attributes. A normal string PIN produced a truncated handler (`v15CheckPin(this,`) and `SyntaxError: Unexpected end of input`, so the Delete button stayed disabled.

Only the shared PIN dialog runtime region changes. Event listeners close over the PIN, labels use textContent, correct PIN enables confirmation, wrong PIN refuses, Enter confirms, Escape/Cancel/backdrop dismiss. One dialog can be active; dismissed/detached confirmations cannot reuse its callback. Existing delete callbacks, audit, payment/billing records and PIN settings/default remain unchanged. The unused global v15CheckPin, v15PinConfirm and _delPinCb helpers are replaced by private dialog functions; no other source references them.

Invoice deletion remains the existing permanent deletion operation, with its existing audit/storage behavior; this patch is not a new safe-storage, recycle-bin or PIN-hashing implementation. No production entries were accessed or deleted.

## Test evidence

1. Before the fix, the new DOM regression test failed against merged main:

   `NODE_PATH=/tmp/xl-delete-pin-tools/node_modules node qa/verify-delete-pin.cjs`

   Actual failure: `SyntaxError: Unexpected end of input` compiling the parsed inline handler `v15CheckPin(this,`.

2. After the fix, the same command passed:

   `PASS: delete PIN DOM events, wrong/default/custom PIN, click/Enter, Cancel/Escape, safe labels, stale dialogs, invoice/menu and shared entity deletes.`

   The test uses linkedom 0.18.12 and Node VM to parse the real generated dialog, dispatch DOM events and run the actual invoice/shared deletion callbacks over synthetic data. It also checks callback-once behavior. No real browser/profile is used.

3. All six existing `qa/verify-*.cjs` regression scripts (excluding the separately dependency-backed new script) passed: backup import, complete backup, invoice entry, invoice/payment safety, pagination and payment ledger pagination.
4. Existing 11 A3a groups, 14 A1b diagnostic groups, 15 historical fixture checks, 14 evidence-runner controls, 40 JSONBin quarantine checks and A2 provenance controls passed. Existing A1b/fixture runs use their documented `--runtime-revision qa/plan-a2/runtime-revision.json` flag.

The immutable A1a/A2 source hashes/manifests are preserved. QA explicitly recognizes only the exact new PIN dialog source hash and proves that projecting that single region back produces the identical merged A3a source before reusing A2 validation. Changes outside the dialog or to backup codecs still fail. A3a continues to require an identical embedded backup codec. A separate Delete PIN regression CI workflow installs linkedom only for the new development test; all original workflows stay byte-identical.

Real browser/full app deletion, owner printer/profile, and exact-head GitHub CI remain NOT RUN until the branch is published. No live deletion test is authorized or needed during development. No branch push, Draft PR, merge or deploy has occurred. Earlier automatic approval review required explicit authorization for publishing new code to this public repository; do not bypass that requirement.

## Resume and verify

Reproduce dependency-backed test in a disposable development directory:

```sh
npm install --prefix /tmp/xl-delete-pin-tools --no-save --no-package-lock linkedom@0.18.12
NODE_PATH=/tmp/xl-delete-pin-tools/node_modules node qa/verify-delete-pin.cjs
node qa/plan-a2/verify-runtime-revision-tests.cjs
node qa/plan-a3a/verify-backup-source.cjs
```

After the owner authorizes publishing this fix to `nileshkchaubey-glitch/Xl-billing`, create a Draft PR, inspect exact-head CI, and leave merge/deployment to the owner. Do not bundle the paused A3b backup branch.
