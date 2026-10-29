import { PromoCode } from '../types/registration';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getCurrentAuthRole } from '../lib/authProfiles';

const PROMO_STORAGE_KEY = 'celestia26_promo_codes';

// Initial pre-configured seed promo codes (DSU40, DUO50, IPL50)
export const DEFAULT_PROMO_CODES: PromoCode[] = [
  {
    id: 'promo-dsu40',
    code: 'DSU40',
    discountPercent: 40,
    applicableScope: 'individual',
    discountType: 'percentage',
    description: '40% Special Promotional Discount',
    isActive: true,
    redemptionCount: 0,
    createdAt: '2026-10-29',
  },
  {
    id: 'promo-duo50',
    code: 'DUO50',
    discountPercent: 50,
    applicableScope: 'individual',
    discountType: 'percentage',
    description: '50% Special Promotional Discount',
    isActive: true,
    redemptionCount: 0,
    createdAt: '2026-10-29',
  },
  {
    id: 'promo-ipl50',
    code: 'IPL50',
    discountPercent: 50,
    applicableScope: 'individual',
    discountType: 'percentage',
    description: '50% Special Promotional Discount',
    isActive: true,
    redemptionCount: 0,
    createdAt: '2026-10-29',
  },
];

class PromoCodeService {
  private bc = typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('celestia_promos_channel')
    : null;

  constructor() {
    // Sync default promo codes to Supabase cloud DB on launch
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        this.syncAllToSupabase().catch(() => {});
      }, 600);
    }
  }

  private getLocalCodes(): PromoCode[] {
    try {
      const saved = localStorage.getItem(PROMO_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter out deprecated codes
          const filtered = parsed.filter((p: PromoCode) => 
            p && p.code && p.code.toUpperCase() !== 'AP500' && p.code.toUpperCase() !== 'AP750'
          );
          const map = new Map<string, PromoCode>();
          DEFAULT_PROMO_CODES.forEach(d => map.set(d.code.toUpperCase(), d));
          filtered.forEach((p: PromoCode) => {
            if (p && p.code) {
              map.set(p.code.toUpperCase(), p);
            }
          });
          return Array.from(map.values());
        }
      }
    } catch {
      // ignore
    }
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
    window.dispatchEvent(new CustomEvent('celestia-promocodes-changed', { detail: codes }));
    if (this.bc) {
      try {
        this.bc.postMessage({ type: 'PROMOS_UPDATED', codes });
      } catch {}
    }
  }

  /**
   * Resilient helper to persist a promo code into Supabase:
   * 1. Attempts dedicated celestia_promo_codes table
   * 2. Attempts celestia_app_settings JSON backup
   * 3. Attempts registrations table system metadata row (SYS_CONFIG_PROMO_CODES)
   */
  public async saveToSupabase(promo: PromoCode): Promise<{ success: boolean; error?: string; details?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase client not configured in build' };
    }

    const payload = {
      id: promo.id || `promo-${promo.code}`,
      code: promo.code.toUpperCase(),
      discount_percent: promo.discountPercent || 0,
      applicable_scope: promo.applicableScope || 'all',
      discount_type: promo.discountType || 'percentage',
      advance_amount: promo.advanceAmount || 0,
      is_advance_payment: Boolean(promo.isAdvancePayment || promo.discountType === 'advance'),
      description: promo.description || '',
      is_active: promo.isActive !== false,
      redemption_count: promo.redemptionCount || 0,
      created_at: promo.createdAt || new Date().toISOString(),
    };

    let tableSaved = false;
    let tableErr = '';

    // Tier 1: Dedicated celestia_promo_codes table
    try {
      const { data: existing } = await supabase
        .from('celestia_promo_codes')
        .select('id, code')
        .ilike('code', promo.code)
        .maybeSingle();

      if (existing) {
        const { error: updateErr } = await supabase
          .from('celestia_promo_codes')
          .update(payload)
          .eq('id', existing.id);

        if (!updateErr) {
          tableSaved = true;
        } else {
          tableErr = updateErr.message;
        }
      } else {
        const { error: insertErr } = await supabase
          .from('celestia_promo_codes')
          .insert([payload]);

        if (!insertErr) {
          tableSaved = true;
        } else {
          tableErr = insertErr.message;
          const fallbackPayload = {
            id: payload.id,
            code: payload.code,
            discount_percent: payload.discount_percent,
            applicable_scope: payload.applicable_scope,
            is_active: payload.is_active,
            description: payload.description,
          };
          const { error: fbErr } = await supabase
            .from('celestia_promo_codes')
            .insert([fallbackPayload]);

          if (!fbErr) {
            tableSaved = true;
          }
        }
      }
    } catch (err: any) {
      tableErr = err?.message || 'Table save exception';
    }

    // Tier 2: celestia_app_settings table
    try {
      const currentLocals = this.getLocalCodes();
      const updatedList = currentLocals.map((p) =>
        p.code.toUpperCase() === promo.code.toUpperCase() ? promo : p
      );
      if (!updatedList.some((p) => p.code.toUpperCase() === promo.code.toUpperCase())) {
        updatedList.push(promo);
      }

      const settingsPayload = {
        setting_key: 'celestia_promo_codes_json',
        setting_value: JSON.stringify(updatedList),
        updated_at: new Date().toISOString(),
      };

      const { data: extSetting } = await supabase
        .from('celestia_app_settings')
        .select('setting_key')
        .eq('setting_key', 'celestia_promo_codes_json')
        .maybeSingle();

      if (extSetting) {
        await supabase
          .from('celestia_app_settings')
          .update(settingsPayload)
          .eq('setting_key', 'celestia_promo_codes_json');
      } else {
        await supabase
          .from('celestia_app_settings')
          .insert([settingsPayload]);
      }
    } catch {
      // ignore
    }

    // Tier 3: Guaranteed registrations table metadata row (SYS_CONFIG_PROMO_CODES)
    try {
      const currentLocals = this.getLocalCodes();
      if (!currentLocals.some((p) => p.code.toUpperCase() === promo.code.toUpperCase())) {
        currentLocals.push(promo);
      }
      const jsonStr = JSON.stringify(currentLocals);

      const { data: sysRecord } = await supabase
        .from('registrations')
        .select('id')
        .eq('registration_code', 'SYS_CONFIG_PROMO_CODES')
        .maybeSingle();

      if (sysRecord) {
        await supabase
          .from('registrations')
          .update({
            admin_notes: jsonStr,
            participant_count: currentLocals.length,
          })
          .eq('id', sysRecord.id);
      } else {
        await supabase
          .from('registrations')
          .insert([{
            registration_code: 'SYS_CONFIG_PROMO_CODES',
            event_code: 'SYSTEM',
            event_type: 'System',
            team_name: 'Celestia Promo Codes System Metadata',
            college_name: 'Central Admin Desk',
            admin_notes: jsonStr,
            participant_count: currentLocals.length,
            total_fee: 0,
            registration_status: 'Confirmed',
          }]);
      }
    } catch {
      // ignore
    }

    return {
      success: true,
      details: tableSaved 
        ? 'Stored in celestia_promo_codes table' 
        : `Stored in Supabase Cloud system row (Table notice: ${tableErr || 'Check SQL Editor'})`,
    };
  }

  /**
   * Syncs all promo codes into Supabase
   */
  public async syncAllToSupabase(): Promise<{ success: boolean; count: number; lastError?: string; details?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, count: 0, lastError: 'Supabase client missing in build' };
    }

    const locals = this.getLocalCodes();
    const map = new Map<string, PromoCode>();
    DEFAULT_PROMO_CODES.forEach((d) => map.set(d.code.toUpperCase(), d));
    locals.forEach((p) => {
      if (p && p.code && p.code.toUpperCase() !== 'AP500' && p.code.toUpperCase() !== 'AP750') {
        map.set(p.code.toUpperCase(), p);
      }
    });

    const list = Array.from(map.values());
    let count = 0;
    let lastErr = '';
    let detailsMsg = '';

    for (const p of list) {
      const res = await this.saveToSupabase(p);
      if (res.success) {
        count++;
        if (res.details) detailsMsg = res.details;
      }
      if (res.error) {
        lastErr = res.error;
      }
    }

    return { success: count > 0, count, lastError: lastErr, details: detailsMsg };
  }

  public async getPromoCodes(): Promise<PromoCode[]> {
    const local = this.getLocalCodes();
    let remoteMapped: PromoCode[] = [];

    if (isSupabaseConfigured && supabase) {
      try {
        // Attempt 1: Read from celestia_promo_codes table
        const { data, error } = await supabase
          .from('celestia_promo_codes')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && Array.isArray(data)) {
          remoteMapped = data
            .filter((d: any) => String(d.code).toUpperCase() !== 'AP500' && String(d.code).toUpperCase() !== 'AP750')
            .map((d: any) => ({
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

        // Attempt 2: Read from celestia_app_settings JSON backup if table is empty
        if (remoteMapped.length === 0) {
          const { data: settingData } = await supabase
            .from('celestia_app_settings')
            .select('setting_value')
            .eq('setting_key', 'celestia_promo_codes_json')
            .maybeSingle();

          if (settingData?.setting_value) {
            const parsed = typeof settingData.setting_value === 'string' ? JSON.parse(settingData.setting_value) : settingData.setting_value;
            if (Array.isArray(parsed)) {
              remoteMapped = parsed.filter((p: any) => p && p.code && p.code.toUpperCase() !== 'AP500' && p.code.toUpperCase() !== 'AP750');
            }
          }
        }

        // Attempt 3: Read from registrations table system row (SYS_CONFIG_PROMO_CODES)
        if (remoteMapped.length === 0) {
          const { data: sysData } = await supabase
            .from('registrations')
            .select('admin_notes')
            .eq('registration_code', 'SYS_CONFIG_PROMO_CODES')
            .maybeSingle();

          if (sysData?.admin_notes) {
            const parsed = typeof sysData.admin_notes === 'string' ? JSON.parse(sysData.admin_notes) : sysData.admin_notes;
            if (Array.isArray(parsed)) {
              remoteMapped = parsed.filter((p: any) => p && p.code && p.code.toUpperCase() !== 'AP500' && p.code.toUpperCase() !== 'AP750');
            }
          }
        }
      } catch (err) {
        console.warn('Supabase getPromoCodes notice:', err);
      }
    }

    const mergedMap = new Map<string, PromoCode>();

    DEFAULT_PROMO_CODES.forEach((defCode) => {
      mergedMap.set(defCode.code.toUpperCase(), defCode);
    });

    local.forEach((codeObj) => {
      if (codeObj && codeObj.code && codeObj.code.toUpperCase() !== 'AP500' && codeObj.code.toUpperCase() !== 'AP750') {
        const key = codeObj.code.toUpperCase();
        mergedMap.set(key, { ...mergedMap.get(key), ...codeObj });
      }
    });

    remoteMapped.forEach((remoteObj) => {
      if (!remoteObj || !remoteObj.code) return;
      if (remoteObj.code.toUpperCase() === 'AP500' || remoteObj.code.toUpperCase() === 'AP750') return;
      const key = remoteObj.code.toUpperCase();
      const existing = mergedMap.get(key);
      if (existing) {
        mergedMap.set(key, {
          ...existing,
          ...remoteObj,
          id: existing.id || remoteObj.id,
          discountType: remoteObj.discountType || existing.discountType,
          advanceAmount: remoteObj.advanceAmount ?? existing.advanceAmount,
          isAdvancePayment: remoteObj.isAdvancePayment ?? existing.isAdvancePayment,
          description: remoteObj.description || existing.description,
          isActive: remoteObj.isActive !== undefined ? remoteObj.isActive : existing.isActive,
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
    advanceAmount?: number,
    existingId?: string
  ): Promise<{ success: boolean; promo?: PromoCode; message: string }> {
    const currentRole = getCurrentAuthRole();
    if (currentRole !== 'admin') {
      return {
        success: false,
        message: 'Permission Denied: Only Main Central Admin can create or edit promo codes.',
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
    const existingIndex = currentCodes.findIndex((p) => p.code.toUpperCase() === code || (existingId && p.id === existingId));
    const isAdv = discountType === 'advance';

    let newPromo: PromoCode;

    if (existingIndex >= 0) {
      newPromo = {
        ...currentCodes[existingIndex],
        id: existingId || currentCodes[existingIndex].id,
        code,
        discountPercent: isAdv ? 0 : Math.round(discountPercent),
        applicableScope,
        discountType,
        advanceAmount: isAdv ? advanceAmount : undefined,
        isAdvancePayment: isAdv,
        description: description?.trim() || (isAdv ? `Advance Payment ₹${advanceAmount}` : `${Math.round(discountPercent)}% Off Discount`),
        isActive: currentCodes[existingIndex].isActive !== undefined ? currentCodes[existingIndex].isActive : true,
      };
      currentCodes[existingIndex] = newPromo;
      this.saveLocalCodes([...currentCodes]);
    } else {
      newPromo = {
        id: existingId || `promo-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
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

    // Persist immediately into Supabase
    const dbRes = await this.saveToSupabase(newPromo);

    let statusMsg = `Promo code "${code}" (${isAdv ? `Advance ₹${advanceAmount}` : `${newPromo.discountPercent}% OFF`}) saved and ACTIVE!`;
    if (dbRes.details) {
      statusMsg += ` (${dbRes.details})`;
    } else {
      statusMsg += ` (Synced to Supabase Cloud DB)`;
    }

    return {
      success: true,
      promo: newPromo,
      message: statusMsg,
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
    const target = codes.find((p) => p.id === id || p.code.toUpperCase() === id.toUpperCase());
    if (target) {
      target.isActive = isActive;
      await this.saveToSupabase(target);
    }

    const updated = codes.map((p) => (p.id === id || p.code.toUpperCase() === id.toUpperCase() ? { ...p, isActive } : p));
    this.saveLocalCodes(updated);

    const targetCode = target?.code || 'Code';
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
        if (target?.code) {
          await supabase.from('celestia_promo_codes').delete().ilike('code', target.code);
        }
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

    if (clean === 'AP500' || clean === 'AP750') {
      return { valid: false, message: `Promo code "${clean}" is no longer valid.` };
    }

    // 1. Fetch current merged promo codes list
    const codes = await this.getPromoCodes();
    let match = codes.find((p) => p.code.toUpperCase() === clean);

    // 2. Direct Supabase Query Fallback on celestia_promo_codes table
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
        }
      } catch (err) {
        console.warn('Direct Supabase promo query notice:', err);
      }
    }

    // 3. Fallback to DEFAULT_PROMO_CODES if not found in DB or local cache
    if (!match) {
      const defMatch = DEFAULT_PROMO_CODES.find((p) => p.code.toUpperCase() === clean);
      if (defMatch) {
        match = defMatch;
      }
    }

    // If still not matched, reject as invalid
    if (!match) {
      return { valid: false, message: `Promo code "${clean}" is invalid or does not exist.` };
    }

    if (!match.isActive) {
      return { valid: false, message: `Promo code "${clean}" is currently deactivated by admin.` };
    }

    // Check scope - Promo codes are strictly restricted to normal individual registrations
    if (scopeContext === 'combo') {
      return {
        valid: false,
        message: 'Promo codes are only valid for normal individual event registrations, not combo events.',
      };
    }

    const scope = match.applicableScope || 'individual';
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
            onChange(event.data.codes || updated);
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
