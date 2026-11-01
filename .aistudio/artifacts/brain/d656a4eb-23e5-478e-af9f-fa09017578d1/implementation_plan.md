# Supabase Payment Column Reconciliation & Advance Fee Rule Plan

Standardize payment data across Supabase and the Admin 1 Console by synchronizing `total_fee`, `paid_amount`, and `pending_amount` according to the confirmed financial rules, while pinning the two advance-paying registrations to ₹500 paid with balance due.

## User Review & Critical Decisions

> [!IMPORTANT]
> All parameters have been aligned with your exact instructions:

- **Confirmed Decision 1**: `total_fee` will equal `original_amount` for all external registrations (with fallback to calculated event fee if `original_amount` is unset or NULL).
- **Confirmed Decision 2**: `paid_amount` equals `total_fee` (paid in full) for all participants EXCEPT:
  - `44749e06-4bd5-4630-b4d0-93bf2cd7bc60` (paid ₹500)
  - `acb227ae-fd43-4798-8827-0466e8830cd1` (paid ₹500)
- **Confirmed Decision 3**: Srinivasan Medical College & Hospital (SMCH) host students have `total_fee = 0`, `paid_amount = 0`, and `pending_amount = 0`.
- **Confirmed Decision 4**: `pending_amount` is calculated as `GREATEST(0, total_fee - paid_amount)` (yielding ₹0 for everyone, and `original_amount - 500` for the two advance entries).
- **Confirmed Decision 5**: Applied in both the Supabase SQL schema script and the Admin 1 Desk 1-click "Sync Payment Columns to Supabase" button.

---

### 1. Overview & Core Concept

- **What It Does**: Resolves discrepancies between Supabase columns and the admin interface by systematically backfilling and maintaining `total_fee`, `paid_amount`, `pending_amount`, and `payment_status`.
- **Target Audience**: Festival Central Admins, Event Incharges, and the Accounts Verification Desk auditing remittance figures.
- **Key Value**: Total collected revenue, individual student payment cards, export spreadsheets, and raw Supabase Table Editor rows will report identical, mathematically balanced numbers.

---

### 2. User Experience & Visual Design

- **Admin 1 Console Display**:
  - The two advance registrations (`44749e06-4bd5-4630-b4d0-93bf2cd7bc60` and `acb227ae-fd43-4798-8827-0466e8830cd1`) will clearly display:
    - **Paid**: `₹500`
    - **Total Fee**: `₹[original_amount]`
    - **Due (Pending)**: `₹[original_amount - 500]`
    - **Badge**: `Advance Paid` (Amber badge)
  - All other non-host registrations will show:
    - **Paid**: `₹[total_fee]`
    - **Total Fee**: `₹[total_fee]`
    - **Due**: `₹0`
    - **Badge**: `Paid in Full` or `Verified`
  - Srinivasan Medical College students will show `₹0 / ₹0 (Host Waived)`.
- **1-Click Sync & Modal**:
  - When clicking **"Sync Payment Columns to Supabase"**, a confirmation modal details how many records will be updated, verifies the two advance IDs, and pushes the changes directly to Supabase via PostgREST.
  - The **"Database Setup Guide"** modal provides the updated copy-paste SQL snippet.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Direct UUID Targeting vs. String Matching**:
  - *Chosen Approach*: Specifically match `id = '44749e06-4bd5-4630-b4d0-93bf2cd7bc60'` and `id = 'acb227ae-fd43-4798-8827-0466e8830cd1'` directly in both SQL queries and JavaScript sync loops.
  - *Why*: Eliminates any risk of accidentally misclassifying teams with similar names or multiple team members.
- **Decision 2: Synchronization Redundancy**:
  - *Chosen Approach*: Update both `supabase_schema.sql` (for SQL Editor execution) and `supabaseRegistrationService.ts` / `Admin1RegistrationsPage.tsx` (for client-side live sync and UI display).
  - *Why*: Guarantees that whether you run the SQL script in Supabase or click the Sync button in the web browser, both databases and browser caches stay completely aligned.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DATA RECONCILIATION FLOW                        │
└────────────────────────────────────────────────────────────────────────┘

  [Supabase Database: registrations]
       │
       ├──► Step 1: Set total_fee = COALESCE(original_amount, total_fee)
       │            (SMCH Host = 0)
       │
       ├──► Step 2: Set paid_amount:
       │            ├─ If ID in ('44749e06...', 'acb227ae...'): paid_amount = 500
       │            ├─ If is_host_college: paid_amount = 0
       │            └─ For all others: paid_amount = total_fee
       │
       ├──► Step 3: Set pending_amount:
       │            └─ GREATEST(0, total_fee - paid_amount)
       │
       └──► Step 4: Set payment_status:
                    ├─ 'Advance Paid' (for the two advance IDs)
                    └─ 'Paid in Full' (for all others)

                           ▲
                           │ Direct REST Sync or SQL Execution
                           │
       ┌───────────────────┴───────────────────────┐
       │   Celestia '26 Admin 1 Desk Operations   │
       │   - "Sync Payment Columns to Supabase"   │
       │   - Accounts Verification Sheet (CSV)    │
       │   - Total Collected Metric Card          │
       └───────────────────────────────────────────┘
```

#### File Implementation Scope:
1. `supabase_schema.sql`:
   - Incorporate the exact SQL update logic with UUID conditions for `44749e06-4bd5-4630-b4d0-93bf2cd7bc60` and `acb227ae-fd43-4798-8827-0466e8830cd1`.
2. `src/services/supabaseRegistrationService.ts`:
   - Update `syncAllRegistrationPaymentColumns` to apply this exact formula when pushing updates via the REST API.
3. `src/pages/Admin1RegistrationsPage.tsx`:
   - Update `sanitizeRegistration` and the SQL guide modal copy snippet so UI rendering matches Supabase 1:1.
