# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

medi-test is a test management system for the medimo application, built with **React Router v7**, **Effect TS**, and **Domain-Driven Design (DDD)** principles. It combines functional programming patterns with modern React development to manage test scenarios and track execution results.

**Service Purpose:**
- Store test scenarios in Git (YAML/Markdown files) for version control
- Track test execution results in PostgreSQL for real-time updates
- Integrate with GitHub PR and Linear for test scope suggestions
- Provide real-time updates via SSE (Server-Sent Events)
- Generate HTML reports and CSV exports
- Send Slack notifications for test run events
- Support multiple projects and environments (staging/production)
- Implement OAuth 2.0 / OIDC authentication with role-based access control

**Tech Stack:**
- React Router v7 (SSR enabled, file-based routing)
- Effect TS v3 (dependency injection, error handling)
- TypeScript (strict mode)
- PostgreSQL 14+ (test execution results storage)
- Git (test scenario versioning)
- Tailwind CSS v4 (@theme syntax)
- Shadcn/ui + Radix UI
- React Hook Form + Zod
- TipTap (rich text editor)
- OAuth 2.0 / OIDC (authentication)
- SSE (real-time updates)
- Docker (deployment)

## Development Commands

```bash
# Development
pnpm dev                    # Start dev server (http://localhost:5173)
pnpm build                  # Production build
pnpm start                  # Run production build

# Type Checking
pnpm typecheck              # Generate types + TypeScript check
npx tsc --noEmit            # TypeScript check only (MUST PASS before commit)

# Formatting
pnpm fmt                    # Format with oxfmt
```

## Architecture: Layered DDD with Effect TS

medi-test implements **Hexagonal Architecture (Ports & Adapters)** with strict layer separation:

```
┌─────────────────────────────────────┐
│    Presentation Layer               │  React components, hooks, adapters
│  (presentation/, app/)              │
└────────────────┬────────────────────┘
                 │ depends on
                 ↓
┌─────────────────────────────────────┐
│    Application Layer                │  Use cases, Port definitions (Tag)
│  (application/)                     │
└────────────────┬────────────────────┘
                 │ depends on
                 ↓
┌─────────────────────────────────────┐
│      Domain Layer                   │  Pure business logic, models
│  (domain/)                          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│    Infrastructure Layer             │  Port implementations (adapters)
│  (infrastructure/)                  │  ← implements Application ports
└─────────────────────────────────────┘
```

### Layer Rules

**✅ Allowed Dependencies:**
- Presentation → Application
- Application → Domain
- Infrastructure → Application (implements ports)

**❌ Prohibited Dependencies:**
- Domain → Application (Domain is pure)
- Domain → Infrastructure
- Application → Infrastructure (uses Tag abstraction)
- Presentation → Infrastructure (uses Application layer)

### Current Implementation Status

The project has **two architecture patterns**:

1. **Simple features** (e.g., `auth/`): Components directly in `presentation/features/`
2. **Complex features** (e.g., `voice-input/`): Full DDD structure within feature directory:
   ```
   presentation/features/voice-input/
   ├── ui/                    # React components, hooks, adapters
   ├── application/           # Use cases, ports (Tag)
   ├── domain/                # Models, errors (pure TypeScript)
   └── infrastructure/        # Browser API adapters, Layers
   ```

**Note:** Root-level `domain/`, `application/`, `infrastructure/` directories are defined in tsconfig path aliases but not yet created. Complex features implement DDD internally for now.

**Planned Features:**
- Git-based scenario management (YAML/Markdown files)
- PostgreSQL test run execution tracking
- SSE real-time updates for test progress
- GitHub PR + Linear integration for test scope suggestions
- OAuth 2.0 / OIDC authentication with RBAC
- Slack notifications
- HTML/CSV report generation

## Directory Structure

```
presentation/
├── components/
│   ├── ui/              # Shadcn/ui components (Button, Input, Form, etc.)
│   │                    # Pure presentation, no business logic
│   └── hooks/           # Shared React hooks (e.g., use-mobile.ts)
├── features/            # Feature modules (UI + logic, self-contained)
│   ├── auth/            # Simple: just login-form.tsx
│   ├── text-editor/     # TipTap editor with voice integration
│   │   ├── text-editor.tsx
│   │   ├── components/toolbar.tsx
│   │   ├── hooks/use-text-editor.ts
│   │   ├── extensions/  # TipTap extensions config
│   │   └── types/
│   └── voice-input/     # Complex: full DDD structure
│       ├── ui/          # React layer
│       │   ├── components/ (voice-input-control, recording-indicator, etc.)
│       │   ├── hooks/use-voice-input.ts
│       │   └── adapters/voice-input-adapter.ts (Effect → React bridge)
│       ├── application/
│       │   ├── ports/   # Tag definitions (SpeechRecognitionService, etc.)
│       │   └── usecases/ (start-voice-input.ts, stop-voice-input.ts)
│       ├── domain/
│       │   ├── models/voice-input.ts (VoiceInputState, TranscriptSegment)
│       │   └── errors/voice-input-errors.ts
│       └── infrastructure/
│           ├── adapters/ (web-speech-adapter.ts, media-recorder-adapter.ts)
│           └── layers/browser-layer.ts (Effect Layer composition)
├── pages/               # Route-level components (thin, compose features)
│   ├── home-page.tsx
│   └── login-page.tsx
└── lib/                 # Shared utilities, Zod schemas
    ├── utils.ts         # cn() utility
    └── schemas/auth.ts

app/                     # React Router config
├── routes.ts            # Route definitions (index, login)
├── root.tsx             # Root layout
└── app.css              # Tailwind v4 global styles (@theme)

docs/                    # Detailed architecture documentation
├── architecture.md      # Layer rules, Port/Adapter pattern
├── directory-structure.md
├── effect-guide.md      # Effect TS basics, Tag/Layer usage
├── implementation-guide.md
├── coding-standards.md
└── testing.md
```

### Dependency Flow

```
pages/ → features/ → components/ui/ → lib/
```

- `pages/` orchestrate features, handle React Router actions/loaders
- `features/` contain business logic, state management
- `components/ui/` are pure presentation (no logic)
- `lib/` has framework-agnostic utilities

**Critical:** `components/ui/` CANNOT import from `features/` (one-way flow).

## Path Aliases (tsconfig.json)

```typescript
"~/*"                  → "./presentation/*"
"@app/*"               → "./app/*"
"@domain/*"            → "./domain/*"       // not yet created
"@application/*"       → "./application/*"  // not yet created
"@infrastructure/*"    → "./infrastructure/*" // not yet created
"@shared/*"            → "./shared/*"       // not yet created
```

**Always use path aliases, never relative imports:**

```tsx
// ✅ Good
import { Button } from "~/components/ui/button";
import { LoginForm } from "~/features/auth/login-form";

// ❌ Bad
import { Button } from "../../components/ui/button";
```

## Effect TS Patterns

### Tag (Port Definition)

```typescript
// application/ports/speech-recognition.ts
export class SpeechRecognitionService extends Context.Tag("SpeechRecognitionService")<
  SpeechRecognitionService,
  {
    start: () => Effect.Effect<void, SpeechRecognitionError>;
    stop: () => Effect.Effect<void, never>;
  }
>() {}
```

### Layer (Adapter Implementation)

```typescript
// infrastructure/adapters/web-speech-adapter.ts
export const WebSpeechRecognitionLive = Layer.succeed(
  SpeechRecognitionService,
  {
    start: () => Effect.gen(function* () {
      // Browser API implementation
    }),
    stop: () => Effect.succeed(undefined),
  }
);
```

### Use Case (Application Layer)

```typescript
// application/usecases/start-voice-input.ts
export const startVoiceInput = Effect.gen(function* () {
  const recognition = yield* SpeechRecognitionService;
  yield* recognition.start();
});
```

### React Adapter (Presentation Layer)

```typescript
// ui/adapters/voice-input-adapter.ts
export const useVoiceInputAdapter = () => {
  const handleStart = async () => {
    const program = startVoiceInput.pipe(
      Effect.provide(BrowserLayer) // Inject dependencies
    );
    await Effect.runPromise(program);
  };
};
```

## React Router v7 Patterns

### Route Definition

```typescript
// app/routes.ts
import { type RouteConfig, route, index } from "@react-router/dev/routes";

export default [
  index("../presentation/pages/home-page.tsx"),
  route("login", "../presentation/pages/login-page.tsx"),
] satisfies RouteConfig;
```

### Server Actions

```typescript
// In page component
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  // Validate with Zod
  const validation = mySchema.safeParse(data);
  if (!validation.success) {
    return data(
      { errors: validation.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Process and redirect
  await processData(validation.data);
  return redirect("/success");
}
```

### Form Pattern (Client + Server Validation)

```tsx
// Client validation with React Hook Form
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "react-router"; // Server submission
import { Form as FormProvider } from "~/components/ui/form"; // React Hook Form

export function MyForm() {
  const form = useForm({
    resolver: zodResolver(mySchema), // Client validation
  });

  return (
    <FormProvider {...form}>
      <Form method="post"> {/* Server submission */}
        {/* Form fields */}
      </Form>
    </FormProvider>
  );
}
```

## TypeScript Strictness Rules

**NEVER:**
- ❌ Use `any` type
- ❌ Use `let` keyword (use `const` or `useState`)
- ❌ Use type assertions (`as`) without type guards
- ❌ Use dynamic dates (`new Date()`) - use fixed dates
- ❌ Place features under `components/` (sibling directories only)

**ALWAYS:**
- ✅ Use `type` modifier for type-only imports
- ✅ Run `npx tsc --noEmit` before committing
- ✅ Use path aliases (`~/`, `@app/*`)
- ✅ Use Japanese for all UI text (ログイン, not Login)
- ✅ Use `cn()` utility for className composition

```tsx
// ✅ Good
import type { ActionFunctionArgs } from "react-router";
const [value, setValue] = useState<string>("");
<Button className={cn("base", condition && "extra")}>ログイン</Button>

// ❌ Bad
import { ActionFunctionArgs } from "react-router";
let value: any = getData();
<Button className={`base ${condition ? "extra" : ""}`}>Login</Button>
```

## Styling with Tailwind CSS v4

```css
/* app/app.css */
@import "tailwindcss";

@theme {
  --color-primary: #567cb3;
  --color-secondary: #4a6fa0;
}
```

**Always use `cn()` utility for className composition:**

```tsx
import { cn } from "~/lib/utils";

<div className={cn(
  "base-class",
  conditional && "conditional-class",
  props.className
)} />
```

## Feature Implementation Guide

### Simple Feature (Auth-style)

```
features/new-feature/
├── my-component.tsx
├── hooks/
│   └── use-my-feature.ts
├── types/
│   └── my-types.ts
└── utils/
    └── helpers.ts
```

### Complex Feature (Voice-Input-style)

```
features/new-feature/
├── ui/                    # React layer
│   ├── components/
│   ├── hooks/
│   └── adapters/          # Effect → React bridge
├── application/           # Use cases + ports
│   ├── ports/             # Tag definitions
│   └── usecases/          # Effect programs
├── domain/                # Pure TypeScript
│   ├── models/            # Data.Class models
│   └── errors/            # Data.TaggedError
└── infrastructure/        # Implementations
    ├── adapters/          # Port implementations
    └── layers/            # Layer composition
```

## Common Patterns

### Domain Model (Effect TS)

```typescript
import { Data } from "effect";

export class VoiceInputState extends Data.Class<{
  isRecording: boolean;
  transcript: string;
}> {}
```

### Domain Error

```typescript
export class SpeechRecognitionError extends Data.TaggedError("SpeechRecognitionError")<{
  message: string;
}> {}
```

### Zod Schema (Shared Validation)

```typescript
// lib/schemas/auth.ts
import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "ユーザー名を入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
```

## Code Quality Checklist

Before committing:

1. ✅ Run `npx tsc --noEmit` (MUST PASS)
2. ✅ Run `pnpm typecheck` (generate types)
3. ✅ Verify no `any`, `let`, or type assertions
4. ✅ Verify path aliases used (no relative imports)
5. ✅ Verify Japanese UI text
6. ✅ Verify layer dependencies are correct

## Important Conventions

- **File naming:** kebab-case (`my-component.tsx`, `use-my-hook.ts`)
- **Components:** PascalCase (`MyComponent`)
- **Functions/variables:** camelCase (`myFunction`)
- **Types/Interfaces:** PascalCase (`MyType`) - NO `I` prefix
- **Constants:** SCREAMING_SNAKE_CASE (`API_BASE_URL`) or camelCase for local
- **Directories:** kebab-case (`my-feature/`)

## Documentation

For deeper architecture understanding, see:

- `docs/architecture.md` - Layer rules, Port/Adapter pattern
- `docs/effect-guide.md` - Effect TS basics, Tag/Layer usage
- `docs/implementation-guide.md` - Step-by-step feature creation
- `docs/coding-standards.md` - Detailed naming and style rules
- `docs/directory-structure.md` - Complete file organization
- `docs/testing.md` - Testing strategy

## Key Architectural Insights

1. **Port/Adapter Pattern:** Application defines Ports (Tag), Infrastructure provides Adapters (Layer), Presentation executes with `Effect.runPromise(program.pipe(Effect.provide(Layer)))`

2. **Effect Composition:** Use `Effect.gen()` with `yield*` for async-like syntax. Effect programs are lazy (nothing runs until `Effect.run*`).

3. **React Integration:** Adapters in `ui/adapters/` bridge Effect world (pure) to React world (imperative).

4. **SSR Support:** React Router config has `ssr: true`. Pages can export `loader` and `action` functions.

5. **Form Validation:** Zod schemas used twice - client (React Hook Form) and server (action).

6. **Japanese-First:** All UI text, error messages, validation messages in Japanese.
