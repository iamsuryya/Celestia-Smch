import { PromoCode } from '../types/registration';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getCurrentAuthRole } from '../lib/authProfiles';

const PROMO_STORAGE_KEY = 'celestia26_promo_codes';

// Initial pre-configured seed promo codes (Only clean essential codes)
const DEFAULT_PROMO_CODES: PromoCode[] = [
  {
    id: 'promo-1',
    code: 'CELESTIA10',
    discountPercent: 10,
    applicableScope: 'all',
    discountType: 'percentage',
    description: 'General 10% promotional discount',
    isActive: true,
    redemptionCount: 0,
    createdAt: '2026-10-15',
  },
  {
    id: 'promo-ap500',
    code: 'AP500',
    discountPercent: 0,
    applicableScope: 'all',
    discountType: 'advance',
    advanceAmount: 500,
    isAdvancePayment: true,
    description: 'Advance payment of ₹500 (Balance due on arrival)',
    isActive: true,
    redemptionCount: 0,
    createdAt: '2026-10-20',
  },
  {
    id: 'promo-ap750',
    code: 'AP750',
    discountPercent: 0,
    applicableScope: 'all',
    discountType: 'advance',
    advanceAmount: 750,
    isAdvancePayment: true,
    description: 'Advance payment of ₹750 (Balance due on arrival)',
    isActive: true,
    redemptionCount: 0,
    createdAt: '2026-10-20',
  },
  {
    id: 'promo-ap2000',
    code: 'AP2000',
    discountPercent: 0,
    applicableScope: 'all',
    discountType: 'advance',
    advanceAmount: 2000,
    isAdvancePayment: true,
    description: 'Advance payment of ₹2000 (Balance due on arrival)',
    isActive: true,
    redemptionCount: 0,
    createdAt: '2026-10-20',
  },
];

class PromoCodeService {
  private bc = typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('celestia_promos_channel')
    : null;

  private getLocalCodes(): PromoCode[] {
    try {
      const saved = localStorage.getItem(PROMO_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    // Initialize default seed codes if none exist
    try {
      localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify(DEFAULT_PROMO_CODES));
    } catch {
      // ignore
    }
    return DEFAULT_PROMO_CODES;
  }

  private saveLocalCodes(codes: PromoCode[]): void {
    try {
      localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify(codes));
    } catch (err) {
      console.warn('Could not save promo codes to localStorage:', err);
    }
    // Broadcast instant update event across components and browser windows
    window.dispatchEvent(new CustomEvent('celestia-promocodes-changed', { detail: codes }));
    if (this.bc) {
      try {
        this.bc.postMessage({ type: 'PROMOS_UPDATED', codes });
      } catch {}
    }
  }

  public async getPromoCodes(): Promise<PromoCode[]> {
    const local = this.getLocalCodes();
    let remoteMapped: PromoCode[] = [];

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('celestia_promo_codes')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && Array.isArray(data)) {
          remoteMapped = data.map((d: any) => ({
            id: d.id || `promo-${d.code}`,
            code: String(d.code).toUpperCase(),
            discountPercent: d.discount_percent ?? d.discountPercent ?? 0,
            applicableScope: d.applicable_scope ?? d.applicableScope ?? 'all',
            discountType: d.discount_type ?? d.discountType ?? (d.is_advance_payment || d.isAdvancePayment ? 'advance' : 'percentage'),
            advanceAmount: d.advance_amount ?? d.advanceAmount,
            isAdvancePayment: d.is_advance_payment ?? d.isAdvancePayment ?? (d.discount_type === 'advance'),
            description: d.description,
            isActive: d.is_active ?? d.isActive ?? true,
            redemptionCount: d.redemption_count ?? d.redemptionCount ?? 0,
            createdAt: d.created_at ?? d.createdAt ?? new Date().toISOString(),
          }));
        }
      } catch (err) {
        console.warn('Supabase getPromoCodes notice:', err);
      }
    }

    // Merge remote and local promo codes by unique UPPERCASE code
    const mergedMap = new Map<string, PromoCode>();

    // 1. Populate with local promo codes
    local.forEach((codeObj) => {
      if (codeObj && codeObj.code) {
        mergedMap.set(codeObj.code.toUpperCase(), codeObj);
      }
    });

    // 2. Merge remote promo codes (overwriting synced fields)
    remoteMapped.forEach((remoteObj) => {
      if (!remoteObj || !remoteObj.code) return;
      const key = remoteObj.code.toUpperCase();
      const existingLocal = mergedMap.get(key);
      if (existingLocal) {
        mergedMap.set(key, {
          ...existingLocal,
          ...remoteObj,
          id: existingLocal.id || remoteObj.id,
          discountType: remoteObj.discountType || existingLocal.discountType,
          advanceAmount: remoteObj.advanceAmount ?? existingLocal.advanceAmount,
          isAdvancePayment: remoteObj.isAdvancePayment ?? existingLocal.isAdvancePayment,
          description: remoteObj.description || existingLocal.description,
          isActive: remoteObj.isActive !== undefined ? remoteObj.isActive : existingLocal.isActive,
        });
      } else {
        mergedMap.set(key, remoteObj);
      }
    });

    const mergedList = Array.from(mergedMap.values());
    this.saveLocalCodes(mergedList);
    return mergedList;
  }

  public async createPromoCode(
    codeRaw: string,
    discountPercent: number,
    description?: string,
    applicableScope: 'individual' | 'combo' | 'all' = 'all',
    discountType: 'percentage' | 'advance' = 'percentage',
    advanceAmount?: number
  ): Promise<{ success: boolean; promo?: PromoCode; message: string }> {
    const currentRole = getCurrentAuthRole();
    if (currentRole !== 'admin') {
      return {
        success: false,
        message: 'Permission Denied: Only Main Central Admin can create promo codes. Event incharges are restricted.',
      };
    }

    const code = codeRaw.trim().toUpperCase();
    if (!code) {
      return { success: false, message: 'Please provide a valid promo code string.' };
    }

    if (discountType === 'advance') {
      if (!advanceAmount || isNaN(advanceAmount) || advanceAmount <= 0) {
        return { success: false, message: 'Advance payment amount must be a valid positive amount in ₹.' };
      }
    } else {
      if (isNaN(discountPercent) || discountPercent <= 0 || discountPercent > 100) {
        return { success: false, message: 'Discount percentage must be between 1% and 100%.' };
      }
    }

    const currentCodes = this.getLocalCodes();
    const existingIndex = currentCodes.findIndex((p) => p.code.toUpperCase() === code);
    const isAdv = discountType === 'advance';

    let newPromo: PromoCode;

    if (existingIndex >= 0) {
      newPromo = {
        ...currentCodes[existingIndex],
        code,
        discountPercent: isAdv ? 0 : Math.round(discountPercent),
        applicableScope,
        discountType,
        advanceAmount: isAdv ? advanceAmount : undefined,
        isAdvancePayment: isAdv,
        description: description?.trim() || (isAdv ? `Advance Payment ₹${advanceAmount}` : `${Math.round(discountPercent)}% Off Discount`),
        isActive: true,
      };
      currentCodes[existingIndex] = newPromo;
      this.saveLocalCodes([...currentCodes]);
    } else {
      newPromo = {
        id: `promo-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        code,
        discountPercent: isAdv ? 0 : Math.round(discountPercent),
        applicableScope,
        discountType,
        advanceAmount: isAdv ? advanceAmount : undefined,
        isAdvancePayment: isAdv,
        description: description?.trim() || (isAdv ? `Advance Payment ₹${advanceAmount}` : `${Math.round(discountPercent)}% Off Discount`),
        isActive: true,
        redemptionCount: 0,
        createdAt: new Date().toISOString().split('T')[0],
      };
      this.saveLocalCodes([newPromo, ...currentCodes]);
    }

    // Save/upsert to Supabase if available
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('celestia_promo_codes').upsert(
          [
            {
              id: newPromo.id,
              code: newPromo.code,
              discount_percent: newPromo.discountPercent,
              applicable_scope: newPromo.applicableScope,
              discount_type: newPromo.discountType,
              advance_amount: newPromo.advanceAmount,
              is_advance_payment: newPromo.isAdvancePayment,
              description: newPromo.description,
              is_active: true,
              redemption_count: newPromo.redemptionCount || 0,
              created_at: newPromo.createdAt,
            },
          ],
          { onConflict: 'code' }
        );
        if (error) {
          console.warn('Supabase promo upsert notice:', error.message);
        }
      } catch (e) {
        console.warn('Could not persist new promo code to Supabase:', e);
      }
    }

    return {
      success: true,
      promo: newPromo,
      message: `Promo code "${code}" (${isAdv ? `Advance ₹${advanceAmount}` : `${newPromo.discountPercent}% OFF`}) is now ACTIVE!`,
    };
  }

  public async togglePromoCodeStatus(
    id: string,
    isActive: boolean
  ): Promise<{ success: boolean; message: string }> {
    const currentRole = getCurrentAuthRole();
    if (currentRole !== 'admin') {
      return {
        success: false,
        message: 'Permission Denied: Only Main Central Admin can activate or deactivate promo codes.',
      };
    }

    const codes = await this.getPromoCodes();
    const updated = codes.map((p) => (p.id === id || p.code.toUpperCase() === id.toUpperCase() ? { ...p, isActive } : p));
    this.saveLocalCodes(updated);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('celestia_promo_codes')
          .update({ is_active: isActive })
          .eq('id', id);
      } catch (e) {
        console.warn('Could not update promo code status in Supabase:', e);
      }
    }

    const targetCode = codes.find((p) => p.id === id || p.code.toUpperCase() === id.toUpperCase())?.code || 'Code';
    return {
      success: true,
      message: `Promo code "${targetCode}" is now ${isActive ? 'ACTIVE' : 'INACTIVE (Deactivated)'}.`,
    };
  }

  public async deletePromoCode(id: string): Promise<{ success: boolean; message: string }> {
    const currentRole = getCurrentAuthRole();
    if (currentRole !== 'admin') {
      return {
        success: false,
        message: 'Permission Denied: Only Main Central Admin can delete promo codes.',
      };
    }

    const codes = await this.getPromoCodes();
    const target = codes.find((p) => p.id === id || p.code.toUpperCase() === id.toUpperCase());
    const updated = codes.filter((p) => p.id !== id && p.code.toUpperCase() !== id.toUpperCase());
    this.saveLocalCodes(updated);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('celestia_promo_codes').delete().eq('id', id);
      } catch (e) {
        console.warn('Could not delete promo code from Supabase:', e);
      }
    }

    return { success: true, message: `Promo code "${target?.code || id}" deleted permanently.` };
  }

  public async validatePromoCode(
    codeRaw: string,
    scopeContext: 'individual' | 'combo' = 'individual',
    originalAmount?: number
  ): Promise<{
    valid: boolean;
    promo?: PromoCode;
    message: string;
    isAdvancePayment?: boolean;
    advanceAmount?: number;
    remainingBalance?: number;
    discountAmount?: number;
    finalPayable?: number;
  }> {
    const clean = codeRaw.trim().toUpperCase();
    if (!clean) {
      return { valid: false, message: 'Please enter a promo code.' };
    }

    // 1. Fetch current merged promo codes list
    const codes = await this.getPromoCodes();
    let match = codes.find((p) => p.code.toUpperCase() === clean);

    // 2. Direct Supabase Query Fallback if not found in local list (e.g. created on another device)
    if (!match && isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase
          .from('celestia_promo_codes')
          .select('*')
          .ilike('code', clean)
          .maybeSingle();

        if (data) {
          match = {
            id: data.id || `promo-${data.code}`,
            code: String(data.code).toUpperCase(),
            discountPercent: data.discount_percent ?? data.discountPercent ?? 0,
            applicableScope: data.applicable_scope ?? data.applicableScope ?? 'all',
            discountType: data.discount_type ?? data.discountType ?? (data.is_advance_payment || data.isAdvancePayment ? 'advance' : 'percentage'),
            advanceAmount: data.advance_amount ?? data.advanceAmount,
            isAdvancePayment: data.is_advance_payment ?? data.isAdvancePayment ?? (data.discount_type === 'advance'),
            description: data.description || 'Promotional Discount Code',
            isActive: data.is_active ?? data.isActive ?? true,
            redemptionCount: data.redemption_count ?? data.redemptionCount ?? 0,
            createdAt: data.created_at ?? data.createdAt ?? new Date().toISOString(),
          };

          // Cache locally
          const currentLocals = this.getLocalCodes();
          if (!currentLocals.some((p) => p.code.toUpperCase() === match!.code)) {
            this.saveLocalCodes([match, ...currentLocals]);
          }
        }
      } catch (err) {
        console.warn('Direct Supabase promo query notice:', err);
      }
    }

    // If still not matched, reject as invalid
    if (!match) {
      return { valid: false, message: `Promo code "${clean}" is invalid or does not exist.` };
    }

    if (!match.isActive) {
      return { valid: false, message: `Promo code "${clean}" is currently deactivated by admin.` };
    }

    // Check scope
    const scope = match.applicableScope || 'all';
    if (scope !== 'all' && scope !== scopeContext) {
      const scopeName = scope === 'combo' ? 'Combo Offers' : 'Individual Events';
      return {
        valid: false,
        message: `Promo code "${clean}" is applicable only for ${scopeName}.`,
      };
    }

    // Check if advance payment code
    const isAdv = match.isAdvancePayment || match.discountType === 'advance';
    if (isAdv) {
      const advAmt = match.advanceAmount || 0;
      if (originalAmount && originalAmount > 0) {
        if (advAmt >= originalAmount) {
          return {
            valid: false,
            message: `Advance payment code (${clean} = ₹${advAmt}) exceeds total fee of ₹${originalAmount}. Paying in full is cheaper!`,
          };
        }
        const remaining = originalAmount - advAmt;
        return {
          valid: true,
          promo: match,
          isAdvancePayment: true,
          advanceAmount: advAmt,
          remainingBalance: remaining,
          finalPayable: advAmt,
          discountAmount: remaining,
          message: `Advance code "${match.code}" applied! Pay ₹${advAmt} now. Remaining balance ₹${remaining} to be paid on arrival.`,
        };
      }
      return {
        valid: true,
        promo: match,
        isAdvancePayment: true,
        advanceAmount: advAmt,
        finalPayable: advAmt,
        message: `Advance code "${match.code}" applied! Pay ₹${advAmt} now. Remaining balance due on arrival.`,
      };
    }

    // Standard percentage discount
    const pct = match.discountPercent || 0;
    let discAmt = 0;
    let finalPay = originalAmount;
    if (originalAmount && originalAmount > 0) {
      discAmt = Math.round((originalAmount * pct) / 100);
      finalPay = Math.max(0, originalAmount - discAmt);
    }

    return {
      valid: true,
      promo: match,
      isAdvancePayment: false,
      discountAmount: discAmt,
      finalPayable: finalPay,
      message: `Promo code "${match.code}" applied! You get ${pct}% OFF.`,
    };
  }

  public async incrementRedemption(codeRaw: string): Promise<void> {
    const clean = codeRaw.trim().toUpperCase();
    if (!clean) return;

    const codes = await this.getPromoCodes();
    const updated = codes.map((p) =>
      p.code.toUpperCase() === clean ? { ...p, redemptionCount: (p.redemptionCount || 0) + 1 } : p
    );
    this.saveLocalCodes(updated);

    if (isSupabaseConfigured && supabase) {
      try {
        const match = codes.find((p) => p.code.toUpperCase() === clean);
        if (match) {
          await supabase
            .from('celestia_promo_codes')
            .update({ redemption_count: (match.redemptionCount || 0) + 1 })
            .eq('id', match.id);
        }
      } catch (e) {
        // ignore
      }
    }
  }

  public subscribeToRealtimePromos(onChange: (codes: PromoCode[]) => void): () => void {
    let channel: any = null;

    if (isSupabaseConfigured && supabase) {
      try {
        channel = supabase
          .channel('celestia-promocodes-realtime')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'celestia_promo_codes' },
            async () => {
              const updated = await this.getPromoCodes();
              onChange(updated);
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('Supabase Realtime subscription error:', err);
      }
    }

    const handleCustomEvent = async (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        onChange(e.detail);
      } else {
        const updated = await this.getPromoCodes();
        onChange(updated);
      }
    };

    window.addEventListener('celestia-promocodes-changed', handleCustomEvent);
    window.addEventListener('storage', handleCustomEvent);

    if (this.bc) {
      this.bc.onmessage = async (event) => {
        if (event.data?.type === 'PROMOS_UPDATED') {
          if (Array.isArray(event.data.codes)) {
            onChange(event.data.codes);
          } else {
            const updated = await this.getPromoCodes();
            onChange(updated);
          }
        }
      };
    }

    return () => {
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
      window.removeEventListener('celestia-promocodes-changed', handleCustomEvent);
      window.removeEventListener('storage', handleCustomEvent);
    };
  }
}

export const promoCodeService = new PromoCodeService();
