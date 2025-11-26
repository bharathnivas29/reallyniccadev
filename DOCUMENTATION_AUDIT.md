# DOCUMENT INVENTORY & RESTRUCTURING PLAN

## A) DOCUMENT INVENTORY

| Filepath | Status | Reason | Action |
|----------|--------|--------|--------|
| `README.md` | **UPDATE** | Outdated (mentions Phase 1, missing frontend info) | Rewrite with current reality |
| `CHANGELOG.md` | **KEEP** | Recently updated, accurate | Minor refinement |
| `TASKS.md` | **UPDATE** | Massive (764 lines), mix of done/todo | Simplify to current status |
| `ROUTES.md` (root) | **MERGE** | Duplicate of `docs/ROUTES.md` | Delete, keep docs version |
| `1.GraphOrg-featurelist.md` | **ARCHIVE** | Old planning doc | Move to archive |
| `docs/PROJECT_SPEC.md` | **UPDATE** | Says "Phase 1", but we're in Phase 2 | Update phase info |
| `docs/ARCHITECTURE.md` | **UPDATE** | Accurate but verbose (1353 lines) | Condense, add frontend |
| `docs/API.md` | **UPDATE** | Missing upload endpoint | Add all 4 backend endpoints |
| `docs/ROUTES.md` | **UPDATE** | Duplicate info, needs consolidation | Merge with API.md |
| `docs/ALGORITHMS.md` | **KEEP + REFINE** | Good technical detail | Minor updates |
| `docs/CODE_CONSISTENCY.md` | **KEEP** | Just created, accurate | No changes |
| `docs/CONTRIBUTING.md` | **KEEP** | Just created, accurate | No changes |
| `docs/DEPENDENCIES.md` | **KEEP + REFINE** | Useful reference | Verify versions |
| `docs/DEPLOYMENT.md` | **EMPTY** | Not implemented | Delete or populate |
| `docs/Development_Framework.md` | **KEEP + REFINE** | Good workflow guide | Minor updates |
| `docs/ERRORS.md` | **ARCHIVE** | Debugging log, not documentation | Move to archive |
| `docs/IMPLEMENTATION_PLAN.md` | **ARCHIVE** | Historical planning | Move to archive |
| `docs/ORGANIZE_FEATURES.md` | **KEEP** | Feature spec (user requested) | No changes |
| `docs/PHASE_1_2_SUMMARY.md` | **ARCHIVE** | Historical summary | Move to archive |
| `docs/PROMPT_PLAYBOOK.md` | **ARCHIVE** | AI agent instructions | Move to archive |
| `docs/TESTING_PROTOCOL.md` | **KEEP + REFINE** | Useful testing guide | Update with current tests |

## B) NEW DOC STRUCTURE

```
/
├── README.md                    # Project overview, quick start, setup
├── CHANGELOG.md                 # Version history (keep as-is)
└── TASKS.md                     # Simplified current status

/docs/
├── ARCHITECTURE.md              # System design, services, data flow
├── API.md                       # All endpoints (backend + ML service)
├── DEVELOPMENT.md               # Coding standards, workflows, testing
├── ALGORITHMS.md                # Core algorithms (entity extraction, dedup, etc.)
├── DEPENDENCIES.md              # Tech stack and versions
├── ORGANIZE_FEATURES.md         # Feature specifications (keep as requested)
├── CODE_CONSISTENCY.md          # Logging, linting, type safety (keep)
├── CONTRIBUTING.md              # Contribution guidelines (keep)
└── /archive/                    # Historical docs
    ├── ERRORS.md
    ├── IMPLEMENTATION_PLAN.md
    ├── PHASE_1_2_SUMMARY.md
    ├── PROMPT_PLAYBOOK.md
    └── 1.GraphOrg-featurelist.md
```

**Rationale**:
- **9 core docs** (down from 16+)
- Clear separation: Overview (README) → Architecture → API → Development
- Archive preserves history without cluttering main docs
- Keeps user-requested ORGANIZE_FEATURES.md
- Merges duplicate content (ROUTES.md → API.md)

## C) KEY UPDATES NEEDED

### 1. README.md
**Current Issues**:
- Says "Phase 1" but we're in Phase 2
- Missing frontend information
- Outdated feature list

**New Content**:
- Accurate phase description (Phase 2: UI + Productization)
- Full tech stack including frontend
- Actual features (file upload, visualization, graph export)
- Correct setup instructions

### 2. ARCHITECTURE.md
**Current Issues**:
- 1353 lines (too verbose)
- Missing frontend architecture
- Focuses only on Phase 1

**New Content**:
- Condensed to ~500 lines
- Add frontend service architecture
- Update data flow to include UI
- Current implementation reality

### 3. API.md
**Current Issues**:
- Missing `/upload` endpoint
- Incomplete examples

**New Content**:
- All 4 backend endpoints with examples
- ML service `/extract` endpoint
- Request/response schemas
- Error codes

### 4. TASKS.md
**Current Issues**:
- 764 lines of mixed status
- Hard to see current state

**New Content**:
- Simplified to current phase
- Clear "Done" vs "In Progress" vs "Todo"
- Remove completed Phase 1 details

## D) ARCHIVE CANDIDATES

Move to `/docs/archive/`:
1. `ERRORS.md` - Debugging log
2. `IMPLEMENTATION_PLAN.md` - Historical planning
3. `PHASE_1_2_SUMMARY.md` - Historical summary
4. `PROMPT_PLAYBOOK.md` - AI instructions
5. `1.GraphOrg-featurelist.md` - Old planning

## E) VERIFICATION CHECKLIST

### Manual Verification Needed:
- [ ] Verify all backend endpoints work as documented
- [ ] Test file upload with PDF/DOCX/TXT
- [ ] Confirm export functionality status
- [ ] Check if Neo4j is actually used or just JSON storage
- [ ] Verify frontend routing and pages

### Questions Where Code Isn't Clear:
- Is the export controller (`export.controller.ts`) fully implemented?
- Are there any hidden API endpoints not in routes?
- What's the actual deployment strategy?
- Is DEPLOYMENT.md intentionally empty or should it be populated?

### Areas Lacking Documentation:
- Frontend architecture and component structure
- Graph visualization controls and interactions
- Manual editing features (if implemented)
- Testing strategy for frontend
- Environment variable documentation

## NEXT STEPS

1. Create `/docs/archive/` directory
2. Move archive candidates
3. Rewrite README.md with current reality
4. Condense ARCHITECTURE.md and add frontend
5. Consolidate API documentation
6. Simplify TASKS.md
7. Delete duplicate ROUTES.md from root
