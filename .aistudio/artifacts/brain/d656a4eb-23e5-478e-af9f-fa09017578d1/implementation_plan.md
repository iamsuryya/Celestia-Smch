# Celestia'26 Event Day Registration & Check-In System

A unified, high-speed event-day operational suite for Celestia'26 festival grounds. Enables venue volunteers to quickly check in pre-registered online attendees, append arriving team members, track individual attendance and ID card distribution, and process on-spot team and individual registrations with live integration into the Event Incharge Dashboard.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions incorporate your confirmed preferences and requested ease-of-use additions:
> 
> - **Two Dedicated Pages & Portals**: Dedicated `/regdesk` (Registration Desk) and `/onspot` (On-Spot Registration) dashboards with role-based credentials managed by Central Admin.
> - **Added Ease-of-Use Enhancements (Fast-Queue Optimizations)**:
>   1. **1-Tap "Check In All Present" Button**: Single-click button on team profiles to mark all arriving members as Present & Issue Badges instantly during rush hours.
>   2. **Fast QR & Camera Search**: Live QR / Registration ID scanner capability to lookup tickets without typing.
>   3. **Live Counter Bar**: Real-time venue counters showing total checked-in, pending badges, and on-spot registrations processed today.
>   4. **Offline Resilience Queue**: LocalStorage caching so volunteers can continue operating smoothly even during temporary spotty Wi-Fi on festival grounds.
> - **Venue Payment & UTR Entry**: Canonical event fees displayed (non-editable); volunteers enter student UTR numbers after manual student payment.
> - **Zero-Data-Silo Incharge Integration**: All on-spot entries and newly added team members directly update the core database. The Event Incharges portal updates in real time with an `ONLINE` or `ON_SPOT` source badge.

---

## 1. Overview & Core Concept

- **What It Does**: Provides fast, mobile-optimized tools for venue volunteers during peak registration rush on festival mornings:
  1. **Registration Desk (`REGISTRATION_DESK`)**: Multi-parameter search (ID, Captain Name, Phone, College, QR Scan), on-the-fly addition of arriving team members up to event limits, per-person attendance (`NOT ARRIVED` vs `PRESENT`), 1-tap bulk check-in, and independent ID card issuance tracking.
  2. **On-Spot Desk (`ON_SPOT_REGISTRATION`)**: Rapid registration for newly arriving teams and solo participants with duplicate pre-checks, non-editable official event fee locking, volunteer UTR entry, rules acceptance, instant ID card generation, and immediate check-in.
  3. **Event Incharge Live Sync**: Real-time visibility of online and on-spot registrations in the Incharges Portal, with team member rosters, attendance indicators, and badge counts.
- **Target Audience**: Student desk volunteers, event coordinators, stage managers, and festival administrators.

---

## 2. User Experience & Visual Design

### Key User Flows

#### A. Registration Desk Flow (`/regdesk`)
1. **Fast Search / QR Scanner**: Type code/name/phone or use quick camera scan.
2. **Instant Profile Card**: Displays college, event name, team size, payment status (`Paid in Full` / `Advance Paid`), and attendance summary.
3. **Team Roster & Member Additions**:
   - Shows existing members.
   - Click **`+ Add Arriving Member`** to append teammates arriving at the venue.
   - Enforces max team size rules and checks duplicate phone/names.
4. **Attendance & ID Badge Actions**:
   - **`1-Tap Check-In All Present`** for instant batch processing.
   - Per-participant discrete toggles: **`Mark Present`** / **`Issue Badge`**.
   - Auto-calculates team status: `NOT ARRIVED`, `PARTIAL` (e.g., 3/5 present), or `ALL PRESENT`.

```
┌────────────────────────────────────────────────────────────────────────┐
│ [C26-1049]  TEAM THUNDER · IPL AUCTION                      [ONLINE]   │
│ St. Joseph's College of Engineering · ₹1,200 Paid · 0 Due              │
├────────────────────────────────────────────────────────────────────────┤
│ Roster & Attendance (3 of 5 Present · PARTIAL)                         │
│ [⚡ 1-Tap Check-In All Present]                                        │
│                                                                        │
│ 1. Rahul Sharma (Captain) · 9876543210                                 │
│    Attendance: [✓ PRESENT 08:42 AM]      Badge: [✓ ISSUED #C26-0104]  │
│                                                                        │
│ 2. Arjun V (Member) · 9876543211                                       │
│    Attendance: [✓ PRESENT 08:45 AM]      Badge: [✓ ISSUED #C26-0105]  │
│                                                                        │
│ 3. Karthik M (Member - Added at Venue) · 9876543212                    │
│    Attendance: [✓ PRESENT 08:46 AM]      Badge: [⏳ Issue Badge]       │
│                                                                        │
│ 4. Vishnu R (Member) · 9876543213                                      │
│    Attendance: [○ NOT ARRIVED]           Badge: [○ Not Issued]         │
│                                                                        │
│ [+ Add Arriving Team Member (1 slot remaining)]                        │
└────────────────────────────────────────────────────────────────────────┘
```

#### B. On-Spot Registration Flow (`/onspot`)
1. **Event Selector**: Lists open events with fixed fee & max size.
2. **Duplicate Detection Guard**: Auto-checks phone or team name against database to prevent accidental double entry.
3. **Roster Input**: Captain details + 1-click member fields up to event capacity.
4. **Payment Review**: Locked official event fee shown; prompt for volunteer to enter UTR reference number.
5. **Instant Check-In**: Creates registration, assigns badge numbers, marks participants present, and produces event pass.

---

## 3. Technical Architecture & Data Strategy

### Database Schema Migration (Non-Destructive)

```sql
-- 1. Extend public.registrations
ALTER TABLE public.registrations 
  ADD COLUMN IF NOT EXISTS registration_source TEXT DEFAULT 'ONLINE',
  ADD COLUMN IF NOT EXISTS check_in_status TEXT DEFAULT 'NOT_CHECKED_IN',
  ADD COLUMN IF NOT EXISTS checked_in_by TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Extend public.participants
ALTER TABLE public.participants 
  ADD COLUMN IF NOT EXISTS attendance_status TEXT DEFAULT 'NOT_ARRIVED',
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS checked_in_by TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS id_card_status TEXT DEFAULT 'NOT_ISSUED',
  ADD COLUMN IF NOT EXISTS id_card_number TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS id_card_issued_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS id_card_issued_by TEXT DEFAULT NULL;

-- 3. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS public.celestia_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    registration_id TEXT,
    registration_code TEXT,
    participant_id TEXT,
    participant_name TEXT,
    volunteer_role TEXT NOT NULL,
    volunteer_name TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable RLS and Permissive Policies
ALTER TABLE public.celestia_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public insert and read audit_logs" ON public.celestia_audit_logs;
CREATE POLICY "Allow public insert and read audit_logs" ON public.celestia_audit_logs 
  FOR ALL USING (true) WITH CHECK (true);
```

### Pages & Routing Structure
- `/regdesk` -> `src/pages/RegistrationDeskPage.tsx`
- `/onspot` -> `src/pages/OnSpotRegistrationPage.tsx`
- `/incharges` -> `src/pages/InchargesPortalPage.tsx` (Enhanced with `ONLINE` / `ON_SPOT` badges & member check-in states)
- Core Logic Service -> `src/services/eventDayService.ts`

---

## 4. Verification Plan

1. **Authentication**: Verify login for `REGISTRATION_DESK` (`regdesk@celestia.edu`) and `ON_SPOT_REGISTRATION` (`onspot@celestia.edu`).
2. **Pre-Registered Check-In**: Search existing registration, mark members present, issue badges, verify persistence.
3. **Team Member Addition**: Add new members to an existing team under event max limits.
4. **On-Spot Registration**: Create team and solo entries with UTR entry. Verify immediate appearance in `InchargesPortalPage.tsx`.
5. **Partial Team Attendance**: Verify teams with partial check-ins render as `PARTIAL`.
6. **Audit Logs**: Verify audit logs in Central Admin for all volunteer actions.
