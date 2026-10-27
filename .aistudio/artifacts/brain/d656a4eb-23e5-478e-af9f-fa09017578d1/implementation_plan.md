# Implementation Plan: Events Page Reclassification, Combo Auto-Verification, Unified Incharge Entries & AI Assistant

Implement the new event classification on the Events Page (`ALL`, `SOLO`, `MINOR`, `MAJOR`, `DIGITAL`), configure Stellar Bid (IPL Auction) for both Solo and Duo/Minor categories, enable multi-event combo cascade verification by Admin, display unified incharge event entries with shared payment proof, sync participant dashboard statuses real-time, and embed the AI Combo Assistant on the Offers page.

---

## 1. User Requirements & Technical Scope

### A. Events Page Reclassification
- **Remove Old Categories**: Remove previous category filters (`Music`, `Dance`, `Fashion`, `Entertainment`, `Special Events`, `Digital & Media`).
- **Implement New Categories**:
  1. **ALL**: All 14 festival competitions.
  2. **SOLO**: Seraphia, Symphora, Nrityara, Eclipse, Cosmic Switch, Elaris, and **Stellar Bid (IPL Auction - 1 Person)**.
  3. **MINOR**: AdBlitz (Adzap), Twin Flare (Duo Dance), and **Stellar Bid (IPL Auction - 2 Persons Duo)**.
  4. **MAJOR**: Reflexia, Starfusion, Silhouette.
  5. **DIGITAL**: Mememania (Meme competition) & Cineverse (Movie recreation reel).
- **Stellar Bid (Mock IPL Auction)**:
  - Appears in both **SOLO** (single participant entry) and **MINOR** / Duo (2-participant team entry).

### B. Combo Multi-Event Auto-Verification by Admin
- When Admin verifies/approves a combo registration, **all events in that combo package are automatically verified and confirmed simultaneously** across Supabase and local state.
- Incharges of the individual events in that combo will immediately see their respective event entries as verified.

### C. Unified Single-Event Entries for Incharges with Shared Payment Proof
- Every combo event appears as an independent single-event entry under its corresponding event incharge table (e.g., Starfusion under Dance Incharges, Adzap under Entertainment Incharges, Seraphia under Music Incharges).
- Every single event entry shows the student/captain details, college, exact headcount (e.g., 7 or 10 participants for team entries), and the **same payment screenshot & UTR number**.

### D. Instant Participant Verification Status Sync
- In `ParticipantDashboard.tsx`, as soon as Admin clicks "Verify", the participant's competition cards immediately update to `Verified` / `Confirmed`, unlocking official passes and receipts without needing manual cache clearing.
- Combo registrations are automatically populated into the participant's dashboard upon completing checkout.

### E. Quick Filter Tabs in Admin & Incharges Portals
- Quick filter tabs (`All`, `Individual Only`, `Combo Offers`) with combo package badges and linked event count tags.

### F. AI Combo Recommendation Chatbot on Offer Page
- Interactive AI advisor on `ComboOffersPage.tsx` recommending packages based on group size, events, and budget, with a 1-click **"Enroll with this Combo"** button.

---

## 2. Proposed Architecture & Code Changes

### 1. Events Page Classification (`src/pages/EventsPage.tsx` & `src/data/festivalData.ts`)
- Replace the category filter tabs with:
  - `ALL`
  - `SOLO`
  - `MINOR`
  - `MAJOR`
  - `DIGITAL`
- Helper classification function:
  - If filter is `SOLO`: matches all events where `type === 'Solo'` PLUS `stellar-bid`.
  - If filter is `MINOR`: matches `adblitz`, `twin-flare`, and `stellar-bid`.
  - If filter is `MAJOR`: matches `reflexia`, `starfusion`, `silhouette`.
  - If filter is `DIGITAL`: matches `mememania`, `cineverse`.
- Update count badges on the filter buttons to reflect the exact number of events under each new tier.

### 2. Database & Service Layer (`src/types/registration.ts` & `src/services/supabaseRegistrationService.ts`)
- Add `comboGroupId?: string;` and `participantCount?: number;` to `RegistrationPayload` and `RegistrationSubmission`.
- In `submitRegistrationToSupabase`:
  - Persist `combo_group_id`, `combo_id`, `combo_name`, `combo_discount_amount`, and `participant_count: payload.participantCount || payload.participants?.length || 1`.
  - Save the same payment proof and UTR for each event entry.
- In `updateStatus`:
  - When verifying/approving a registration, query for all sibling registrations sharing the same `combo_group_id` (or matching `utr_number` + `combo_id`).
  - Update `payment_status: 'Verified'` and `registration_status: 'Confirmed'` for all linked registrations in the combo batch simultaneously.
- In `fetchAdminRegistrations`:
  - Include `combo_group_id`, `combo_id`, `combo_name`, `combo_type`, `combo_discount_amount`, `participant_count` in queries and mapping.

### 3. Combo Submission & Context Sync (`src/components/registration/ComboRegistrationWizard.tsx`)
- Assign a shared `comboGroupId` across all event payloads in a combo checkout.
- Pass accurate `participantCount` (e.g. `fashionRoyaleSilhouetteCount` for Silhouette, or `formData.totalParticipants` for team events).
- Dispatch created registrations into `RegistrationContext` (`myRegistrations`) and `localStorage` so they appear immediately in the participant dashboard.

### 4. Real-Time Participant Dashboard Sync (`src/context/RegistrationContext.tsx`)
- Add an active sync function that queries Supabase for the current user's registrations periodically and on dashboard mount.
- Updates local statuses to `Verified` / `Confirmed` in real-time when the Admin verifies them.

### 5. Incharges & Admin Portals Viewing & Filtering (`src/pages/InchargesPortalPage.tsx`, `Admin1RegistrationsPage.tsx`, `AdminDashboardPage.tsx`)
- Add `regTypeFilter: 'all' | 'individual' | 'combo'` segmented filter tabs.
- Display combo badges on registrations.
- Render the shared payment screenshot thumbnail and preview modal for all single entries in the combo.
- Display exact headcount (`reg.participantCount || reg.participants?.length || 1`).

### 6. AI Combo Chatbot on Offers Page (`src/components/combos/ComboChatAssistant.tsx` & `src/pages/ComboOffersPage.tsx`)
- Interactive assistant providing tailored recommendations based on group size and interest, with direct one-click selection to launch the combo registration wizard.

---

## 3. Verification & Testing Plan

1. **Compilation & Linting**:
   - Run `compile_applet` and `lint_applet` to confirm zero errors.
2. **Events Page Tabs & Stellar Bid Test**:
   - Verify `EventsPage.tsx` shows only `ALL`, `SOLO`, `MINOR`, `MAJOR`, `DIGITAL`.
   - Verify `SOLO` shows Stellar Bid (IPL Auction).
   - Verify `MINOR` shows Stellar Bid, AdBlitz, and Twin Flare.
   - Verify `MAJOR` shows Reflexia, Starfusion, and Silhouette.
   - Verify `DIGITAL` shows Mememania and Cineverse.
3. **Combo Multi-Event Cascade Verification**:
   - Register a combo. In Admin console, click "Verify" on one event entry.
   - Confirm all events in that combo update to `Verified` / `Confirmed` across all incharges.
4. **Incharge Single-Entry View & Payment Proof**:
   - Confirm each event appears in its respective incharge portal with the shared payment screenshot viewable.
5. **Participant Real-Time Status**:
   - Confirm the participant dashboard immediately shows `Verified` status and unlocked receipt.
6. **AI Chatbot**:
   - Test interaction and combo pre-selection on `ComboOffersPage.tsx`.
