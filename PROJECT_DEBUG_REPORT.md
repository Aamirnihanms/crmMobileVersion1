# CRM Mobile App Debug Audit

Date: 2026-04-11
Scope: full static audit of `src/`, API/query layer trace, and lint/type checks.

## Overall Rating

**5.9 / 10**

- Good: clear API/query separation, React Query usage is mostly structured, TypeScript compiles (`npx tsc --noEmit` passes).
- Risky: several incorrect/high-noise API call patterns, one hook-order runtime bug, and unresolved endpoint assumptions.
- Code health: `npm run lint` reports **5 errors** and **38 warnings**.

---

## Infinite API Call Check

No hard infinite loop was found in static analysis.

However, there are **API call amplification patterns** that can feel like infinite traffic in production (especially chat + unread count flows):

1. duplicate dashboard fetching for superadmin mode,
2. repeated unread-count invalidations/refetches on focus and on each message event,
3. hidden modal queries firing while modal is closed,
4. unguarded batch query execution without required params.

---

## Major Findings

### 1) Conditional Hook Invocation (Runtime correctness bug) — **Critical**
- **File:** `src/components/students/StudentEnrollmentsSection.tsx:13-18`
- **Issue:** Early return happens before `useNavigation()`, so hook call order changes between renders.
- **Impact:** Can cause runtime hook-order crashes/undefined behavior.

### 2) Incorrect Receipt Endpoint Path — **High**
- **File:** `src/api/payments.api.ts:138`
- **Issue:** `http.get(\`receipt/${transactionId}/\`)` is missing a leading `/`.
- **Impact:** Can generate wrong URL resolution under axios `baseURL` and fail receipt downloads.

### 3) Unverified/Guessed Installment Edit Endpoint — **High**
- **File:** `src/api/enrollment.api.ts:153-155`
- **Issue:** Endpoint is explicitly marked as assumed (`"Assuming the endpoint..."`).
- **Impact:** High chance of 404/405/contract drift in production.

### 4) Dashboard Double Fetch for Superadmin — **High**
- **File:** `src/screens/dashboard/DashboardScreen.tsx:718-719`
- **Issue:** `useSuperadminDashboard(...)` and `useMyDashboard(..., true)` both run when superadmin is logged in.
- **Impact:** Unnecessary duplicate dashboard API calls on mount/timeframe change.

### 5) Unread Count API Storm Pattern — **High**
- **Files:**
  - `src/navigation/DashboardStack.tsx:88,101-106`
  - `src/screens/chat/MessagesListScreen.tsx:551-558,969-973`
  - `src/screens/chat/ChatThreadScreen.tsx:1335-1340`
  - `App.tsx:317-323`
- **Issue:** Unread count is invalidated/refetched in multiple places (focus, foreground notifications, WS messages, read acknowledgements).
- **Impact:** Excessive `/chats/unread-count/` traffic and battery/network overhead under active chat load.

### 6) Hidden Modal Still Triggers Master/Batch Queries — **High**
- **Files:**
  - `src/components/leads/modals/ConvertLeadModal.tsx:44-46`
  - `src/screens/leads/LeadDetailsScreen.tsx:138-143`
- **Issue:** `ConvertLeadModal` is rendered even when hidden, and it runs `useCourses()` + `useBatches(...)` hooks continuously.
- **Impact:** Background API calls even when user never opens conversion modal.

### 7) Batch Query Lacks Guard for Required Param — **Medium**
- **File:** `src/queries/masters/batches.query.ts:4-8`
- **Issue:** `useBatches(courseId?)` has no `enabled: !!courseId` gate.
- **Impact:** Calls `/batch/` with undefined course context; unnecessary and potentially incorrect dataset.

### 8) Chat Cache Key Mismatch — **Medium**
- **Files:**
  - `src/queries/chat.query.ts:158` (key: `['chat-messages', chatUid, pageSize]`)
  - `src/screens/chat/ChatThreadScreen.tsx:1077` (set key: `['chat-messages', chatId]`)
- **Issue:** `setQueryData` writes to a different key than query subscription.
- **Impact:** Cache updates may not hit active query state; leads to stale data and extra refetch pressure.

### 9) Follow-up Importance Contract Inconsistency — **Medium**
- **Files:**
  - `src/api/followups.api.ts:72` (create uses `IMPORTANT|NORMAL|URGENT`)
  - `src/api/followups.api.ts:110` (update uses `LOW|NORMAL|HIGH|URGENT`)
  - `src/components/followups/AddFollowUpModal.tsx:19,138`
- **Issue:** Create/update enums are inconsistent.
- **Impact:** Potential API validation failures or semantic mismatch across create vs update flow.

### 10) Lint Health Blocking Issues — **Medium**
- **Command:** `npm run lint`
- **Result:** 5 errors, 38 warnings.
- **Notable blockers:**
  - Hook rule violation: `src/components/students/StudentEnrollmentsSection.tsx:16`
  - Unescaped entities causing build/lint failure in UI text:
    - `src/components/global/NoNetworkScreen.tsx:71`
    - `src/screens/leads/LeadsListScreen.tsx:164`

---

## Recommended Fix Order

1. Fix hook-order bug in `StudentEnrollmentsSection`.
2. Fix `fetchReceipt` path and verify enrollment installment edit endpoint.
3. Remove duplicate dashboard query execution for superadmin.
4. Consolidate unread-count refresh strategy (single source of truth + throttling/debounce).
5. Gate hidden/optional queries (`enabled`) for conversion/batch lookups.
6. Align chat cache keys and follow-up enum contracts.

---

## Validation Commands Run

- `npm run lint` (fails: 5 errors, 38 warnings)
- `npx tsc --noEmit` (passes)

