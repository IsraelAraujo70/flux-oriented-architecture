# LLM Guidelines: Flux-Oriented Architecture (FOA)

**Context for AI Agents:**
This document outlines the architecture, patterns, and coding standards for the **Flux-Oriented Architecture (FOA)** framework. Use this context when generating code, debugging, or explaining the project.

---

## 1. Project Overview
FOA is a **Node.js/TypeScript backend framework** that separates business logic (Actions) from execution flow (Flux).
- **Philosophy:** "Code actions, declare flows."
- **Goal:** orchestrate complex API logic via readable JSON definitions without writing boilerplate controller code.

## 2. Core Concepts

### A. Actions (`src/actions/*.ts`)
- **Definition:** Atomic units of business logic.
- **Structure:** TypeScript functions that export `default`.
- **Input:** Receives a `FluxContext` object.
- **Output:** Returns a value (Promise or sync) or throws an Error.
- **Best Practice:** Keep actions small, stateless, and focused on a single task (e.g., `fetchUser`, `calculateTax`).

```typescript
// Example Action
import { FluxContext } from 'flux-oriented-architecture';

export default async function myAction(context: FluxContext) {
  // Access inputs (body, query, params merged)
  const { id } = context.input;
  
  // Perform logic
  if (!id) throw new Error("ID required");
  
  return { success: true, id };
}
```

### B. Flux Definitions (`src/flux/*.json`)
- **Definition:** JSON files defining an API endpoint and its execution pipeline.
- **Location:** `src/flux/`.
- **Key Properties:**
  - `endpoint`: Route path (e.g., `/users/:id`).
  - `method`: HTTP verb (GET, POST, etc.).
  - `flow`: Array of **FlowNodes**.

### C. Flow Nodes
The orchestration engine supports specific node types:
1. **Action:** Executes a file from `src/actions`.
   - `name`: Key to store result in context (available as `${name}`).
   - `path`: Relative path to action file (no extension).
   - `args`: Arguments object (supports interpolation).
2. **Condition:** logical `if/then/else`.
3. **ForEach:** Iterates arrays.
4. **Parallel:** Runs branches concurrently.
5. **Try/Catch:** Error handling.
6. **Return:** Sends HTTP response.

### D. FluxContext
The state object passed through the lifecycle of a request:
- `context.req`: Express Request.
- `context.res`: Express Response.
- `context.input`: Merged `req.body`, `req.query`, `req.params`.
- `context.results`: Map of all action results.
- `context.state`: Shared mutable state.
- `context[actionName]`: Shortcut to access action results directly.

### E. Interpolation (`${...}`)
String values in JSON can reference context data:
- `${input.email}` -> Access input field.
- `${userData.id}` -> Access result of action named "userData".

---

## 3. Directory Structure
```
project/
├── src/
│   ├── actions/    # logic (.ts files)
│   └── flux/       # orchestration (.json files)
├── foa.config.json # configuration
└── package.json
```

## 4. Development Constraints & Patterns
1. **No Controllers:** Do not write Express controllers manually. The `FluxServer` generates routes based on JSON files.
2. **TypeScript:** Use TypeScript for actions. The Loader handles `ts-node` registration automatically.
3. **Validation:** The CLI (`foa validate`) uses AJV to strict-check JSON flows.
4. **Errors:** Actions should throw standard Javascript `Error`s. Use `try/catch` nodes in Flux if you need specific recovery logic, otherwise the server returns 500.

## 5. Common Tasks (CLI)
- Start Dev: `foa dev` (Watch mode)
- Production: `foa start`
- Validate JSON: `foa validate`
- List Routes: `foa list`

---
**End of Guidelines**
