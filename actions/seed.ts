/**
 * Seed Database Action
 * Populates the database with demo data
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function seedDatabase() {
  const supabase = await createClient();

  // 1. Create Instructors
  const instructors = [
    {
      first_name: 'Ezgi',
      last_name: 'Zaman',
      specialty: 'Salsa',
      phone: '05551112233',
    },
    {
      first_name: 'Cem',
      last_name: 'Demir',
      specialty: 'Bachata',
      phone: '05554445566',
    },
    {
      first_name: 'Melis',
      last_name: 'Güneş',
      specialty: 'Kizomba',
      phone: '05557778899',
    },
  ];

  const { data: instData, error: instError } = await supabase
    .from('instructors')
    .insert(instructors)
    .select();

  if (instError) return { error: instError.message };

  // 2. Create Classes
  const classes = [
    {
      name: 'Başlangıç Salsa',
      instructor_id: instData[0].id,
      day_of_week: 'Salı',
      start_time: '19:00',
      duration_minutes: 60,
      price_monthly: 1500,
    },
    {
      name: 'Orta Seviye Bachata',
      instructor_id: instData[1].id,
      day_of_week: 'Perşembe',
      start_time: '20:30',
      duration_minutes: 90,
      price_monthly: 1800,
    },
    {
      name: 'Kizomba Workshop',
      instructor_id: instData[2].id,
      day_of_week: 'Pazar',
      start_time: '15:00',
      duration_minutes: 120,
      price_monthly: 500,
    },
  ];

  const { data: classData, error: classError } = await supabase
    .from('classes')
    .insert(classes)
    .select();

  if (classError) return { error: classError.message };

  // 3. Create Members
  const members = [
    {
      first_name: 'Ahmet',
      last_name: 'Yılmaz',
      phone: '05321234567',
      status: 'active',
      join_date: '2025-01-10',
    },
    {
      first_name: 'Ayşe',
      last_name: 'Kara',
      phone: '05339876543',
      status: 'active',
      join_date: '2025-02-15',
    },
    {
      first_name: 'Mehmet',
      last_name: 'Çelik',
      phone: '05441112233',
      status: 'active',
      join_date: '2024-12-05',
    },
    {
      first_name: 'Elif',
      last_name: 'Şahin',
      phone: '05559998877',
      status: 'frozen',
      join_date: '2025-01-20',
    },
    {
      first_name: 'Can',
      last_name: 'Öz',
      phone: '05353332211',
      status: 'active',
      join_date: '2024-11-01',
    },
  ];

  const { data: memberData, error: memberError } = await supabase
    .from('members')
    .insert(members)
    .select();

  if (memberError) return { error: memberError.message };

  // 4. Enroll Members to Classes & Add Payments
  for (let i = 0; i < memberData.length; i++) {
    const member = memberData[i];

    // Enroll in random class
    await supabase.from('member_classes').insert({
      member_id: member.id,
      class_id: classData[i % classData.length].id,
    });

    // Add payment
    await supabase.from('payments').insert({
      member_id: member.id,
      amount: 1500,
      payment_method: 'Nakit',
      payment_date: member.join_date,
      period_start: member.join_date,
      description: 'Kurs ücreti',
    });

    // Update last payment date
    await supabase
      .from('members')
      .update({
        last_payment_date: member.join_date,
      })
      .eq('id', member.id);
  }

  revalidatePath('/');
  return { success: true };
}
