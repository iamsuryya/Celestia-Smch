import { PromoCode } from '../types/registration';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getCurrentAuthRole } from '../lib/authProfiles';

const PROMO_STORAGE_KEY = 'celestia26_promo_codes';

// Initial pre-configured seed promo codes
const DEFAULT_PROMO_CODES: PromoCode[] = [
  {
    id: 'promo-1',
    code: 'CELESTIA10',
    discountPercent: 10,
    applicableScope: 'all',
    discountType: 'percentage',
    description: 'General 10% promotional discount',
    isActive: true,
    redemptionCount: 14,
    createdAt: '2026-10-15',
  },
  {
    id: 'promo-2',
    code: 'EARLYBIRD20',
    discountPercent: 20,
    applicableScope: 'individual',
    discountType: 'percentage',
    description: 'Early bird 20% discount offer for Individual Events',
    isActive: true,
    redemptionCount: 28,
    createdAt: '2026-10-16',
  },
  {
    id: 'promo-3',
    code: 'SMCHSPECIAL15',
    discountPercent: 15,
    applicableScope: 'combo',
    discountType: 'percentage',
    description: 'Special 15% discount for Combo Packages',
    isActive: true,
    redemptionCount: 8,
    createdAt: '2026-10-17',
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
    redemptionCount: 5,
    createdAt: '2026-10-20',
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
    redemptionCount: 3,
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
    redemptionCount: 2,
    createdAt: '2026-10-20',
  },
];

class PromoCodeService {
  private getLocalCodes(): PromoCode[] {
    try {
      const saved = localStorage.getItem(PROMO_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
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
    // Broadcast instant update event to all active components & windows
    window.dispatchEvent(new CustomEvent('celestia-promocodes-changed', { detail: codes }));
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
            code: d.code,
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
        console.warn('Supabase getPromoCodes error, fallback to local:', err);
      }
    }

    // Merge remote and local promo codes by unique UPPERCASE code to ensure no local promo codes are lost
    const mergedMap = new Map<string, PromoCode>();

    // 1. Populate with local promo codes
    local.forEach((codeObj) => {
      if (codeObj && codeObj.code) {
        mergedMap.set(codeObj.code.toUpperCase(), codeObj);
      }
    });

    // 2. Merge remote promo codes (overwriting synced fields, retaining local fields if missing)
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
    if (currentCodes.some((p) => p.code.toUpperCase() === code)) {
      return { success: false, message: `Promo code "${code}" already exists in the system.` };
    }

    const isAdv = discountType === 'advance';
    const newPromo: PromoCode = {
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

    // Update LocalStorage immediately
    const updated = [newPromo, ...currentCodes];
    this.saveLocalCodes(updated);

    // Save to Supabase if available (with fallback safety)
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
              is_active: newPromo.isActive,
              redemption_count: 0,
              created_at: newPromo.createdAt,
            },
          ],
          { onConflict: 'code' }
        );
        if (error) {
          console.warn('Supabase promo insert notice:', error.message);
        }
      } catch (e) {
        console.warn('Could not persist new promo code to Supabase:', e);
      }
    }

    return {
      success: true,
      promo: newPromo,
      message: `Promo code "${code}" (${isAdv ? `Advance ₹${advanceAmount}` : `${newPromo.discountPercent}% OFF`}) created successfully!`,
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
    const updated = codes.map((p) => (p.id === id ? { ...p, isActive } : p));
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

    const targetCode = codes.find((p) => p.id === id)?.code || 'Code';
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
    const target = codes.find((p) => p.id === id);
    const updated = codes.filter((p) => p.id !== id);
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

    const codes = await this.getPromoCodes();
    const match = codes.find((p) => p.code.toUpperCase() === clean);

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
      p.code.toUpperCase() === clean ? { ...p, redemptionCount: p.redemptionCount + 1 } : p
    );
    this.saveLocalCodes(updated);

    if (isSupabaseConfigured && supabase) {
      try {
        const match = codes.find((p) => p.code.toUpperCase() === clean);
        if (match) {
          await supabase
            .from('celestia_promo_codes')
            .update({ redemption_count: match.redemptionCount + 1 })
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
