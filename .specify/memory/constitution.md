<!--
Sync Impact Report
==================
Version change: [NEW] → 1.0.0
Modified principles: N/A (initial version)
Added sections: All sections (initial constitution)
Removed sections: N/A
Templates requiring updates:
  ✅ plan-template.md - Reviewed, Constitution Check section exists
  ✅ spec-template.md - Reviewed, requirements alignment verified
  ✅ tasks-template.md - Reviewed, task structure aligns with principles
Follow-up TODOs: None
-->

# medi-test Project Constitution

## Core Principles

### I. Hexagonal Architecture (Ports & Adapters)

**Declaration**: Every feature MUST implement strict layer separation with one-way dependencies. Application layer MUST define Ports via Effect TS Tags. Infrastructure layer MUST provide Adapters via Effect TS Layers. Presentation layer MUST NOT directly depend on Infrastructure.

**Allowed Dependencies**:

- Presentation → Application
- Application → Domain
- Infrastructure → Application (implements ports)

**Prohibited Dependencies**:

- Domain → Application (Domain is pure)
- Domain → Infrastructure
- Application → Infrastructure (uses Tag abstraction)
- Presentation → Infrastructure (uses Application layer)

**Rationale**: Dependency inversion ensures Domain logic remains pure and testable without external dependencies. Port/Adapter pattern allows easy substitution of implementations (e.g., mock adapters for testing, different storage backends).

### II. Effect TS Dependency Injection

**Declaration**: All external dependencies (APIs, databases, browser APIs) MUST be abstracted as Effect TS Tags in the Application layer. Implementations MUST be provided as Layers in the Infrastructure layer. Effect programs MUST use `Effect.gen()` with `yield*` syntax for composability.

**Requirements**:

- Tag naming: `@services/ServiceName` or `@repositories/RepositoryName`
- Layer naming: `PascalCase` with implementation prefix (e.g., `HttpScenarioRepository`, `WebSpeechRecognitionLive`)
- Error types MUST extend `Data.TaggedError`
- Domain models MUST extend `Data.Class` for immutability

**Rationale**: Effect TS provides type-safe dependency injection, explicit error handling in the type system, and lazy evaluation for testability. This eliminates runtime DI framework overhead and makes dependencies explicit at compile time.

### III. Type Safety & Immutability (NON-NEGOTIABLE)

**Declaration**: TypeScript strict mode MUST be enabled. The following constructs are PROHIBITED:

- `any` type (use `unknown` with type guards)
- `let` keyword (use `const` or React `useState`)
- Type assertions (`as`) without runtime type guards
- Dynamic dates (`new Date()`) in test code
- Relative imports (MUST use path aliases: `~/`, `@app/*`, etc.)

**Requirements**:

- `npx tsc --noEmit` MUST pass before every commit
- All data models MUST use `Data.Class` for structural equality
- All mutations MUST go through React state hooks or Effect state management

**Rationale**: Immutability prevents unintended side effects. Strict typing catches errors at compile time. Effect TS data structures provide built-in structural equality and serialization.

### IV. Japanese-First UI Language

**Declaration**: All user-facing text (UI labels, error messages, validation messages, button text, form placeholders) MUST be written in Japanese.

**Examples**:

- ✅ `<Button>ログイン</Button>`
- ❌ `<Button>Login</Button>`
- ✅ `z.string().min(1, "ユーザー名を入力してください")`
- ❌ `z.string().min(1, "Please enter username")`

**Rationale**: The medimo application serves Japanese users. Consistent Japanese throughout the UI improves accessibility and user experience. No internationalization overhead needed for single-language product.

### V. Server-Side Rendering & Progressive Enhancement

**Declaration**: React Router v7 SSR MUST be enabled. Page components MAY export `loader` and `action` functions for server-side data fetching and mutations. Forms MUST support server-side submission with JavaScript disabled (progressive enhancement).

**Requirements**:

- Use React Router `<Form>` component for server submission
- Validate with Zod schemas on both client (React Hook Form) and server (action)
- Loader functions MUST return serializable data (no functions, no circular refs)
- Actions MUST use `redirect()` or `data()` for responses

**Rationale**: SSR improves initial page load performance and SEO. Progressive enhancement ensures functionality without JavaScript. Dual validation (client + server) provides immediate feedback while maintaining security.

### VI. Git-Based Scenario Management

**Declaration**: Test scenarios MUST be stored as YAML/Markdown files in Git for version control. Test execution results MUST be stored in PostgreSQL for real-time updates and complex queries.

**Storage Strategy**:

- **Git**: Scenarios (immutable, version-controlled, code-reviewable)
- **PostgreSQL**: Test runs, results, progress (mutable, transactional, query-optimized)
- **Versioning**: Store Git commit SHA in test run records to freeze scenario version

**Rationale**: Git provides free versioning, audit trails, and PR workflows for scenario changes. PostgreSQL handles concurrent updates and complex aggregations needed for real-time progress tracking. Hybrid approach optimizes each data type for its access pattern.

## Technical Standards

### Development Workflow

**Pre-Commit Checklist** (MUST PASS):

1. `npx tsc --noEmit` - Zero type errors
2. `pnpm typecheck` - Generate React Router types
3. `pnpm fmt` - Format with oxfmt
4. Verify no `any`, `let`, or type assertions without guards
5. Verify path aliases used (no relative imports)
6. Verify Japanese UI text
7. Verify layer dependencies correct

**Architecture Patterns**:

- **Simple features** (e.g., login form): Place directly in `presentation/features/[feature-name]/`
- **Complex features** (e.g., voice input): Implement full DDD structure within feature directory with `ui/`, `application/`, `domain/`, `infrastructure/` subdirectories

**File Naming Conventions**:

- Files: `kebab-case` (e.g., `voice-input-control.tsx`)
- Components: `PascalCase` (e.g., `VoiceInputControl`)
- Functions/variables: `camelCase` (e.g., `startVoiceInput`)
- Types/Interfaces: `PascalCase` (e.g., `VoiceInputState`) - NO `I` prefix
- Constants: `SCREAMING_SNAKE_CASE` for globals, `camelCase` for locals

### Styling Standards

**Tailwind CSS v4**: Use `@theme` directive in `app/app.css` for design tokens. ALWAYS use `cn()` utility from `~/lib/utils` for className composition (NEVER template literals).

**Example**:

```tsx
// ✅ Good
<div className={cn("base-class", conditional && "conditional-class", props.className)} />

// ❌ Bad
<div className={`base-class ${conditional ? "conditional-class" : ""}`} />
```

### React Integration with Effect

**Adapter Pattern**: Create adapters in `ui/adapters/` to bridge Effect programs to React hooks. Adapters MUST:

- Accept Layer dependencies as parameters
- Use `Effect.runPromise()` for async execution
- Handle errors with try/catch or Effect error handling
- Update React state via hooks

**Example**:

```typescript
// ui/adapters/voice-input-adapter.ts
export const useVoiceInputAdapter = () => {
  const handleStart = async () => {
    const program = startVoiceInput.pipe(Effect.provide(BrowserLayer));
    await Effect.runPromise(program);
  };
};
```

## External Integrations

### Authentication

**OAuth 2.0 / OIDC**: MUST support role-based access control (RBAC) with roles stored in JWT claims. Authorization MUST be enforced at both Application layer (use cases) and React Router loader/action level.

### Real-Time Updates

**SSE (Server-Sent Events)**: MUST be used for pushing test execution progress to multiple clients. WebSocket is prohibited (overkill for one-way updates).

### Third-Party APIs

**Port Definitions Required**: GitHub API, Linear API, and Slack API MUST be abstracted as Effect TS Tags in Application layer. Mock implementations MUST be provided for testing.

## Governance

### Amendment Process

1. Propose changes via pull request to this file
2. Document rationale and migration plan
3. Update dependent templates (plan, spec, tasks, command files)
4. Increment version using semantic versioning (MAJOR.MINOR.PATCH)
5. Require approval from project maintainer

### Version Semantics

- **MAJOR**: Backward-incompatible changes (e.g., removing principles, changing fundamental architecture rules)
- **MINOR**: New principles added or existing principles expanded with new requirements
- **PATCH**: Clarifications, wording improvements, typo fixes, non-semantic refinements

### Compliance Verification

- All code reviews MUST verify compliance with Core Principles
- Any violation MUST be explicitly justified in PR description
- Complexity introduced beyond these principles MUST document "Why Needed" and "Simpler Alternative Rejected Because"
- Constitution supersedes all other documentation in case of conflict

### Guidance Files

- **Runtime Development**: Use `CLAUDE.md` for detailed implementation patterns and examples
- **Architecture Deep Dive**: See `docs/architecture.md`, `docs/effect-guide.md`
- **Standards Reference**: See `docs/coding-standards.md`, `docs/implementation-guide.md`

**Version**: 1.0.0 | **Ratified**: 2026-02-04 | **Last Amended**: 2026-02-04
