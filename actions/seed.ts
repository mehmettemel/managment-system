'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import dayjs from 'dayjs';

/**
 * Seed Database with Integrated Test Data (v2)
 * Comprehensive testing suite for Simulation Mode
 */
export async function seedDatabase() {
  const supabase = await createClient();
  console.log('🌱 Seeding database...');

  try {
    // 1. CLEANUP
    console.log('Cleaning old data...');
    // Delete in order of dependencies
    await supabase.from('payments').delete().neq('id', 0);
    await supabase.from('member_logs').delete().neq('id', 0);
    await supabase.from('frozen_logs').delete().neq('id', 0);
    await supabase.from('member_classes').delete().neq('id', 0);
    await supabase.from('members').delete().neq('id', 0);
    await supabase.from('instructor_payouts').delete().neq('id', 0);
    await supabase.from('instructor_ledger').delete().neq('id', 0);
    await supabase.from('instructor_rates').delete().neq('id', 0);
    await supabase.from('classes').delete().neq('id', 0);
    await supabase.from('instructors').delete().neq('id', 0);

    // 2. INSTRUCTORS
    const instructors = [
      {
        first_name: 'Ezgi',
        last_name: 'Zaman',
        specialty: 'Salsa',
        phone: '5550000001',
        active: true,
      },
      {
        first_name: 'Cem',
        last_name: 'Demir',
        specialty: 'Bachata',
        phone: '5550000002',
        active: true,
      },
    ];
    const { data: insts } = await supabase
      .from('instructors')
      .insert(instructors)
      .select();
    if (!insts) throw new Error('Failed to seed instructors');
    const [instEzgi, instCem] = insts;

    // 3. CLASSES
    const classes = [
      {
        name: 'Salsa Başlangıç',
        instructor_id: instEzgi.id,
        day_of_week: 'Salı',
        start_time: '19:30',
        price_monthly: 1500,
        active: true,
      },
      {
        name: 'Bachata Orta',
        instructor_id: instCem.id,
        day_of_week: 'Perşembe',
        start_time: '20:30',
        price_monthly: 1800,
        active: true,
      },
      {
        name: 'Kizomba Advanced',
        instructor_id: instCem.id,
        day_of_week: 'Cuma',
        start_time: '21:00',
        price_monthly: 2000,
        active: true,
      },
      {
        name: 'Tango Gece (Arşiv)',
        instructor_id: instEzgi.id,
        day_of_week: 'Cumartesi',
        start_time: '22:00',
        price_monthly: 2200,
        active: false, // Archived class
      },
    ];
    const { data: cls } = await supabase
      .from('classes')
      .insert(classes)
      .select();
    if (!cls) throw new Error('Failed to seed classes');
    const [salsaClass, bachataClass, kizombaClass, tangoClass] = cls;

    // 4. MEMBERS & SCENARIOS
    console.log('Creating scenarios...');

    // Scenario 1: Ahmet Standart (Active, Paid)
    // Joined 3 months ago. Paid up to next month.
    await createMemberScenario(supabase, {
      firstName: 'Ahmet',
      lastName: 'Standart',
      phone: '5320000001',
      status: 'active',
      joinMonthOffset: -3,
      enrollments: [
        {
          classId: salsaClass.id,
          price: 1500,
          paidMonths: 4, // Paid 3 past + 1 current/future
        },
      ],
    });

    // Scenario 2: Ayşe Yeni (Active, New Joiner)
    // Joined today. Paid 1 month (Current).
    await createMemberScenario(supabase, {
      firstName: 'Ayşe',
      lastName: 'Yeni',
      phone: '5320000002',
      status: 'active',
      joinMonthOffset: 0,
      enrollments: [
        {
          classId: bachataClass.id,
          price: 1800,
          paidMonths: 1,
        },
      ],
    });

    // Scenario 3: Mehmet Gecikmiş (Active, Overdue 10 Days)
    // Joined 2 months ago. Paid first month. Second month overdue.
    // Due date was start of this month.
    await createMemberScenario(supabase, {
      firstName: 'Mehmet',
      lastName: 'Gecikmiş',
      phone: '5320000003',
      status: 'active',
      joinMonthOffset: -2,
      enrollments: [
        {
          classId: salsaClass.id,
          price: 1500,
          paidMonths: 1,
        },
      ],
    });

    // Scenario 4: Veli Çokgeç (Active, Long Overdue 3 Months)
    // Joined 5 months ago. Paid 2 months. 3 Months debt.
    await createMemberScenario(supabase, {
      firstName: 'Veli',
      lastName: 'Çokgeç',
      phone: '5320000004',
      status: 'active',
      joinMonthOffset: -5,
      enrollments: [
        {
          classId: bachataClass.id,
          price: 1800,
          paidMonths: 2,
        },
      ],
    });

    // Scenario 5: Zeynep Donuk (Frozen)
    // Joined 4 months ago. Paid 2 months. Frozen 1 month ago for 2 months.
    const zeynep = await createMemberScenario(supabase, {
      firstName: 'Zeynep',
      lastName: 'Donuk',
      phone: '5320000005',
      status: 'frozen',
      joinMonthOffset: -4,
      enrollments: [
        {
          classId: kizombaClass.id,
          price: 2000,
          paidMonths: 2,
        },
      ],
    });

    // Get Zeynep's enrollment
    const { data: zeynepEnrollment } = await supabase
      .from('member_classes')
      .select('id')
      .eq('member_id', zeynep.id)
      .eq('class_id', kizombaClass.id)
      .single();

    if (zeynepEnrollment) {
      const freezeStartDate = dayjs().subtract(1, 'month').format('YYYY-MM-DD');
      const freezeEndDate = dayjs().add(1, 'month').format('YYYY-MM-DD');

      // Add Frozen Log
      await supabase.from('frozen_logs').insert({
        member_id: zeynep.id,
        member_class_id: zeynepEnrollment.id,
        start_date: freezeStartDate,
        end_date: freezeEndDate,
        reason: 'Testing Frozen State',
        created_at: dayjs().subtract(1, 'month').toISOString(),
      });

      // Add freeze log to member_logs
      await supabase.from('member_logs').insert({
        member_id: zeynep.id,
        member_class_id: zeynepEnrollment.id,
        action_type: 'freeze',
        description: 'Üyelik süreli donduruldu',
        date: freezeStartDate,
        metadata: {
          start_date: freezeStartDate,
          end_date: freezeEndDate,
          reason: 'Testing Frozen State',
          is_indefinite: false,
        },
        created_at: freezeStartDate,
      });
    }

    // Scenario 6: Can Legacy (Legacy Price)
    // Joined 6 months ago. Pays 1000 TL instead of 1500. Paid up.
    await createMemberScenario(supabase, {
      firstName: 'Can',
      lastName: 'Legacy',
      phone: '5320000006',
      status: 'active',
      joinMonthOffset: -6,
      enrollments: [
        {
          classId: salsaClass.id,
          price: 1500,
          customPrice: 1000,
          paidMonths: 7,
        },
      ],
    });

    // Scenario 7: Burak Eski (Archived Member with Archived Class)
    // Joined 1 year ago. Left 6 months ago. Also has archived Tango class enrollment.
    const burak = await createMemberScenario(supabase, {
      firstName: 'Burak',
      lastName: 'Eski',
      phone: '5320000007',
      status: 'archived',
      joinMonthOffset: -12,
      enrollments: [
        {
          classId: salsaClass.id,
          price: 1500,
          paidMonths: 6,
          active: false,
        },
      ],
    });

    // Add archived Tango enrollment for Burak (class is also archived)
    const tangoJoinDate = dayjs().subtract(8, 'month').format('YYYY-MM-DD');
    const { data: burakTango } = await supabase
      .from('member_classes')
      .insert({
        member_id: burak.id,
        class_id: tangoClass.id,
        active: false,
        price: 2200,
        custom_price: 2200,
        payment_interval: 1,
        next_payment_date: dayjs(tangoJoinDate)
          .add(3, 'month')
          .format('YYYY-MM-DD'),
        first_payment_date: tangoJoinDate,
        created_at: tangoJoinDate,
      })
      .select()
      .single();

    if (burakTango) {
      // Create enrollment log for Tango
      await supabase.from('member_logs').insert({
        member_id: burak.id,
        member_class_id: burakTango.id,
        action_type: 'enrollment',
        description: 'Tango Gece (Arşiv) derse kayıt oluşturuldu',
        date: tangoJoinDate,
        metadata: { class_id: tangoClass.id },
        created_at: tangoJoinDate,
      });

      // Add 3 months of payments for Tango
      const tangoPayments = [];
      const tangoLogs = [];
      for (let i = 0; i < 3; i++) {
        const pStart = dayjs(tangoJoinDate).add(i, 'month');
        const paymentDate = pStart.format('YYYY-MM-DD');

        tangoPayments.push({
          member_id: burak.id,
          class_id: tangoClass.id,
          member_class_id: burakTango.id,
          amount: 2200,
          payment_date: paymentDate,
          period_start: paymentDate,
          period_end: pStart.add(1, 'month').format('YYYY-MM-DD'),
          payment_method: 'Nakit',
          payment_type: 'monthly',
          description: `${pStart.format('MMMM YYYY')} Ödemesi`,
        });

        tangoLogs.push({
          member_id: burak.id,
          member_class_id: burakTango.id,
          action_type: 'payment',
          description: `${pStart.format('MMMM YYYY')} ödemesi alındı`,
          date: paymentDate,
          metadata: {
            amount: 2200,
            payment_method: 'Nakit',
            period_start: paymentDate,
          },
          created_at: paymentDate,
        });
      }

      await supabase.from('payments').insert(tangoPayments);
      await supabase.from('member_logs').insert(tangoLogs);
    }

    // Scenario 8: Aslı Gelecek (Future Freeze Test Subject)
    // Active, Paid. User should test freezing her in simulation.
    await createMemberScenario(supabase, {
      firstName: 'Aslı',
      lastName: 'Gelecek',
      phone: '5320000008',
      status: 'active',
      joinMonthOffset: -1,
      enrollments: [
        {
          classId: kizombaClass.id,
          price: 2000,
          paidMonths: 2,
        },
      ],
    });

    // Scenario 9: Osman Dönüş (Re-join / Clean Slate)
    // Joined 2 years ago, left 1 year ago. Joined again TODAY (active).
    const osman = await createMemberScenario(supabase, {
      firstName: 'Osman',
      lastName: 'Dönüş',
      phone: '5320000009',
      status: 'active',
      joinMonthOffset: -24,
      enrollments: [
        // Old enrollment (Inactive)
        {
          classId: salsaClass.id,
          price: 1500,
          paidMonths: 12,
          active: false,
        },
        // New enrollment (Active) - Joined Today
        // Actually createMemberScenario doesn't support creating a second enrollment with different start date easily.
        // It uses joinMonthOffset for all.
        // We will manually insert the second enrollment below.
      ],
    });
    // Add new enrollment for Osman manually
    const osmanNewDate = dayjs().format('YYYY-MM-DD');
    await supabase.from('member_classes').insert({
      member_id: osman.id,
      class_id: salsaClass.id,
      active: true,
      price: 1500,
      custom_price: 1500,
      payment_interval: 1,
      next_payment_date: osmanNewDate, // Next payment is Today
      first_payment_date: osmanNewDate,
      created_at: osmanNewDate, // Started today
    });

    // Scenario 10: Ece Sabit (Grandfathering)
    // Joined 4 months ago. Price locked at 1000 TL (Current 1500).
    await createMemberScenario(supabase, {
      firstName: 'Ece',
      lastName: 'Sabit',
      phone: '5320000010',
      status: 'active',
      joinMonthOffset: -4,
      enrollments: [
        {
          classId: salsaClass.id, // Current price 1500
          price: 1500,
          customPrice: 1000, // Locked price
          paidMonths: 4, // Paid up to today. Next payment due today/tomorrow.
        },
      ],
    });

    // Scenario 11: Kaan Karma (Partial Freeze)
    // Active in Salsa and Bachata. Only Salsa is Frozen.
    const kaan = await createMemberScenario(supabase, {
      firstName: 'Kaan',
      lastName: 'Karma',
      phone: '5320000011',
      status: 'active', // Global status active because partial freeze
      joinMonthOffset: -3,
      enrollments: [
        { classId: salsaClass.id, price: 1500, paidMonths: 3 },
        { classId: bachataClass.id, price: 1800, paidMonths: 3 },
      ],
    });
    // Freeze Salsa Only
    // Need member_class_id for Salsa. Fetch it.
    const { data: kaanSalsa } = await supabase
      .from('member_classes')
      .select('id')
      .eq('member_id', kaan.id)
      .eq('class_id', salsaClass.id)
      .single();

    if (kaanSalsa) {
      const freezeStartDate = dayjs().subtract(5, 'day').format('YYYY-MM-DD');

      await supabase.from('frozen_logs').insert({
        member_id: kaan.id,
        member_class_id: kaanSalsa.id,
        start_date: freezeStartDate,
        end_date: null,
        reason: 'Partial Freeze Test',
        created_at: freezeStartDate,
      });

      // Add freeze log to member_logs
      await supabase.from('member_logs').insert({
        member_id: kaan.id,
        member_class_id: kaanSalsa.id,
        action_type: 'freeze',
        description: 'Üyelik süresiz donduruldu',
        date: freezeStartDate,
        metadata: {
          start_date: freezeStartDate,
          end_date: null,
          reason: 'Partial Freeze Test',
          is_indefinite: true,
        },
        created_at: freezeStartDate,
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

/**
 * Helper to create a member with enrollments and payments
 */
async function createMemberScenario(
  supabase: any,
  params: {
    firstName: string;
    lastName: string;
    phone: string;
    status: string;
    joinMonthOffset: number;
    enrollments: {
      classId: number;
      price: number;
      customPrice?: number;
      paidMonths: number;
      active?: boolean;
    }[];
  }
) {
  const joinDate = dayjs()
    .add(params.joinMonthOffset, 'month')
    .format('YYYY-MM-DD');

  // Create Member
  const { data: member } = await supabase
    .from('members')
    .insert({
      first_name: params.firstName,
      last_name: params.lastName,
      phone: params.phone,
      status: params.status,
      join_date: joinDate,
    })
    .select()
    .single();

  if (!member) throw new Error(`Failed to create member ${params.firstName}`);

  // Create Enrollments
  for (const enr of params.enrollments) {
    const effectivePrice = enr.customPrice ?? enr.price;
    // Calculate Next Payment Date
    const nextPaymentDate = dayjs(joinDate)
      .add(enr.paidMonths, 'month')
      .format('YYYY-MM-DD');

    // Calculate First Payment Date (if any payments made)
    const firstPaymentDate = enr.paidMonths > 0 ? joinDate : null;

    const { data: memberClass } = await supabase
      .from('member_classes')
      .insert({
        member_id: member.id,
        class_id: enr.classId,
        active: enr.active ?? true,
        price: enr.price,
        custom_price: enr.customPrice,
        payment_interval: 1,
        next_payment_date: nextPaymentDate,
        first_payment_date: firstPaymentDate,
        created_at: joinDate,
      })
      .select()
      .single();

    if (!memberClass) continue;

    // Create enrollment log
    await supabase.from('member_logs').insert({
      member_id: member.id,
      member_class_id: memberClass.id,
      action_type: 'enrollment',
      description: 'Derse kayıt oluşturuldu',
      date: joinDate,
      metadata: { class_id: enr.classId },
      created_at: joinDate,
    });

    // Create Payments History
    const payments = [];
    const memberLogs = [];
    for (let i = 0; i < enr.paidMonths; i++) {
      const pStart = dayjs(joinDate).add(i, 'month');
      const paymentDate = pStart.format('YYYY-MM-DD');

      payments.push({
        member_id: member.id,
        class_id: enr.classId,
        member_class_id: memberClass.id,
        amount: effectivePrice,
        payment_date: paymentDate,
        period_start: paymentDate,
        period_end: pStart.add(1, 'month').format('YYYY-MM-DD'),
        payment_method: 'Nakit',
        payment_type: 'monthly',
        description: `${pStart.format('MMMM YYYY')} Ödemesi`,
      });

      // Create payment log
      memberLogs.push({
        member_id: member.id,
        member_class_id: memberClass.id,
        action_type: 'payment',
        description: `${pStart.format('MMMM YYYY')} ödemesi alındı`,
        date: paymentDate,
        metadata: {
          amount: effectivePrice,
          payment_method: 'Nakit',
          period_start: paymentDate,
        },
        created_at: paymentDate,
      });
    }

    if (payments.length > 0) {
      await supabase.from('payments').insert(payments);
      await supabase.from('member_logs').insert(memberLogs);
    }
  }

  return member;
}
