'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import dayjs from 'dayjs';
import { getServerToday } from '@/utils/server-date-helper';

/**
 * Generate a random member
 */
export async function createRandomMember() {
  try {
    const supabase = await createClient();
    const today = await getServerToday();

    const firstNames = [
      'Can',
      'Merve',
      'Emre',
      'Selin',
      'Burak',
      'Elif',
      'Deniz',
      'Cem',
    ];
    const lastNames = [
      'Yılmaz',
      'Kaya',
      'Demir',
      'Çelik',
      'Şahin',
      'Yıldız',
      'Öz',
      'Aydın',
    ];

    const randomFirst =
      firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLast = lastNames[Math.floor(Math.random() * lastNames.length)];
    const randomPhone =
      '5' + Math.floor(Math.random() * 900000000 + 100000000).toString();

    const { data, error } = await supabase
      .from('members')
      .insert({
        first_name: `${randomFirst} (Test)`,
        last_name: randomLast,
        phone: randomPhone,
        join_date: today,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/members');
    return { success: true, data };
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Generate a random class
 */
export async function createRandomClass() {
  try {
    const supabase = await createClient();

    // Get Any Instructor
    const { data: instructors } = await supabase
      .from('instructors')
      .select('id');
    if (!instructors || instructors.length === 0)
      throw new Error('No instructors found');
    const randomInstId =
      instructors[Math.floor(Math.random() * instructors.length)].id;

    const styles = ['Salsa', 'Bachata', 'Kizomba', 'Tango', 'Cha Cha', 'Rumba'];
    const levels = ['Beginner', 'Intermediate', 'Advanced', 'Open Level'];
    const days = [
      'Pazartesi',
      'Salı',
      'Çarşamba',
      'Perşembe',
      'Cuma',
      'Cumartesi',
      'Pazar',
    ];

    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    const randomLevel = levels[Math.floor(Math.random() * levels.length)];
    const randomDay = days[Math.floor(Math.random() * days.length)];
    const randomHour = Math.floor(Math.random() * (22 - 18) + 18); // 18-22

    const { data, error } = await supabase
      .from('classes')
      .insert({
        name: `${randomStyle} ${randomLevel} (Test)`,
        instructor_id: randomInstId,
        day_of_week: randomDay,
        start_time: `${randomHour}:00`,
        price_monthly: Math.floor(Math.random() * (2500 - 1000) + 1000), // 1000-2500
        active: true,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/classes');
    return { success: true, data };
  } catch (error: any) {
    return { error: error.message };
  }
}
