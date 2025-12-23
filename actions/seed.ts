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
    // Delete in order of dependencies (child first)
    await supabase.from('expenses').delete().neq('id', 0);
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
    await supabase.from('dance_types').delete().neq('id', 0);

    // 2. DANCE TYPES
    const danceTypes = [
      { name: 'Salsa' },
      { name: 'Bachata' },
      { name: 'Kizomba' },
      { name: 'Tango' },
    ];
    const { data: dTypes } = await supabase
      .from('dance_types')
      .insert(danceTypes)
      .select();
    if (!dTypes) throw new Error('Failed to seed dance types');
    const [dtSalsa, dtBachata, dtKizomba, dtTango] = dTypes;

    // 3. INSTRUCTORS & RATES
    const instructors = [
      {
        first_name: 'Ezgi',
        last_name: 'Zaman',
        specialty: 'Salsa',
        phone: '5550000001',
        active: true,
        default_commission_rate: 20, // Default 20%
      },
      {
        first_name: 'Cem',
        last_name: 'Demir',
        specialty: 'Bachata',
        phone: '5550000002',
        active: true,
        default_commission_rate: 25, // Default 25%
      },
    ];
    const { data: insts } = await supabase
      .from('instructors')
      .insert(instructors)
      .select();
    if (!insts) throw new Error('Failed to seed instructors');
    const [instEzgi, instCem] = insts;

    // Insert Specialty Rates
    await supabase.from('instructor_rates').insert([
      {
        instructor_id: instEzgi.id,
        dance_type_id: dtSalsa.id,
        rate: 30, // Ezgi gets 30% for Salsa (Specialty)
      },
      {
        instructor_id: instCem.id,
        dance_type_id: dtBachata.id,
        rate: 35, // Cem gets 35% for Bachata (Specialty)
      },
      {
        instructor_id: instCem.id,
        dance_type_id: dtKizomba.id,
        rate: 30, // Cem gets 30% for Kizomba
      },
    ]);

    // 4. CLASSES
    const classes = [
      {
        name: 'Salsa Başlangıç',
        instructor_id: instEzgi.id,
        dance_type_id: dtSalsa.id,
        day_of_week: 'Salı',
        start_time: '19:30',
        duration_minutes: 60,
        price_monthly: 1500,
        instructor_commission_rate: 30, // Using Specialty Rate (Salsa)
        active: true,
      },
      {
        name: 'Bachata Orta',
        instructor_id: instCem.id,
        dance_type_id: dtBachata.id,
        day_of_week: 'Perşembe',
        start_time: '20:30',
        duration_minutes: 60,
        price_monthly: 1800,
        instructor_commission_rate: 35, // Using Specialty Rate (Bachata)
        active: true,
      },
      {
        name: 'Kizomba Advanced',
        instructor_id: instCem.id,
        dance_type_id: dtKizomba.id, // Explicitly linked
        day_of_week: 'Cuma',
        start_time: '21:00',
        duration_minutes: 90,
        price_monthly: 2000,
        instructor_commission_rate: null, // Using Default (25%) -> Null usually implies default fetching logic, or we store the actual rate?
        // In our recent logic, if 'default' is selected, we store NULL.
        // If 'specialty' is selected, we store THAT rate value hardcoded.
        // Let's assume user selected 'Default' here to test that flow.
        active: true,
      },
      {
        name: 'Tango Gece (Arşiv)',
        instructor_id: instEzgi.id,
        dance_type_id: dtTango.id,
        day_of_week: 'Cumartesi',
        start_time: '22:00',
        duration_minutes: 120,
        price_monthly: 2200,
        instructor_commission_rate: 20, // Manual custom rate (same as default but explicit)
        active: false, // Archived class
      },
    ];
    const { data: cls } = await supabase
      .from('classes')
      .insert(classes)
      .select();
    if (!cls) throw new Error('Failed to seed classes');
    const [salsaClass, bachataClass, kizombaClass, tangoClass] = cls;

    // 5. MEMBERS & SCENARIOS
    console.log('Creating scenarios...');

    // Scenario 1: Ahmet Standart (Active, Paid)
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
          paidMonths: 4,
        },
      ],
    });

    // Scenario 2: Ayşe Yeni (Active, New Joiner)
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
          paidMonths: 1, // Paid 1st month, 2nd is due
        },
      ],
    });

    // Scenario 4: Veli Çokgeç (Active, Long Overdue)
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
          paidMonths: 2, // 3 months overdue
        },
      ],
    });

    // Scenario 5: Zeynep Donuk (Frozen)
    const zeynep = await createMemberScenario(supabase, {
      firstName: 'Zeynep',
      lastName: 'Donuk',
      phone: '5320000005',
      status: 'frozen',
      joinMonthOffset: -4,
      enrollments: [{ classId: kizombaClass.id, price: 2000, paidMonths: 2 }],
    });
    // Add Frozen Log
    const { data: zEnr } = await supabase
      .from('member_classes')
      .select('id')
      .eq('member_id', zeynep.id)
      .single();
    if (zEnr) {
      const start = dayjs().subtract(1, 'month').format('YYYY-MM-DD');
      const end = dayjs().add(1, 'month').format('YYYY-MM-DD');
      await supabase.from('frozen_logs').insert({
        member_id: zeynep.id,
        member_class_id: zEnr.id,
        start_date: start,
        end_date: end,
        reason: 'Simülasyon Dondurma',
      });
      await supabase.from('member_logs').insert({
        member_id: zeynep.id,
        member_class_id: zEnr.id,
        action_type: 'freeze',
        description: 'Üyelik donduruldu',
        date: start,
        metadata: { start_date: start, end_date: end },
      });
    }

    // Scenario 6: Can Legacy (Custom Price)
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
          customPrice: 1000, // Locked legacy price
          paidMonths: 7,
        },
      ],
    });

    // Scenario 7: Burak Borçlu (Terminated with Debt) - NEW SCENARIO
    // Joined 3 months ago. Paid 1 month. Terminated yesterday with Debt.
    const burak = await createMemberScenario(supabase, {
      firstName: 'Burak',
      lastName: 'Borçlu',
      phone: '5320000007',
      status: 'archived',
      joinMonthOffset: -3,
      enrollments: [
        {
          classId: bachataClass.id,
          price: 1800,
          paidMonths: 1,
          active: false,
        },
      ],
    });
    // Add Termination Debt Expense manually
    const termDate = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    const { data: bEnr } = await supabase
      .from('member_classes')
      .select('id')
      .eq('member_id', burak.id)
      .single();
    if (bEnr) {
      // Create Debt Expense
      await supabase.from('expenses').insert({
        amount: 2500, // Random debt amount
        category: 'Diğer',
        description: `Ders Ayrılış - Tahsil Edilemeyen Borç (Burak Borçlu)`,
        date: termDate,
        member_id: burak.id,
        member_class_id: bEnr.id,
      });
      // Log termination
      await supabase.from('member_logs').insert({
        member_id: burak.id,
        member_class_id: bEnr.id,
        action_type: 'termination',
        description: 'Ders sonlandırıldı. Borçlu ayrıldı: 2500 TL',
        date: termDate,
        metadata: { financialAction: 'debt', debtAmount: 2500 },
      });
    }

    // 6. EXPENSES (Operational)
    console.log('Generating expenses...');
    const expenseData = [];
    const categories = [
      'Kira',
      'Elektrik',
      'Su',
      'İnternet',
      'Temizlik',
      'Maaş',
    ] as const;

    // Generate expenses for last 3 months
    for (let i = 0; i < 3; i++) {
      const month = dayjs().subtract(i, 'month');
      // Rent
      expenseData.push({
        category: 'Kira',
        amount: 15000,
        description: `${month.format('MMMM YYYY')} Kira Ödemesi`,
        date: month.date(1).format('YYYY-MM-DD'),
        member_id: null,
        member_class_id: null,
      });
      // Electricity
      expenseData.push({
        category: 'Elektrik',
        amount: Math.floor(Math.random() * 1000) + 500,
        description: `${month.format('MMMM YYYY')} Elektrik Faturası`,
        date: month.date(15).format('YYYY-MM-DD'),
        member_id: null,
        member_class_id: null,
      });
      // Cleaning
      expenseData.push({
        category: 'Temizlik',
        amount: 2000,
        description: `${month.format('MMMM YYYY')} Temizlik Malzemeleri`,
        date: month.date(10).format('YYYY-MM-DD'),
        member_id: null,
        member_class_id: null,
      });
    }
    await supabase.from('expenses').insert(expenseData);

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
        payment_interval: 1, // Default to 1 month
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
