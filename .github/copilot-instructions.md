# TaskFlow Copilot Instructions

## Architecture Overview

TaskFlow is a **Next.js 14+ App Router** Kanban application with SQLite/Drizzle backend. Key architectural decisions:

- **Server Actions** (`src/app/actions/`) handle all mutations—never create API routes for CRUD operations
- **Server Components** fetch data directly via Drizzle; client components receive data as props
- **Optimistic UI** updates via `useTransition` and local state, then server sync
- **@dnd-kit** powers drag-and-drop in `kanban-board.tsx`—maintain the sensor/overlay pattern

## File Conventions

| Pattern | Location | Example |
|---------|----------|---------|
| Server Actions | `src/app/actions/{resource}.ts` | `cards.ts`, `boards.ts` |
| UI Primitives | `src/components/ui/` | shadcn/ui components (don't modify) |
| Feature Components | `src/components/board/`, `modals/`, `layout/` | `task-card.tsx` |
| DB Schema | `src/db/schema.ts` | All Drizzle table definitions |

## Code Patterns

### Server Actions
Always follow this pattern in `src/app/actions/`:
```typescript
"use server";
import { auth } from "@/auth";
import { db } from "@/db";
import { revalidatePath } from "next/cache";

export async function createCard(columnId: string, title: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  // ... db operations
  revalidatePath("/");
}
```

### Component Structure
- Use `"use client"` only when needed (hooks, interactivity)
- Import from `@/` alias (maps to `src/`)
- Use `lucide-react` for icons, `date-fns` for dates

### Database
- Schema changes: edit `src/db/schema.ts`, then `npm run db:push`
- IDs are UUIDs via `crypto.randomUUID()`
- Positions are integers for ordering (cards, columns, checklists)
- Relations defined with Drizzle `relations()` helper

## AI Integration

Multi-provider AI in `src/lib/ai.ts`:
- Supports Gemini, Groq, Ollama (configurable via `AI_PROVIDER` env)
- Always include rule-based fallback when AI unavailable
- AI actions exposed via `src/app/actions/ai.ts`

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run db:push      # Push schema changes to SQLite
npm run db:seed      # Seed with test data
npm run db:studio    # Drizzle Studio GUI
npm run lint         # ESLint
```

## Key Integration Points

- **Auth**: NextAuth v4 with GitHub provider, session via `auth()` helper
- **Drag-drop**: `@dnd-kit` in `kanban-board.tsx`—handle `DragEndEvent` for reordering
- **Theming**: `next-themes` provider, use `dark:` Tailwind variants
- **State**: Zustand for cross-component state (sidebar), React state for local UI
