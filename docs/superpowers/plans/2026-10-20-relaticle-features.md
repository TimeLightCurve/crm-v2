# Relaticle Feature Expansion Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Implement Relaticle-inspired record, customization and collaboration workflows in the existing Forma application.
**Architecture:** Browser-persistent typed repository; composable record views and drawers; optional server-side LM Studio transport. Existing calling and scheduling components remain available.
**Tech Stack:** Next.js 16.4.2, React 19, TypeScript, Tailwind 4, motion/react.
**Spec:** docs/relaticle/design.md

## Global Constraints

- Inline Tailwind; EN/FA and RTL; supplied fonts; pastel visual language.
- Do not replace the existing app with Laravel or imply local roles are server authorization.
- No external messages or live AI calls by default.

## Review Focus

- Workspace isolation and relation validation on import and updates.
- Saved field definitions must validate persisted values; conditional hidden fields do not block saves.
- Board movement must preserve record identities, order and activity.
- Restore/delete and comment reply operations must not orphan foreign workspace data.
- Storage failure and unavailable local model must report errors without losing the UI session.

## Task 1: Reference audit and feature map
- [x] Clone five references, inspect website and core feature surfaces.
- [x] Save commit/file inventory and design boundaries.
- [x] Complete coverage matrix with implementation links and backend-only gaps.

## Task 2: Shared repository and model
- [x] Implement records, fields, relations, comments, activities, views and workspaces.
- [x] Verify validation, workspace isolation, board order, CSV and persistence with meaningful model tests.

## Task 3: Record workspace
- [x] Build responsive tables/cards/Kanban, filters/views/import/export and shared record drawer/editor.
- [x] Build customization, comments and activity components.
- [x] Connect navigation and call workspace; preserve original scheduling.

## Task 4: Workspace settings and local AI
- [x] Implement local workspace/team controls and optional LM Studio server transport.
- [x] Document local versus backend behavior and integration interfaces.

## Task 5: Verification
- [x] Browser-check CRUD, relations, board drag, fields, comments, trash, workspace isolation, persistence and EN/FA responsiveness.
- [x] Run lint, TypeScript/model tests and production build; review screenshots.
