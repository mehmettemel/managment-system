'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import dayjs from 'dayjs';

/**
 * Seed Database with Integrated Test Data
 * Clears existing data and populates with realistic scenarios for testing:
 * - Enrollment System
 * - Payment Snapshots
 * - Class Transfers
 */
export async function seedDatabase() {
  const supabase = await createClient();
  console.log('🌱 Seeding database...');

  try {
    // 1. CLEANUP (Foreign Key Order)
    console.log('Cleaning old data...');
    await supabase.from('payments').delete().neq('id', 0);
    await supabase.from('member_classes').delete().neq('id', 0);
    await supabase.from('members').delete().neq('id', 0);
    await supabase.from('classes').delete().neq('id', 0);
    await supabase.from('instructors').delete().neq('id', 0);

    // 2. INSTRUCTORS
    const instructors = [
      {
        first_name: 'Ezgi',
        last_name: 'Zaman',
        specialty: 'Salsa & Bachata',
        phone: '5551001001',
      },
      {
        first_name: 'Cem',
        last_name: 'Demir',
        specialty: 'Kizomba',
        phone: '5551001002',
      },
      {
        first_name: 'Melis',
        last_name: 'Güneş',
        specialty: 'Tango',
        phone: '5551001003',
      },
    ];
    const { data: insts } = await supabase
      .from('instructors')
      .insert(instructors)
      .select();
    if (!insts) throw new Error('Failed to seed instructors');

    const [instEzgi, instCem, instMelis] = insts;

    // 3. CLASSES
    const classes = [
      {
        name: 'Salsa Başlangıç (A)',
        instructor_id: instEzgi.id,
        day_of_week: 'Salı',
        start_time: '19:30',
        price_monthly: 1500,
        active: true,
      },
      {
        name: 'Bachata Orta (B)',
        instructor_id: instEzgi.id,
        day_of_week: 'Perşembe',
        start_time: '20:30',
        price_monthly: 1800,
        active: true,
      },
      {
        name: 'Kizomba Lab',
        instructor_id: instCem.id,
        day_of_week: 'Çarşamba',
        start_time: '21:00',
        price_monthly: 1200,
        active: true,
      },
      {
        name: 'Eski Dönem Salsa', // For archive testing
        instructor_id: instEzgi.id,
        day_of_week: 'Pazartesi',
        start_time: '19:00',
        price_monthly: 1000,
        active: false,
        archived: true,
      },
    ];
    const { data: cls } = await supabase
      .from('classes')
      .insert(classes)
      .select();
    if (!cls) throw new Error('Failed to seed classes');

    // Map classes for easy access
    const salsaClass = cls.find((c) => c.name === 'Salsa Başlangıç (A)');
    const bachataClass = cls.find((c) => c.name === 'Bachata Orta (B)');
    const kizombaClass = cls.find((c) => c.name === 'Kizomba Lab');
    const archivedClass = cls.find((c) => c.name === 'Eski Dönem Salsa');

    // 4. MEMBERS
    const members = [
      {
        first_name: 'Ahmet',
        last_name: 'Yılmaz',
        phone: '5321001001',
        status: 'active',
        join_date: dayjs().subtract(3, 'month').format('YYYY-MM-DD'),
      },
      {
        first_name: 'Ayşe',
        last_name: 'Kara',
        phone: '5321001002',
        status: 'active',
        join_date: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
      },
      {
        first_name: 'Mehmet',
        last_name: 'Çelik',
        phone: '5321001003',
        status: 'active',
        join_date: dayjs().subtract(6, 'month').format('YYYY-MM-DD'),
      },
      {
        first_name: 'Zeynep',
        last_name: 'Demir',
        phone: '5321001004',
        status: 'frozen',
        join_date: dayjs().subtract(4, 'month').format('YYYY-MM-DD'),
      },
      {
        first_name: 'Can',
        last_name: 'Öz',
        phone: '5321001005',
        status: 'active',
        join_date: dayjs().subtract(2, 'month').format('YYYY-MM-DD'),
      },
    ];
    const { data: mems } = await supabase
      .from('members')
      .insert(members)
      .select();
    if (!mems) throw new Error('Failed to seed members');

    const [memAhmet, memAyse, memMehmet, memZeynep, memCan] = mems;

    // 5. ENROLLMENTS & PAYMENTS
    console.log('Creating enrollments and payments...');

    // Scenario 1: Ahmet - Salsa Student, Paid up to date
    // Joined 3 months ago. Paid 3 months. Next payment due next month.
    if (salsaClass) {
      // Enrollment
      await supabase.from('member_classes').insert({
        member_id: memAhmet.id,
        class_id: salsaClass.id,
        active: true,
        price: salsaClass.price_monthly,
        payment_interval: 1, // Monthly
        next_payment_date: dayjs()
          .add(1, 'month')
          .startOf('month')
          .format('YYYY-MM-DD'),
      });

      // 3 Payments
      const payments = [];
      for (let i = 0; i < 3; i++) {
        const date = dayjs().subtract(2 - i, 'month'); // -2, -1, 0 (Current)
        payments.push({
          member_id: memAhmet.id,
          class_id: salsaClass.id,
          amount: salsaClass.price_monthly,
          payment_date: date.format('YYYY-MM-DD'),
          period_start: date.startOf('month').format('YYYY-MM-DD'),
          period_end: date
            .add(1, 'month')
            .startOf('month')
            .format('YYYY-MM-DD'), // Period end is start of next month
          payment_method: 'Nakit',
          snapshot_price: salsaClass.price_monthly,
          snapshot_class_name: salsaClass.name,
          description: `${date.format('MMMM')} ödemesi`,
        });
      }
      await supabase.from('payments').insert(payments);
    }

    // Scenario 2: Ayşe - Bachata Student, New Joiner, Paid 1 month
    if (bachataClass) {
      await supabase.from('member_classes').insert({
        member_id: memAyse.id,
        class_id: bachataClass.id,
        active: true,
        price: bachataClass.price_monthly,
        payment_interval: 1,
        next_payment_date: dayjs()
          .startOf('month')
          .add(1, 'month')
          .format('YYYY-MM-DD'), // Paid for current month
      });

      await supabase.from('payments').insert({
        member_id: memAyse.id,
        class_id: bachataClass.id,
        amount: bachataClass.price_monthly,
        payment_date: dayjs().format('YYYY-MM-DD'),
        period_start: dayjs().startOf('month').format('YYYY-MM-DD'),
        period_end: dayjs()
          .startOf('month')
          .add(1, 'month')
          .format('YYYY-MM-DD'),
        payment_method: 'Kredi Kartı',
        snapshot_price: bachataClass.price_monthly,
        snapshot_class_name: bachataClass.name,
        description: 'İlk kayıt ödemesi',
      });
    }

    // Scenario 3: Mehmet - Multi-class (Salsa + Kizomba), Overdue on Kizomba
    // Salsa: Paid
    // Kizomba: Unpaid for this month
    if (salsaClass && kizombaClass) {
      // Salsa Enrollment (Paid)
      await supabase.from('member_classes').insert({
        member_id: memMehmet.id,
        class_id: salsaClass.id,
        active: true,
        price: salsaClass.price_monthly,
        next_payment_date: dayjs()
          .add(1, 'month')
          .startOf('month')
          .format('YYYY-MM-DD'),
      });
      // Salsa Payment
      await supabase.from('payments').insert({
        member_id: memMehmet.id,
        class_id: salsaClass.id,
        amount: salsaClass.price_monthly,
        payment_date: dayjs().format('YYYY-MM-DD'),
        period_start: dayjs().startOf('month').format('YYYY-MM-DD'),
        period_end: dayjs()
          .add(1, 'month')
          .startOf('month')
          .format('YYYY-MM-DD'),
        snapshot_price: salsaClass.price_monthly,
        snapshot_class_name: salsaClass.name,
        payment_method: 'Havale',
      });

      // Kizomba Enrollment (Overdue - Last payment was last month)
      await supabase.from('member_classes').insert({
        member_id: memMehmet.id,
        class_id: kizombaClass.id,
        active: true,
        price: kizombaClass.price_monthly,
        next_payment_date: dayjs().startOf('month').format('YYYY-MM-DD'), // Due NOW (start of this month)
      });
      // Kizomba Past Payment
      await supabase.from('payments').insert({
        member_id: memMehmet.id,
        class_id: kizombaClass.id,
        amount: kizombaClass.price_monthly,
        payment_date: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
        period_start: dayjs()
          .subtract(1, 'month')
          .startOf('month')
          .format('YYYY-MM-DD'),
        period_end: dayjs().startOf('month').format('YYYY-MM-DD'),
        snapshot_price: kizombaClass.price_monthly,
        snapshot_class_name: kizombaClass.name,
        payment_method: 'Nakit',
        description: 'Geçen ay ödemesi',
      });
    }

    // Scenario 4: Can - Legacy user with Custom Price
    // Enrolled in Salsa but pays old price (1000 TL instead of 1500)
    if (salsaClass) {
      await supabase.from('member_classes').insert({
        member_id: memCan.id,
        class_id: salsaClass.id,
        active: true,
        custom_price: 1000,
        price: 1000, // Legacy field
        payment_interval: 1,
        next_payment_date: dayjs().startOf('month').format('YYYY-MM-DD'), // Due now
      });
    }

    revalidatePath('/');
    console.log('✅ Database seeded successfully!');
    return { success: true };
  } catch (error: any) {
    console.error('Seed Error:', error);
    return { error: error.message };
  }
}
