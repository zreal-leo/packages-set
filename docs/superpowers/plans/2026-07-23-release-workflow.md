# Automated Release Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace manual release commits with a validated Changesets Version PR and OIDC-based npm publishing flow.

**Architecture:** Pull requests receive non-mutating CI and Changesets status feedback. Pushes to `main` validate the exact commit, update a single Version Packages PR, detect unpublished package versions through the npm registry, and publish only those versions from an environment-protected OIDC job.

**Tech Stack:** GitHub Actions, Changesets 2.x, `changesets/action@v1`, pnpm 11.15.1, Node.js 24, npm 11.5.1+, npm Trusted Publishing.

## Global Constraints

- Keep packages independently versioned.
- Do not use a long-lived npm publish token.
- Use `publish.yml`, environment `npm`, and `id-token: write` for npm Trusted Publishing.
- Do not rely on commit messages to trigger publishing.
- Run type checking, non-mutating lint, and every package build before publishing.
- Do not automatically push historical reconciliation tags during this implementation.

---

### Task 1: Make repository checks reusable and non-mutating

**Files:**

- Modify: `package.json`

**Interfaces:**

- Produces: `build`, `check`, `changeset`, `version`, `publish:packages`, `lint`, and `lint:fix` scripts consumed by local development and GitHub Actions.

- [ ] Replace the combined `release` script with separate Changesets lifecycle scripts.
- [ ] Change `lint` to omit `--fix` and add `lint:fix` for local fixes.
- [ ] Add a recursive workspace `build` script and a composed `check` script.
- [ ] Run `pnpm run check`; expect exit status 0.

### Task 2: Add pull request validation and Changesets feedback

**Files:**

- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/changesets.yml`

**Interfaces:**

- Consumes: the root `check` script.
- Produces: a required CI status and a Changesets status comment on pull requests.

- [ ] Add a least-privilege `pull_request` CI workflow with frozen installation and `pnpm run check`.
- [ ] Add a `pull_request_target` status workflow that only checks out and reads pull request content; do not execute pull request code.
- [ ] Split read and comment permissions into separate jobs as recommended by Changesets.
- [ ] Add per-PR concurrency with cancellation of superseded runs.

### Task 3: Replace commit-message publishing with Version PR automation

**Files:**

- Modify: `.github/workflows/publish.yml`

**Interfaces:**

- Consumes: pending `.changeset/*.md` files and package versions.
- Produces: a Version Packages PR or `should_publish=true` for unpublished local versions.

- [ ] Keep the `main` push trigger and remove the `RELEASING` head-commit condition.
- [ ] Add non-cancelling release concurrency.
- [ ] Validate the main commit before release orchestration.
- [ ] Run `changesets/action@v1` without its token-based publish input, using the root `version` script.
- [ ] Compare each public workspace package's local version with `npm view <name> version`; fail on registry errors and output whether publication is required.

### Task 4: Publish with OIDC and synchronize release metadata

**Files:**

- Modify: `.github/workflows/publish.yml`
- Modify: `packages/branch-helper/package.json`
- Modify: `packages/console-temp/package.json`
- Modify: `packages/fmt-init/package.json`

**Interfaces:**

- Consumes: `should_publish=true`, npm Trusted Publisher configuration, and the `npm` GitHub Environment.
- Produces: npm package versions, remote package tags, and GitHub Releases.

- [ ] Add a publish job gated by `should_publish`, environment `npm`, and `id-token: write`.
- [ ] Use Node.js 24, npm 11.5.1+, pnpm 11.15.1, and a frozen lockfile.
- [ ] Run `pnpm run check`, then `pnpm run publish:packages` without `NPM_TOKEN`.
- [ ] Preserve the publish exit status, push tags created for successful packages even after a partial failure, and then report the original failure.
- [ ] Create missing GitHub Releases only for package tags that exist after publication.
- [ ] Canonicalize every package repository URL to `git+https://github.com/zreal-leo/packages-set.git`.

### Task 5: Document operation and migration

**Files:**

- Create: `docs/releasing.md`

**Interfaces:**

- Produces: maintainer instructions for changesets, Version PR review, external configuration, verification, and recovery.

- [ ] Document contributor commands and when a changeset is unnecessary.
- [ ] Document npm Trusted Publisher fields for all three packages.
- [ ] Document GitHub `npm` Environment protection.
- [ ] Document one-time historical tag reconciliation commands without executing them.
- [ ] Document failed and partial publish recovery.

### Task 6: Verify the complete change

**Files:**

- Test: all modified JSON, YAML, Markdown, TypeScript, and package build inputs.

**Interfaces:**

- Confirms: local code checks and static workflow invariants.

- [ ] Run `pnpm run check`; expect exit status 0.
- [ ] Run `pnpm exec oxfmt --check` on changed supported files; expect exit status 0.
- [ ] Confirm only the publish job has `id-token: write`.
- [ ] Confirm no workflow references `NPM_TOKEN` or `RELEASING`.
- [ ] Confirm package repository URLs are canonical and only the root declares `packageManager`.
- [ ] Run `git diff --check`; expect no whitespace errors.
- [ ] Review `git diff` and report the external npm/GitHub settings that cannot be verified locally.
