# Advance Payment & Pending Amount Management System — Celestia’26

Implementation plan for recording, updating, and displaying advance payments and pending balance amounts across the Celestia’26 registration platform, admin portals, participant passes, registered events views, and event in-charge dashboard.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following key decisions were confirmed during Phase 1 interactive alignment and will govern the database schema, status calculation, and UI presentation:

- **Confirmed Decision 1 (Schema)**: Payment tracking columns (`paid_amount`, `pending_amount`, `payment_notes`, and `payment_status`) will be stored directly on the `registrations` table in Supabase for high-performance direct querying and real-time synchronization.
- **Confirmed Decision 2 (Status Automation)**: `payment_status` will calculate automatically (`Pending`, `Advance Paid`, `Paid in Full`) based on `total_amount - paid_amount` without manual status overrides.
- **Confirmed Decision 3 (UI Presentation)**: Outstanding balances will be highlighted with clear amber badges and filterable tabs (`All`, `Pending`, `Advance Paid`, `Paid in Full`) in both Admin and In-Charge portals.

---

## 1. Overview & Core Concept

### What It Does
Provides a full-stack advance payment management workflow for Celestia’26. Admins can record partial or full payments received for any individual event, team, combo, or custom registration. The system automatically calculates the pending balance (`Total Fee - Amount Paid`), updates the payment status (`Pending`, `Advance Paid`, `Paid in Full`), and synchronizes this across:
1. Main Admin Portals (`/admin` and `/admin1`) with a dedicated Payment Details editing modal/drawer and aggregate financial metrics.
2. Participant Registration Pass (both web modal and PNG/PDF exportable image canvas).
3. Participant's Registered Events Page (`MyRegistrationsModal`).
4. Event In-Charge Portal (`/incharges`) with real-time payment status tabs, filtering, search, and balance readouts.

### Target Audience & Persona
- **Main Admins**: Record payment increments, add payment reference notes, and audit total collected vs. outstanding event revenue.
- **Event In-Charges**: Check team check-ins at event desks and immediately spot teams with unpaid balances.
- **Participants**: View transparent receipts showing total fee, advance paid, and balance due prior to stage call.

---

## 2. User Experience & Visual Design

### Key User Flows

```
  ┌─────────────────────────────────────────────────────────┐
  │                 Admin Dashboard (/admin)                │
  │  - Overview metrics: Outstanding, Paid in Full, Advance  │
  │  - Filter registrations by: Pending | Advance | Full    │
  │  - Click "Update Payment Details" on any registration   │
  └────────────────────────────┬────────────────────────────┘
                               │ (Edits Paid Amount & Notes)
                               ▼
  ┌─────────────────────────────────────────────────────────┐
  │         Supabase / Database State Update                │
  │  - total_amount (Authoritative)                        │
  │  - paid_amount (Updated)                               │
  │  - pending_amount = total_amount - paid_amount         │
  │  - payment_status = Pending | Advance Paid | Paid In Full│
  └────────────────────────────┬────────────────────────────┘
                               │ (Syncs Real-Time)
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
┌───────────────┐     ┌──────────────────┐   ┌──────────────────┐
│  Participant  │     │  Participant's   │   │ Event In-Charge  │
│Reg. Pass (PNG)│     │My Registrations  │   │ Dashboard        │
│               │     │                  │   │                  │
│ Total: ₹3,000 │     │ Total: ₹3,000    │   │ Team Alpha       │
│ Paid:  ₹1,000 │     │ Paid:  ₹1,000    │   │ Paid: ₹1,000     │
│ Due:   ₹2,000 │     │ Due:   ₹2,000    │   │ Due:  ₹2,000     │
│ ADVANCE PAID  │     │ ADVANCE PAID     │   │ [ADVANCE PAID]   │
└───────────────┘     └──────────────────┘   └──────────────────┘
```

### Visual Identity & Theme
- **Color Tokens**:
  - `Paid in Full`: Emerald status badge (`bg-emerald-500/10 text-emerald-400 border-emerald-500/20`).
  - `Advance Paid`: Amber status badge (`bg-amber-500/10 text-amber-400 border-amber-500/20`).
  - `Pending`: Slate/Rose status badge (`bg-rose-500/10 text-rose-400 border-rose-500/20`).
- **Typography & Formatting**: Standardized tabular numerals (`font-mono tabular-nums`) for currency amounts (`₹3,000`).
- **Combos Protection**: Combo registrations display the single overall combo fee and paid balance on the primary combo header, preventing fee replication on individual sub-events.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Single Database Field Schema Integration
- **Chosen Approach**: Add `paid_amount`, `pending_amount`, `payment_notes`, and `payment_status` directly to `registrations` table in Supabase (with backward-compatible client fallbacks).
- **Why**: Ensures 100% compatibility with existing queries, avoids complex joins, and supports high-speed RLS policy checks for both Admin and In-Charge desks.

### Decision 2: Automatic Status Assignment Formula
- **Chosen Approach**:
  - If `paid_amount <= 0` or undefined ➔ `Pending`
  - If `0 < paid_amount < total_amount` ➔ `Advance Paid`
  - If `paid_amount >= total_amount` ➔ `Paid in Full`
- **Why**: Eliminates manual status discrepancy errors while maintaining deterministic UI state.

### Decision 3: Combo Balance Non-Duplication Logic
- **Chosen Approach**: Flag registrations with `comboGroupId`. When calculating overall event or dashboard totals, group by `comboGroupId` (or count unique `comboGroupId` once) so combo fees are never multiplied across included events.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Celestia'26 React SPA                                 │
├───────────────────────┬───────────────────────┬─────────────────────────────────┤
│ Admin Portals         │ In-Charge Dashboard   │ Participant Views               │
│ - AdminDashboardPage  │ - InchargesPortalPage │ - RegistrationPass              │
│ - Admin1Registrations │ - Event filter        │ - MyRegistrationsModal          │
│ - Payment Edit Modal  │ - Status tabs & search│ - Canvas PNG Exporter           │
└───────────┬───────────┴───────────┬───────────┴────────────────┬────────────────┘
            │                       │                            │
            ▼                       ▼                            ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                  supabaseRegistrationService.ts (API Gateway)                   │
│ - updateRegistrationPaymentDetails(id, paidAmount, notes)                        │
│ - fetchRegistrationsWithPaymentStatus()                                         │
└───────────────────────────────────┬─────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Supabase Database                                     │
│ - Table: `registrations`                                                       │
│   - paid_amount (numeric default 0)                                             │
│   - pending_amount (numeric default total_amount)                               │
│   - payment_status ('Pending' | 'Advance Paid' | 'Paid in Full')                │
│   - payment_notes (text)                                                        │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Database Migration SQL (To be provided in report):
```sql
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS paid_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS pending_amount NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Pending',
ADD COLUMN IF NOT EXISTS payment_notes TEXT DEFAULT NULL;

-- Backfill existing verified registrations
UPDATE registrations 
SET 
  paid_amount = COALESCE(total_amount, 0),
  pending_amount = 0,
  payment_status = 'Paid in Full'
WHERE (payment_confirmed = true OR payment_status = 'Verified') 
  AND (paid_amount IS NULL OR paid_amount = 0);
```

### Component & State Mapping

1. **`src/types/registration.ts`**:
   - Update `RegistrationSubmission` interface with `paidAmount?: number`, `pendingAmount?: number`, `paymentNotes?: string`, and expanded `paymentStatus` options (`'Pending' | 'Submitted' | 'Verified' | 'Rejected' | 'Advance Paid' | 'Paid in Full'`).

2. **`src/services/supabaseRegistrationService.ts`**:
   - Add `updatePaymentDetails(id: string, paidAmount: number, notes?: string)` method to update Supabase row atomically.
   - Update mapping helpers to parse `paid_amount`, `pending_amount`, `payment_notes`, and `payment_status` from database responses.

3. **`src/pages/AdminDashboardPage.tsx` & `Admin1RegistrationsPage.tsx`**:
   - Add summary metrics card (Total Outstanding, Advance Paid Count, Paid in Full Count, Pending Count).
   - Add Payment Details modal/card with input fields for Amount Paid and Notes, auto-calculating Pending Amount.

4. **`src/components/RegistrationPass.tsx`**:
   - Update UI card and HTML canvas renderer (`html2canvas`) to display Payment Summary (Total Fee, Amount Paid, Balance Due, Payment Status badge).

5. **`src/pages/RegisteredEventsPage.tsx` / `MyRegistrationsModal.tsx`**:
   - Render Payment Summary card for each individual event and combo group.

6. **`src/pages/InchargesPortalPage.tsx`**:
   - Add filter tabs (`All`, `Pending`, `Advance Paid`, `Paid in Full`).
   - Add table columns showing Paid, Pending, and Status badge.
