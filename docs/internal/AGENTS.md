# Context for AI Agents & Developers

This document provides a high-level overview of the TaskFlow application architecture, conventions, and key workflows. It is intended to help AI agents and new developers quickly understand the codebase.

## 1. Project Overview

**TaskFlow** is a modern, privacy-focused Kanban application built with Next.js. It aims to replicate the speed and keyboard-centric workflow of Linear, while offering the visual flexibility of Trello.

### Key Goals
- **Performance**: Fast interactions, optimistic UI updates.
- **Privacy**: Local-first configurable (future: local LLMs).
- **Simplicity**: Clean, distraction-free UI.

## 2. Technical Architecture

### Core Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript throughout
- **Styling**: Tailwind CSS + `shadcn/ui` (Radix UI primitives)
- **State Management**: `zustand` for client-side global state (e.g., sidebar customization).
- **Database**: SQLite (via `better-sqlite3`) + Drizzle ORM.
- **Authentication**: NextAuth.js (v5 beta / v4 adapter pattern) - currently GitHub provider.

### Directory Structure (`src/`)
- **`app/`**: Next.js App Router pages and layouts.
    - `api/`: Backend API routes.
    - `(app)/`: Protected application routes (dashboard, boards).
    - `login/`: Public authentication pages.
- **`components/`**: React components.
    - `ui/`: Reusable primitive components (buttons, inputs, dialogs) - mostly from shadcn.
    - `board/`: Complex components specific to the Kanban board (Column, Card, BoardView).
    - `modals/`: Global modals (CardDetailModal, etc.).
- **`db/`**: Database configuration.
    - `schema.ts`: Drizzle schema definitions.
    - `index.ts`: Database client initialization.
- **`lib/`**: helper functions and utilities.
    - `utils.ts`: Common utility functions (cn, headers).
- **`actions/`**: Server Actions for data mutations (createCard, updateBoard, etc.).

## 3. Key Workflows & Patterns

### 3.1 Data Fetching & Mutation
- **Fetching**: mostly done efficiently in Server Components directly via Drizzle.
- **Mutations**: Server Actions are used for form submissions and interactive elements.
    - **Optimistic Updates**: Using `useOptimistic` hook where possible for immediate feedback.

### 3.2 Drag and Drop
- Implemented using `@dnd-kit`.
- Logic is encapsulated in `src/components/board/board-view.tsx` (or similar container).
- Handles both Column reordering and Card reordering (cross-column).

### 3.3 Database Schema (Key Entities)
- **User**: App users.
- **Board**: Top-level container for tasks.
- **Column**: Vertical lists within a board.
- **Card**: Individual tasks.
    - Has `position` (float/int) for ordering.
    - Links to `Activity` log.
- **Activity**: Audit log for actions (created, moved, updated).

### 3.4 Styling & UI
- **Tailwind**: Utility-first styling.
- **Theming**: `next-themes` for Dark/Light mode support.
- **Icons**: `lucide-react`.

## 4. Development Conventions

- **Filenames**: Kebab-case (`my-component.tsx`).
- **Components**: Functional components with named exports.
- **Types**: Co-located with components or in `types.ts` if shared broadly.
- **Imports**: modifying `@/` alias for `src/` root.

## 5. Important Commands
- `npm run dev`: Start dev server.
- `npm run db:push`: Push schema changes to SQLite.
- `npm run db:studio`: Open Drizzle Studio to view data.
- `npm run db:seed`: Seed the database with dummy data.
