# Planning Engine Compliance Audit

## Scope
This audit maps the current codebase status against:
- `doc/requirment.md`
- `doc/planning-engine-prd.md`

Status legend:
- `PASS`: implemented and verified
- `PARTIAL`: implemented but incomplete/needs hardening
- `FAIL`: not implemented yet

---

## 1) Dataset Contract & Canonical Reference

| Requirement | Source | Status | Evidence | Gap |
| --- | --- | --- | --- | --- |
| Canonical Mushaf dataset with page-aware references | requirement + PRD §7.1, §12 | PASS | `src/infrastructure/dataset/generators/dataset-generator.ts`, `src/data/CanonicalQuranData.ts` | Implemented as deterministic canonical artifact generated from Hafs v18 with boundary metadata and directional indices. |
| Per-ayah `lineStart`, `lineEnd`, `linesCount`, `isPageEnd`, `isSurahEnd` | PRD §7.1 | PASS | Generator emits canonical and legacy-compatible fields; contract aligned in `src/domain/mushaf/entities/QuranAyahReference.ts` | No critical gap for Phase 1. |
| Thematic metadata (`QUARTER/HIZB/JUZ/NONE`) | requirement + PRD §7.1 | PARTIAL | Typed thematic field added (`thematicBreakType` / `thematic_break_type`) with current values `QUARTER` / `SAJDAH` / `NONE` | `HIZB` and `JUZ` extraction logic is still not implemented from source markers. |
| Forward/reverse index generation + cumulative arrays | PRD §7.1, §12.2 | PASS | `INDEX_MAP_FORWARD/REVERSE`, `RAW_CUMULATIVE_ARRAY_*`, `REVERSE_INDEX_*` in `src/data/CanonicalQuranData.ts` | None critical. |

---

## 2) Rule Pipeline (Stopping Logic)

| Requirement | Source | Status | Evidence | Gap |
| --- | --- | --- | --- | --- |
| Pipeline structure (`advanceByLines -> snapToAyahBoundary -> surah/page/thematic/balance`) | requirement + PRD §7.3, §10 | PARTIAL | `src/domain/planning/rules/RuleEngine.ts` and handlers under `src/domain/planning/rules/handlers/` | Rule engine exists, but not fully closed against all PRD invariants and traceability requirements for every step. |
| Ayah integrity (never cut ayah) | requirement + PRD §7.3 | PARTIAL | Rule handlers and tests exist in planning domain tests | Needs complete invariant suite proving all direction/edge cases. |
| Surah snap threshold behavior | requirement + PRD §7.3 | PARTIAL | `src/domain/planning/rules/handlers/SurahSnapRule.ts` | Threshold behavior exists but needs full production-grade validation matrix and config-driven policy. |
| Page alignment threshold behavior | requirement + PRD §7.3 | PARTIAL | `src/domain/planning/rules/handlers/PageAlignmentRule.ts` | Current implementation still includes approximation warnings and requires hardening with finalized canonical semantics. |
| Thematic halting preference | requirement + PRD §7.3 | PARTIAL | Thematic marker info exists in dataset | No robust typed thematic stopping rule layer at full PRD level yet. |

---

## 3) Multi-Track Scheduling & Balancing

| Requirement | Source | Status | Evidence | Gap |
| --- | --- | --- | --- | --- |
| Multi-track deterministic scheduling | requirement + PRD §7.5 | PARTIAL | Track manager + planning tests in `src/tests/domain/planning/` | Determinism is present in parts, but not all product behaviors are encoded and validated end-to-end. |
| Load balancing by configurable weights | PRD §7.6 | PARTIAL | `src/domain/planning/services/LoadBalancerService.ts` | Present, but needs wider policy/config integration and full scenario coverage. |
| Catch-up/off-day behavior | PRD §7.7 | PARTIAL | Catch-up suppression logic in load balancer | Needs complete scheduling integration (holidays + full pipeline interactions). |

---

## 4) Validation & QA

| Requirement | Source | Status | Evidence | Gap |
| --- | --- | --- | --- | --- |
| Dataset validation automated checks | requirement §4 + PRD §12.3, §14 | PARTIAL | `src/tests/domain/mushaf/dataset-validation.test.ts` passes continuity/page/symmetry checks | Missing broader strict checks (typed thematic boundary validity, page-line normalization policy checks, richer invariants). |
| Rule-level tests and directional symmetry tests | PRD §14 | PARTIAL | Tests exist in `src/tests/domain/planning/` | Need expanded coverage for all edge thresholds and all stop-rule interactions. |
| Structured test framework migration | PRD §14.3 | FAIL | Current scripts rely on `ts-node` | No standard test runner migration (`vitest`/`jest`) yet. |

---

## 5) API/Persistence/Export Readiness

| Requirement | Source | Status | Evidence | Gap |
| --- | --- | --- | --- | --- |
| API contracts for preview/generate/estimate/export/dataset validate | PRD §13 + API contracts doc | PARTIAL | `src/infrastructure/api/contracts.ts`, `doc/planning-engine-api-contracts.md` | DTOs exist but still differ from final contract shape and not wired to NestJS endpoints. |
| Prisma-oriented persistence model draft | PRD §13 + Prisma draft doc | PASS (Draft) | `doc/planning-engine-prisma-schema-draft.md` | Draft exists; implementation not started. |
| Export layer modernization (Excel + PDF adapters) | PRD §7.8, §15 | PARTIAL | Existing export capability present in repo | Not fully refactored into final adapter architecture with complete PDF flow guarantees. |

---

## Overall Verdict

Current code **does not yet fully meet all requirements** in `doc/requirment.md` and `doc/planning-engine-prd.md`.

Implementation appears to be at:
- **Phase 1 (Canonical Data Foundation):** substantially complete; remaining work is stricter thematic/page validation hardening
- **Phase 2+ (Rules, scheduling maturity, exports, API/persistence integration):** partially complete

---

## Priority Next Steps (P0 -> P2)

1. **Complete thematic granularity**
   - Extend extraction to cover `HIZB` and `JUZ` classification in addition to current `QUARTER` / `SAJDAH` / `NONE`.

2. **Close validation gaps**
   - Add strict typed thematic-boundary validity checks.
   - Add full deterministic integrity checks beyond continuity/page/symmetry.

3. **Harden rule pipeline**
   - Complete rule-order invariants and edge-case tests (forward + reverse).
   - Ensure page/surah/thematic snapping are purely canonical-data driven.

4. **Align API contract implementation**
   - Converge `src/infrastructure/api/contracts.ts` with `doc/planning-engine-api-contracts.md`.

5. **Adopt structured test framework**
   - Migrate from ad-hoc script execution to `vitest` or `jest` as PRD recommends.
