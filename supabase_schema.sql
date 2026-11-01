-- ==============================================================================
-- CELESTIA '26 SUPABASE DATABASE SCHEMA & RLS SETUP
-- Run this in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- Safe to run multiple times (idempotent / non-destructive)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Registrations Table
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_code TEXT UNIQUE NOT NULL,
    event_code TEXT NOT NULL,
    event_type TEXT,
    team_name TEXT,
    college_name TEXT,
    college_city TEXT,
    college_state TEXT,
    college_contact_person TEXT,
    college_contact_mobile TEXT,
    college_contact_email TEXT,
    is_college_delegation BOOLEAN DEFAULT false,
    participant_count INTEGER DEFAULT 1,
    fee_per_unit NUMERIC DEFAULT 0,
    fee_type TEXT DEFAULT 'per_team',
    total_fee NUMERIC DEFAULT 0,
    registration_status TEXT DEFAULT 'Submitted',
    admin_notes TEXT,
    verified_at TIMESTAMPTZ,
    rules_accepted BOOLEAN DEFAULT true,
    rules_version TEXT DEFAULT 'v1.0-celestia26',
    rules_accepted_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist even if table was previously created
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS promo_code TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS discount_percent NUMERIC;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS original_amount NUMERIC;

-- Advance Payment & Host Student Management Columns
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS is_host_college BOOLEAN DEFAULT false;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS host_register_number TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS host_batch TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS host_department TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS paid_amount NUMERIC DEFAULT NULL;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS pending_amount NUMERIC DEFAULT NULL;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Paid in Full';
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS payment_notes TEXT DEFAULT NULL;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS combo_group_id TEXT DEFAULT NULL;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS combo_id TEXT DEFAULT NULL;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS combo_name TEXT DEFAULT NULL;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS combo_type TEXT DEFAULT NULL;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS combo_discount_amount NUMERIC DEFAULT NULL;

-- 1. Synchronize total_fee to original_amount for all registrations (SMCH host college = 0)
UPDATE public.registrations
SET total_fee = CASE
  WHEN (is_host_college = true OR (college_name ILIKE '%srinivasan%' AND college_name NOT ILIKE '%dhanalakshmi%')) THEN 0
  ELSE COALESCE(NULLIF(original_amount, 0), total_fee, 0)
END;

-- 2. Update the two advance paying registrations (paid 500 each, remaining pending):
-- UUID 1: 44749e06-4bd5-4630-b4d0-93bf2cd7bc60
-- UUID 2: acb227ae-fd43-4798-8827-0466e8830cd1
UPDATE public.registrations
SET 
  total_fee = CASE
    WHEN (is_host_college = true OR (college_name ILIKE '%srinivasan%' AND college_name NOT ILIKE '%dhanalakshmi%')) THEN 0
    ELSE COALESCE(NULLIF(original_amount, 0), total_fee, 0)
  END,
  paid_amount = 500,
  pending_amount = GREATEST(0, COALESCE(NULLIF(original_amount, 0), total_fee, 0) - 500),
  payment_status = 'Advance Paid'
WHERE id IN (
  '44749e06-4bd5-4630-b4d0-93bf2cd7bc60',
  'acb227ae-fd43-4798-8827-0466e8830cd1'
);

-- 3. Update all other participants: paid_amount equals total_fee, pending_amount is 0
-- SMCH Host students: paid_amount = 0, pending_amount = 0, payment_status = 'Paid in Full'
-- All other participants: paid_amount = total_fee, pending_amount = 0, payment_status = 'Paid in Full'
UPDATE public.registrations
SET 
  paid_amount = CASE
    WHEN (is_host_college = true OR (college_name ILIKE '%srinivasan%' AND college_name NOT ILIKE '%dhanalakshmi%')) THEN 0
    ELSE total_fee
  END,
  pending_amount = 0,
  payment_status = 'Paid in Full'
WHERE id NOT IN (
  '44749e06-4bd5-4630-b4d0-93bf2cd7bc60',
  'acb227ae-fd43-4798-8827-0466e8830cd1'
);

-- 4. Sync payment_submissions table records for the two advance registrations
-- Note: payment_submissions uses 'Verified' (since receipt is verified) and amount_paid = 500
UPDATE public.payment_submissions
SET amount_paid = 500, payment_status = 'Verified'
WHERE registration_id IN (
  '44749e06-4bd5-4630-b4d0-93bf2cd7bc60',
  'acb227ae-fd43-4798-8827-0466e8830cd1'
);

-- 3. Create Participants Table
CREATE TABLE IF NOT EXISTS public.participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    gender TEXT,
    age INTEGER DEFAULT 20,
    mobile TEXT,
    email TEXT,
    role TEXT,
    id_card_storage_path TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create Payment Submissions Table
CREATE TABLE IF NOT EXISTS public.payment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE,
    utr_number TEXT,
    amount_paid NUMERIC DEFAULT 0,
    payment_screenshot_path TEXT,
    payment_status TEXT DEFAULT 'Pending',
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist even if table was previously created
ALTER TABLE public.payment_submissions ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE public.payment_submissions ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 5. Grant Schema & Table Permissions to public anon & authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 6. Configure Row Level Security (RLS)
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_submissions ENABLE ROW LEVEL SECURITY;

-- Allow public / anon users and admins full access to insert, read, and update
DROP POLICY IF EXISTS "Allow public insert to registrations" ON public.registrations;
CREATE POLICY "Allow public insert to registrations" ON public.registrations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public insert to participants" ON public.participants;
CREATE POLICY "Allow public insert to participants" ON public.participants FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public insert to payment_submissions" ON public.payment_submissions;
CREATE POLICY "Allow public insert to payment_submissions" ON public.payment_submissions FOR ALL USING (true) WITH CHECK (true);

-- 7. Create Storage Buckets for Uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('id-cards', 'id-cards', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public uploads and downloads to storage buckets
DROP POLICY IF EXISTS "Public bucket access payment-proofs" ON storage.objects;
CREATE POLICY "Public bucket access payment-proofs" ON storage.objects 
FOR ALL USING (bucket_id IN ('payment-proofs', 'id-cards')) 
WITH CHECK (bucket_id IN ('payment-proofs', 'id-cards'));
