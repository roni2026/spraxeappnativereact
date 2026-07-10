import { supabase } from '../lib/supabase';

/** Reads the admin-configured business contact phone from site_settings.business_info. */
export async function getBusinessPhone(): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('site_settings')
      .select('key, value')
      .eq('key', 'business_info')
      .maybeSingle();
    const value = (data as { value?: Record<string, unknown> } | null)?.value;
    const phone = value?.phone;
    return typeof phone === 'string' ? phone : null;
  } catch {
    return null;
  }
}
