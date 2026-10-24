import { PromoCode } from '../types/registration';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const PROMO_STORAGE_KEY = 'celestia26_promo_codes';

// Initial pre-configured seed promo codes
const DEFAULT_PROMO_CODES: PromoCode[] = [
  {
    id: 'promo-1',
    code: 'CELESTIA10',
    discountPercent: 10,
    description: 'General 10% promotional discount',
    isActive: true,
    redemptionCount: 14,
    createdAt: '2026-10-15',
  },
  {
    id: 'promo-2',
    code: 'EARLYBIRD20',
    discountPercent: 20,
    description: 'Early bird 20% discount offer',
    isActive: true,
    redemptionCount: 28,
    createdAt: '2026-10-16',
  },
  {
    id: 'promo-3',
    code: 'SMCHSPECIAL15',
    discountPercent: 15,
    description: 'Special 15% discount voucher',
    isActive: true,
    redemptionCount: 8,
    createdAt: '2026-10-17',
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
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('celestia_promo_codes')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: PromoCode[] = data.map((d: any) => ({
            id: d.id,
            code: d.code,
            discountPercent: d.discount_percent ?? d.discountPercent,
            description: d.description,
            isActive: d.is_active ?? d.isActive ?? true,
            redemptionCount: d.redemption_count ?? d.redemptionCount ?? 0,
            createdAt: d.created_at ?? d.createdAt ?? new Date().toISOString(),
          }));
          this.saveLocalCodes(mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase getPromoCodes error, fallback to local:', err);
      }
    }
    return local;
  }

  public async createPromoCode(
    codeRaw: string,
    discountPercent: number,
    description?: string
  ): Promise<{ success: boolean; promo?: PromoCode; message: string }> {
    const code = codeRaw.trim().toUpperCase();
    if (!code) {
      return { success: false, message: 'Please provide a valid promo code string.' };
    }
    if (isNaN(discountPercent) || discountPercent <= 0 || discountPercent > 100) {
      return { success: false, message: 'Discount percentage must be between 1% and 100%.' };
    }

    const currentCodes = await this.getPromoCodes();
    if (currentCodes.some((p) => p.code.toUpperCase() === code)) {
      return { success: false, message: `Promo code "${code}" already exists in the system.` };
    }

    const newPromo: PromoCode = {
      id: `promo-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      code,
      discountPercent: Math.round(discountPercent),
      description: description?.trim() || `${Math.round(discountPercent)}% Off Discount`,
      isActive: true,
      redemptionCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };

    // Update LocalStorage
    const updated = [newPromo, ...currentCodes];
    this.saveLocalCodes(updated);

    // Save to Supabase if available
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('celestia_promo_codes').insert([
          {
            id: newPromo.id,
            code: newPromo.code,
            discount_percent: newPromo.discountPercent,
            description: newPromo.description,
            is_active: newPromo.isActive,
            redemption_count: 0,
            created_at: newPromo.createdAt,
          },
        ]);
      } catch (e) {
        console.warn('Could not persist new promo code to Supabase:', e);
      }
    }

    return { success: true, promo: newPromo, message: `Promo code "${code}" (${newPromo.discountPercent}% OFF) created successfully!` };
  }

  public async togglePromoCodeStatus(
    id: string,
    isActive: boolean
  ): Promise<{ success: boolean; message: string }> {
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
    codeRaw: string
  ): Promise<{ valid: boolean; promo?: PromoCode; message: string }> {
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
      return { valid: false, message: `Promo code "${clean}" is currently deactivated.` };
    }

    return {
      valid: true,
      promo: match,
      message: `Promo code "${match.code}" applied! You get ${match.discountPercent}% OFF.`,
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
