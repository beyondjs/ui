# Validation

## Current workflow

UI has documentation only. No dependencies, compiler, loader, browser application, test runner, build or CLI exist. There are no unit, integration or acceptance commands to execute and no permanent executable fixtures yet. `npm install`, `npm test`, `npm run build` and `npm run dev` are not supported workflows. Documentation inspection needs Git and a text editor; checks may use any available Markdown link checker.

For documentation changes, validate local links and anchors, English and portability, the thin `CLAUDE.md` bridge, the shared coding/documentation standard copies and `git diff --check`. With an unborn branch, inspect untracked documents too: a clean diff does not check them. Confirm `git status --short --branch`, `git symbolic-ref HEAD` and `git for-each-ref` preserve the original state apart from intended files. Do not stage files just to validate them.

Within Beyond Suite, verify `git check-ignore -v ui/README.md` selects `/ui/`, `git ls-files -- ui` is empty and UI resolves its own Git root. Check its repository and startup inventory entries. Root/suite list, dry-run, start, readiness and shutdown checks are inapplicable: UI owns no service or selector profile. Shared launcher archives and adapter-consumer registration are likewise inapplicable. No fake server is needed to close onboarding.

See [onboarding evidence](reviews/2026-09-23/onboarding.md) for executed results. Documentation checks establish neither component behavior nor consumer integration.

## Test organization for implementation

The README must expose actual commands, prerequisites, expected results and fixtures when implementation adds them. Document contract/unit, integration and complete acceptance levels separately, naming the compiler, loader and browser actually exercised.

- Put contract/unit and integration tests in `tests/` (or a documented `test/` convention), complete installed/composed/exported journeys in `acceptance/`, physical examples under the consuming area's `fixtures/`, and harness infrastructure under `support/`. Each fixture group and acceptance entry needs its own guide.
- Keep source examples, harnesses and assertions distinct. Store substantive applications, modules, components, manifests, styles and assets as readable files with their real extensions; do not hide them in strings, encoded maps or source generators. Small primitive inputs, expected values, protocol payloads and short edits may remain inline. Necessary generation cases such as stress inputs must document why and how to reproduce them.
- Copy mutable fixtures to unique temporary directories before editing; retain immutable originals. Allocate ports, support paths with spaces, await readiness rather than fixed delays, and clean up owned processes/directories on success and failure. Never stop unrelated services.
- Import what consumers import and assert outcomes, diagnostic codes, failure and recovery. Keep fixtures out of production discovery/distribution unless acceptance explicitly verifies their inclusion. Preserve scenario identities and assertions during migrations.
- For Packages-compiled Beyond modules, use `beyond test`; public module tests are named `<module>.test.ts` beside the module directory, with cross-package tests under `tests/`. Engine-compiled implementation modules use checkout-level `tests/` with utilities validation supplying compiler servers and loader. Ordinary Node/browser tests need not use that runner. Select and document the applicable boundary when UI's authoring model is chosen.
- React and plain DOM consumer tests must cover real supported artifacts, accessible behavior, cleanup, styles and motion; a fixture pass is not product or hosted acceptance. Record independent checks separately from integrated journeys.

No exceptions or runtime test results exist for this scaffold. Implementation remains responsible for adding and executing these checks, including standalone installation and both shared-launcher paths if a runnable showcase is commissioned.
