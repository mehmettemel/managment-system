'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import dayjs from 'dayjs';
import { getServerToday } from '@/utils/server-date-helper';

/**
 * Generate Freeze Stress Test Scenarios
 * Creates 4 specific members to test edge cases
 */
export async function generateFreezeScenarios() {
  const supabase = await createClient();
  const today = await getServerToday();
  console.log('❄️ Generating Freeze Scenarios for date:', today);

  try {
    // 1. Get a class to enroll them in (Mock class or random)
    const { data: cls } = await supabase
      .from('classes')
      .select('id, price_monthly')
      .limit(1)
      .single();
    if (!cls) throw new Error('No classes found to enroll test members.');

    // Helper to create member
    const createMember = async (
      firstName: string,
      status: string,
      joinOffset: number
    ) => {
      const joinDate = dayjs(today)
        .add(joinOffset, 'month')
        .format('YYYY-MM-DD');
      const { data: member } = await supabase
        .from('members')
        .insert({
          first_name: firstName,
          last_name: 'Test (Freeze)',
          phone: '555' + Math.floor(Math.random() * 9000000),
          status: status,
          join_date: joinDate,
        })
        .select()
        .single();
      return member;
    };

    // Helper to enroll
    const enroll = async (memberId: number, nextPaymentOffset: number) => {
      await supabase.from('member_classes').insert({
        member_id: memberId,
        class_id: cls.id,
        active: true,
        price: cls.price_monthly,
        payment_interval: 1,
        next_payment_date: dayjs(today)
          .add(nextPaymentOffset, 'day')
          .format('YYYY-MM-DD'),
      });
    };

    // --- SCENARIO 1: Süresiz Donuk (Indefinite) ---
    // Frozen 1 month ago. No end date.
    const mem1 = await createMember('Süresiz', 'frozen', -3);
    await enroll(mem1.id, 30); // Next payment was supposed to be +30 days from now if active?
    // Actually doesn't matter much as unfreeze will shift it.
    // Let's say payment was due "Today" but they froze 1 month ago.
    // So next_payment_date = today - 30 (Frozen date).
    await supabase.from('frozen_logs').insert({
      member_id: mem1.id,
      start_date: dayjs(today).subtract(30, 'day').format('YYYY-MM-DD'),
      end_date: null, // Indefinite
      reason: 'Stress Test: Indefinite',
    });

    // --- SCENARIO 2: Süreli Donuk (Fixed Term) ---
    // Frozen 1 month ago. Ends 1 month from now.
    const mem2 = await createMember('Süreli', 'frozen', -3);
    await enroll(mem2.id, 0);
    await supabase.from('frozen_logs').insert({
      member_id: mem2.id,
      start_date: dayjs(today).subtract(30, 'day').format('YYYY-MM-DD'),
      end_date: dayjs(today).add(30, 'day').format('YYYY-MM-DD'), // Fixed end
      reason: 'Stress Test: Fixed Term',
    });

    // --- SCENARIO 3: Gelecek Donuk (Future Freeze) ---
    // Active now. Scheduled to freeze in 7 days.
    const mem3 = await createMember('Gelecek', 'active', -1);
    await enroll(mem3.id, 15); // Payment due in 15 days
    await supabase.from('frozen_logs').insert({
      member_id: mem3.id,
      start_date: dayjs(today).add(7, 'day').format('YYYY-MM-DD'),
      end_date: null,
      reason: 'Stress Test: Future Start',
    });

    // --- SCENARIO 4: Gecikmiş Donuk (Overdue & Frozen) ---
    // Payment was due 10 days ago. Result: Overdue.
    // Frozen Today.
    // Goal: Unfreeze should keep them overdue? Or extend due date?
    // Logic: If I owe money, freezing pauses the "Service", but the debt?
    // Usually: Freeze works forward. Past debt remains.
    const mem4 = await createMember('Gecikmiş', 'frozen', -5);
    await supabase.from('member_classes').insert({
      member_id: mem4.id,
      class_id: cls.id,
      active: true,
      price: cls.price_monthly,
      payment_interval: 1,
      // Payment was due 10 days ago
      next_payment_date: dayjs(today).subtract(10, 'day').format('YYYY-MM-DD'),
    });

    await supabase.from('frozen_logs').insert({
      member_id: mem4.id,
      start_date: dayjs(today).format('YYYY-MM-DD'), // Starts today
      end_date: null,
      reason: 'Stress Test: Overdue Freeze',
    });

    revalidatePath('/members');
    return { success: true, count: 4 };
  } catch (error: any) {
    return { error: error.message };
  }
}
