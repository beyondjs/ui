# UI onboarding — 2026-09-23

## Scope and provenance

Read-only Git inspection and documentation preparation in the owner's existing UI clone. Before writing, the worktree contained only `.git`; no files or user changes existed. `HEAD` was `refs/heads/main`, unborn, with configured upstream `origin/main` absent. The configured origin was `git@github.com:beyondjs/ui.git`. Local branches, remote-tracking refs and tags were empty; `git rev-list --all --count` returned 0 and `git log --all` returned no history. No fetch, ref change, branch transition, initial commit, commit, push, deployment or publication was performed.

`git ls-remote --symref origin HEAD 'refs/heads/*' 'refs/tags/*'` succeeded with exit 0 and no output after the sandbox's initial DNS failure. The remote advertised no HEAD, heads or tags at inspection time. The remote exists and is accessible; these observations do not establish its creation date or rule out inaccessible/deleted historical objects. The clone is empty by observable worktree and ref history, not emptied by this task.

## Preparation

UI gained an autonomous README, canonical AGENTS.md, thin CLAUDE.md, credential/artifact ignore rules, shared documentation instructions and coding standards (no exceptions), architecture/decision boundary, validation/test organization guide and temporary-document index. It has no package manifest or runtime code. Suite registration consists of `/ui/` in `.gitignore`, the repository inventory, README entry and explicit library-scaffold startup classification. No root/suite service, port, fake server, launcher archive or adapter-consumer registration applies.

Branding's README, architecture and foundations guides now state the UI boundary. Existing tokens remain canonical in Branding, with no competing copy. React and plain DOM are intended consumers, not executed integrations. Renderer, packaging and extraction remain future work; no rename or merge is selected.

## Verification

Executed on 2026-09-23: local Markdown targets/anchors for all UI documents and newly added suite/reference links; equality of shared coding-standard sections and full documentation instructions; exact `@AGENTS.md` bridge; whitespace and portable-path checks; suite ignore match; absence of UI files from the suite index; independent UI Git root; unborn `main`, empty refs and zero reachable commits preserved after preparation. All passed. These checks include untracked scaffold files, which `git diff --check` alone does not cover.

Runtime unit, integration, browser, build, standalone installation and root/suite startup checks are inapplicable because no implementation exists. Future implementation must supply real commands, consumer fixtures and acceptance; no runtime acceptance is claimed. Existing unrelated suite/reference uncommitted changes were preserved.

## Family reference synchronization

**No reference impact:** documentation-only ownership and repository preparation changes nothing a person can do, see or reach in a product or simulation and changes no admission/refusal meaning. Reference documentation was aligned in the same assignment. No surface, journey, matrix row, finding or work identifier is affected. Reference version 0.2.0 and token version 0.1.0 remain unchanged; the inspected reference has pre-existing uncommitted work. UI has no revision (unborn `main`); this record describes its uncommitted scaffold. Aesthetic/interaction proposals remain unapproved. No browser rerun or model/backlog regeneration is required for these documentation-only changes.
