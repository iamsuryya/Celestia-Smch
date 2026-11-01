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

-- Backfill and reconcile payment columns (paid_amount, pending_amount, payment_status):
UPDATE public.registrations AS r
SET 
  paid_amount = COALESCE(r.paid_amount, (SELECT p.amount_paid FROM public.payment_submissions p WHERE p.registration_id = r.id ORDER BY p.created_at DESC LIMIT 1), r.total_fee, 0),
  pending_amount = GREATEST(0, COALESCE(r.total_fee, 0) - COALESCE(r.paid_amount, (SELECT p.amount_paid FROM public.payment_submissions p WHERE p.registration_id = r.id ORDER BY p.created_at DESC LIMIT 1), r.total_fee, 0)),
  payment_status = CASE 
    WHEN r.is_host_college = true THEN 'Paid in Full'
    WHEN GREATEST(0, COALESCE(r.total_fee, 0) - COALESCE(r.paid_amount, (SELECT p.amount_paid FROM public.payment_submissions p WHERE p.registration_id = r.id ORDER BY p.created_at DESC LIMIT 1), r.total_fee, 0)) = 0 AND COALESCE(r.total_fee, 0) > 0 THEN 'Paid in Full'
    WHEN COALESCE(r.paid_amount, (SELECT p.amount_paid FROM public.payment_submissions p WHERE p.registration_id = r.id ORDER BY p.created_at DESC LIMIT 1), 0) > 0 THEN 'Advance Paid'
    ELSE 'Pending'
  END
WHERE r.paid_amount IS NULL OR r.pending_amount IS NULL;

-- 1. Fix Tvmc dance crew advance payment (UTR: 667134329031): paid 500 advance, total 2500, due 2000
UPDATE public.registrations
SET 
  total_fee = 2500,
  paid_amount = 500,
  pending_amount = 2000,
  payment_status = 'Advance Paid'
WHERE team_name ILIKE '%tvmc%' OR id IN (SELECT registration_id FROM public.payment_submissions WHERE utr_number = '667134329031');

-- 2. Fix Hrithik Roshan advance payment: paid 500 advance, total 4500, due 4000
UPDATE public.registrations
SET 
  total_fee = 4500,
  paid_amount = 500,
  pending_amount = 4000,
  payment_status = 'Advance Paid'
WHERE id IN (SELECT registration_id FROM public.participants WHERE full_name ILIKE '%hrithik%');

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
