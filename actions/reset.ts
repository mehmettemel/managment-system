'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Completely wipes all business data from the database.
 * Preserves admin accounts/auth if they are in a separate table not listed here.
 * (In this project, auth users are in Supabase Auth, but business tables are separate)
 */
export async function deleteAllData() {
  const supabase = await createClient();
  console.log('🚨 Deleting ALL data...');

  try {
    // Delete in order of dependencies (Child -> Parent)

    // 1. Logs & Transactions
    await supabase.from('payments').delete().neq('id', 0);
    await supabase.from('frozen_logs').delete().neq('id', 0);
    await supabase.from('instructor_payouts').delete().neq('id', 0);
    await supabase.from('instructor_ledger').delete().neq('id', 0);

    // 2. Member Relations
    await supabase.from('member_classes').delete().neq('id', 0);

    // 3. Profiles
    await supabase.from('members').delete().neq('id', 0);

    // 4. Configuration / Master Data
    await supabase.from('instructor_rates').delete().neq('id', 0);
    await supabase.from('classes').delete().neq('id', 0);
    await supabase.from('instructors').delete().neq('id', 0);

    revalidatePath('/');
    console.log('✅ All data deleted successfully.');
    return { success: true };
  } catch (error: any) {
    console.error('Delete Data Error:', error);
    return { error: error.message };
  }
}
