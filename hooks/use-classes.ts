/**
 * Custom Hooks for Class Operations
 */

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ClassWithInstructor } from '@/types';

/**
 * Hook to fetch all active classes with instructor info
 */
export function useClasses() {
  const [classes, setClasses] = useState<ClassWithInstructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const supabase = createClient();

        const { data, error }: any = await supabase
          .from('classes')
          .select(
            `
            *,
            instructors (*)
          `
          )
          .eq('active', true)
          .order('day_of_week')
          .order('start_time');

        if (error) throw error;

        setClasses((data as ClassWithInstructor[]) || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  return { classes, loading, error };
}

/**
 * Hook to fetch classes for a specific instructor
 */
export function useInstructorClasses(instructorId: number | null) {
  const [classes, setClasses] = useState<ClassWithInstructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!instructorId) {
      setClasses([]);
      setLoading(false);
      return;
    }

    const fetchClasses = async () => {
      try {
        setLoading(true);
        const supabase = createClient();

        const { data, error }: any = await supabase
          .from('classes')
          .select(
            `
            *,
            instructors (*)
          `
          )
          .eq('instructor_id', instructorId)
          .eq('active', true);

        if (error) throw error;

        setClasses((data as ClassWithInstructor[]) || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [instructorId]);

  return { classes, loading, error };
}
