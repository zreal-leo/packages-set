# Automated Release Workflow Design

## Goal

Replace local version commits and `RELEASING` commit-message triggers with a reviewed Changesets Version PR and an automated, validated npm release using Trusted Publishing.

## Current State

- `pnpm release` combines `changeset add` and `changeset version`.
- A push to `main` publishes only when the head commit starts with `RELEASING`.
- The publish workflow installs dependencies and immediately runs `changeset publish`.
- Package builds happen individually inside `prepublishOnly`.
- npm versions are ahead of the repository's remote tags.

## Target Architecture

### Pull Request Validation

A dedicated CI workflow runs frozen dependency installation, type checking, non-mutating lint, and all package builds for every pull request. A separate read-only Changesets status workflow comments on whether the pull request includes release metadata.

GitHub places CI runs for the `GITHUB_TOKEN`-created Version Packages pull request in an approval-required state. A maintainer approves those runs before merging; this avoids storing a separate GitHub App private key while preserving review and CI.

### Version Pull Request

Every push to `main` runs the release workflow after validation. `changesets/action@v1`, which matches the repository's Changesets 2.x dependency, creates or updates one Version Packages pull request. The pull request contains consumed changesets, package version changes, and changelog updates.

### Publishing

The workflow compares local package versions with npm. Publishing runs only when at least one local version is not yet present on npm, which identifies a merged Version Packages pull request without relying on its commit message.

The publish job:

1. Uses a GitHub-hosted runner and npm 11.5.1 or newer.
2. Passes all type, lint, and build checks again.
3. Publishes through npm Trusted Publishing with GitHub OIDC.
4. Pushes the package tags created by Changesets.
5. Creates a GitHub Release for each current package tag that does not already have one.

The job is protected by a GitHub `npm` environment and a non-cancelling release concurrency group.

## Scripts

- `changeset`: create release metadata only.
- `version`: apply pending changesets for the automated Version PR.
- `publish:packages`: publish unpublished versions.
- `build`: build every workspace package.
- `lint`: check without modifying files.
- `lint:fix`: apply safe lint fixes locally.
- `check`: run type checking, lint, and all builds.

## Security

- No long-lived npm publish token is stored in GitHub.
- The release job has `id-token: write`; other jobs do not.
- The npm Trusted Publisher for all three packages must match repository `zreal-leo/packages-set`, workflow `publish.yml`, and environment `npm`.
- npm provenance is generated automatically for public packages published from a public repository.
- Package repository URLs use the canonical GitHub URL required by npm's Trusted Publishing verification.

## Failure Recovery

- A validation failure prevents publication.
- A failed publish can be rerun. Changesets skips versions already present on npm and continues with unpublished versions.
- If a multi-package publish partially fails, the workflow still pushes tags and creates GitHub Releases for packages that succeeded before reporting the failure.
- Release concurrency prevents overlapping publication attempts.
- The initial migration documents a one-time reconciliation for historical missing tags; it does not push those tags automatically.

## Out of Scope

- Pre-release channels and npm staged publishing.
- Changing independent package versioning to fixed or linked versions.
- Automatically configuring npm package settings or GitHub Environment protection rules.
