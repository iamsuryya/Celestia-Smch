# Real-Time Promo Code Table Synchronization

Implement full real-time database listener and event broadcasting for the promo codes table (`celestia_promo_codes`) across the Admin Dashboard and Registration checkout flows, guaranteeing instant cross-device updates when codes are created, toggled, or deleted.

## User Review & Critical Decisions

> [!IMPORTANT]
> The real-time listener will run on both the Admin Dashboard table and the participant Registration Payment page.

- **Confirmed Decision 1**: Enable dual-layer real-time sync (Supabase Postgres Realtime subscription + Local BroadcastChannel / Event Dispatcher + 3s fallback poller) so changes appear instantly on all screens.
- **Confirmed Decision 2**: Ensure changes immediately refresh the Admin Dashboard table statistics and auto-validate any active participant checkout sessions in real time.

---

## 1. Overview & Core Concept

- **What It Does**: Establishes a live event pipeline on the `celestia_promo_codes` table. Any addition, status toggle (active/inactive), or deletion performed by an Admin instantly broadcasts to all connected clients.
- **Target Audience**: Festival Administrators managing promo campaigns and Collegiate Delegates completing event registration payments.
- **Key Value**: Prevents out-of-date discount applications and provides instant visual feedback to Admins when promo codes are added or deactivated across multiple devices or admin accounts.

---

## 2. User Experience & Visual Design

- **Admin Dashboard Table Flow**:
  - Admin creates, deactivates, or deletes a promo code in the Admin Portal.
  - The Promo Codes table and top KPI cards (Total Codes, Active Offers, Total Discounted Registrations) re-render immediately without manual page refresh.
  - Live indicator badge shows real-time status (`● Realtime Sync Active`).

- **Registration Checkout Payment Flow**:
  - If a participant has applied a code that is subsequently deactivated or deleted by an Admin, the payment breakdown updates instantly, alerts the user, and adjusts the total payable amount.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Supabase Realtime Channel + Event Broadcast Hybrid**
  - *Chosen Approach*: Combine `supabase.channel('celestia_promo_codes')` with local `CustomEvent('celestia-promocodes-changed')` and a 3-second poller fallback.
  - *Why*: Guarantees instant reactivity across multi-device database writes as well as offline/local storage usage.

- **Decision 2: Automatic Re-Validation on State Push**
  - *Chosen Approach*: When a promo code change payload arrives, active checkouts automatically re-validate `appliedPromoCode` against the latest dataset.
  - *Why*: Ensures strict single-code enforcement and zero discount leakage for deactivated codes.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                 Supabase Postgres Realtime                      │
│                  ('celestia_promo_codes')                       │
└────────────────┬────────────────────────────────────────────────┘
                                 │
                     postgres_changes (* event)
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     promoCodeService                            │
│  - Refetches updated codes                                      │
│  - Dispatches 'celestia-promocodes-changed' CustomEvent          │
└────────────────┬────────────────────────────────┬───────────────┘
                 │                                │
                 ▼                                ▼
┌───────────────────────────────┐  ┌───────────────────────────────┐
│     AdminDashboardPage        │  │     RegistrationContext       │
│ - Live table row updates      │  │ - Applied promo code sync     │
│ - Stats recalculation         │  │ - Instant checkout fee recalculation
└───────────────────────────────┘  └───────────────────────────────┘
```

### Data Pipeline & Event Lifecycle:
1. `promoCodeService.subscribeToRealtimePromos(callback)` initializes a Supabase channel listener on `celestia_promo_codes`.
2. When an INSERT, UPDATE, or DELETE occurs, the callback triggers `getPromoCodes()` and dispatches `celestia-promocodes-changed`.
3. `AdminDashboardPage` and `RegistrationContext` listen to the custom event and update local component state smoothly.
