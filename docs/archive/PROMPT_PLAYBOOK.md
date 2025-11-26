# Prompt Playbook – How to Use AI Agents for Really Nicca

> This file explains **how to talk to AI agents** (Gemini, Claude, etc.)  
> to generate code for Really Nicca **without chaos**.

---

## 1. Principles

1. **Specs first, code second**  
   Always reference `PROJECT_SPEC.md` and `ORGANIZE_FEATURES.md` before coding.

2. **Small scope per prompt**  
   One prompt = one small task (e.g., one route, one service, one component).

3. **Explicit file list**  
   ALWAYS tell the agent exactly which files it can create or modify.

4. **No architecture changes**  
   Agent should **not** move files, rename folders, or add new layers without explicit permission.

5. **Phase 1 only**  
   For now, all code should be under `organize` feature folders.  
   `gaps` and `memory` are placeholders only.

---

## 2. Roles

You can mentally treat AI as three “roles” (even if it’s the same model):

1. **Architect Agent** – Plans files, functions, and data flow. No code.
2. **Coder Agent** – Implements code for specific files only.
3. **Reviewer/Security Agent** – Reviews code for bugs, style, and security.

---

## 3. Context to Always Provide

In each important prompt, include:

- A reminder of the project:
  - *“We’re building Phase 1 (Organize) of Really Nicca – a knowledge graph engine.”*
- The relevant spec files:
  - *“Follow docs/PROJECT_SPEC.md and docs/ORGANIZE_FEATURES.md.”*
- The folder scope:
  - *“Only touch services/backend/src/features/organize/* and core/ml/python-client.service.ts.”*
- The shared types:
  - *“Use graph types from packages/types/src/graph.ts and entity.ts.”*

This helps the model not hallucinate new structures.

---

## 4. Template Prompts

### 4.1 Architect Prompt (Backend Example)

**Use this before coding a new feature in the backend.**

> You are the **architect** for Really Nicca (Phase 1 – Organize).  
> We are building a knowledge graph extraction + visualization engine.  
>  
> Read and follow:  
> - docs/PROJECT_SPEC.md  
> - docs/ORGANIZE_FEATURES.md  
>  
> Codebase layout (important):  
> - Backend code lives in `services/backend/src`.  
> - Phase 1 backend feature code belongs in `services/backend/src/features/organize`.  
> - Shared types live in `packages/types/src`.  
>  
> Task: Design the backend flow for the `/api/organize/extract` endpoint:  
> - It accepts raw text or uploaded file ID.  
> - It calls the ML service `/organize/extract`.  
> - It builds a graph using shared `Graph` types.  
> - It returns graph JSON to the frontend.  
>  
> Please:  
> 1. List which files should be created or modified.  
> 2. For each file, describe the functions/classes and their responsibilities.  
> 3. Describe the data flow step by step.  
>  
> Do NOT write code yet. Return only the plan.

---

### 4.2 Coder Prompt (Backend Example)

**Use after you have a plan from the architect.**

> You are the **coder** for Really Nicca.  
> Do not change the architecture. Follow the existing file structure and the architect’s plan.  
>  
> Follow:  
> - docs/PROJECT_SPEC.md  
> - docs/ORGANIZE_FEATURES.md  
>  
> Only modify or create the following files:  
> - `services/backend/src/features/organize/routes.ts`  
> - `services/backend/src/features/organize/controllers/extract.controller.ts`  
> - `services/backend/src/features/organize/services/graph-builder.service.ts`  
> - `services/backend/src/core/ml/python-client.service.ts`  
>  
> Rules:  
> - Use shared types from `packages/types/src/graph.ts` and `entity.ts`.  
> - Do NOT touch `gaps` or `memory` folders.  
> - Do NOT change folder structure.  
> - Add clear comments and docstrings.  
>  
> Task: Implement the `/api/organize/extract` endpoint end-to-end:  
> - Controller: validate request, call service.  
> - Service: call ML service (via python-client), map ML entities/relations → Graph.  
> - Return Graph JSON to the client.  
>  
> After writing the code, explain briefly how data flows between these pieces.

---

### 4.3 Reviewer/Security Prompt

**Use this to have AI review code it has just written.**

> You are a senior reviewer and security engineer.  
> I will show you some code from Really Nicca (Phase 1 – Organize).  
>  
> Project constraints:  
> - Folder structure must remain unchanged.  
> - Backend must use shared types from `packages/types`.  
> - Accuracy and safety are more important than shortcuts.  
>  
> Task:  
> 1. Check for logic bugs, type issues, or missing error handling.  
> 2. Check for security issues (unsanitized inputs, unsafe HTTP calls, etc.).  
> 3. Check that no new folders or files are invented outside the allowed list.  
> 4. Suggest minimal changes to fix issues.  
>  
> Return:  
> - A bullet list of problems.  
> - A diff-style or file-specific list of fixes.

Then follow up with a “Coder” prompt:

> Now act as the coder.  
> Apply only the fixes the reviewer suggested, in the same files.  
> Do not change architecture, types, or folder structure.

---

### 4.4 Frontend Prompt (Graph View)

> You are the frontend coder for Really Nicca (Phase 1).  
>  
> Follow:  
> - docs/PROJECT_SPEC.md  
> - docs/ORGANIZE_FEATURES.md  
>  
> Only modify/create:  
> - `services/frontend/src/features/organize/pages/OrganizePage.tsx`  
> - `services/frontend/src/features/organize/components/Graph/GraphVisualization.tsx`  
> - `services/frontend/src/features/organize/components/Graph/GraphControls.tsx`  
>  
> Graph JSON type: use `Graph`, `Entity`, `Relationship` from `packages/types/src`.  
> Assume backend exposes `/api/organize/graph/:id` returning this structure.  
>  
> Task:  
> - Render a simple graph using Cytoscape.  
> - Nodes: label, size by `degree` or `size` field, color by `community` if present.  
> - Edges: basic lines.  
> - Add a confidence slider in `GraphControls` to filter edges by `confidence`.  
>  
> Keep UI **simple and clean**.  
> Add comments explaining the main parts.

---

## 5. Things to Explicitly Tell the AI NOT To Do

Copy-paste these lines when needed:

- “Do NOT change the folder structure.”  
- “Do NOT add new services or modules without asking.”  
- “Do NOT touch `gaps` or `memory` folders yet; they are placeholders.”  
- “Do NOT introduce new external libraries unless you first propose them.”  
- “Do NOT invent new types – use the ones from `packages/types`.”  

---

## 6. Where to Store & Update Context

For you and the AI:

- **High-level rules & product:** `docs/PROJECT_SPEC.md`
- **Phase 1 behavior & features:** `docs/ORGANIZE_FEATURES.md`
- **Prompt techniques & patterns:** `docs/PROMPT_PLAYBOOK.md`
- **Change history:** `CHANGELOG.md`
- **Golden data / expectations:** `data/golden/*.json`

When you make a big change (feature added, design updated):

1. Update `PROJECT_SPEC.md` or `ORGANIZE_FEATURES.md` if behavior changed.
2. Add a brief line in `CHANGELOG.md`.
3. Start future prompts with:  
   > “Context: specs are up to date as of CHANGELOG entry X.”

---

## 7. Example “Full Context” Prompt Wrapper

You can wrap almost any coding task like this:

> Context: We are building Phase 1 (Organize) of Really Nicca, a knowledge graph engine.  
> Specs: Follow docs/PROJECT_SPEC.md and docs/ORGANIZE_FEATURES.md in this repo.  
> Folder layout: use the existing structure under `services/backend` / `services/ml-service` / `services/frontend`.  
> Phase constraints: Implement code only under `features/organize`. Do not modify `gaps` or `memory`.  
> Types: Use graph and entity types from `packages/types/src`.  
>  
> Task: [describe small, specific task here].  
> Files you may touch: [list files].  
> Rules: Do not change folder structure or add new libraries. Add comments to explain what you’re doing.

This keeps the AI grounded.

---
