import type { SupabaseClient } from '@supabase/supabase-js';
import type { RepairRecord } from '@/app/types/database';

export interface CustomerVisitStats {
  customerId: string | null;
  totalVisits: number;
  nextVisitNumber: number;
  repairs: Pick<RepairRecord, 'id' | 'repair_id' | 'visit_number' | 'created_at' | 'status' | 'model_item_name'>[];
}

const REPAIR_VISIT_SELECT =
  'id, repair_id, visit_number, created_at, status, model_item_name, customer_id';

export async function getCustomerVisitStats(
  supabase: SupabaseClient,
  customerId: string
): Promise<CustomerVisitStats> {
  const { data: repairs, error } = await supabase
    .from('repairs')
    .select(REPAIR_VISIT_SELECT)
    .eq('customer_id', customerId)
    .order('visit_number', { ascending: true });

  if (error) {
    throw error;
  }

  const list = repairs || [];
  const totalVisits = list.length;

  return {
    customerId,
    totalVisits,
    nextVisitNumber: totalVisits + 1,
    repairs: list,
  };
}

export async function getCustomerVisitStatsByPhone(
  supabase: SupabaseClient,
  phone: string
): Promise<CustomerVisitStats | null> {
  const normalizedPhone = phone?.trim();
  if (!normalizedPhone || normalizedPhone.length < 10) {
    return null;
  }

  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id')
    .eq('phone', normalizedPhone)
    .maybeSingle();

  if (customerError) {
    throw customerError;
  }

  if (!customer) {
    return {
      customerId: null,
      totalVisits: 0,
      nextVisitNumber: 1,
      repairs: [],
    };
  }

  return getCustomerVisitStats(supabase, customer.id);
}
