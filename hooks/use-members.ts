/**
 * Custom Hooks for Member Operations
 * Client-side hooks using React hooks and Supabase client
 */

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Member, MemberWithClasses } from '@/types';

/**
 * Hook to fetch all members with optional real-time updates
 */
export function useMembers(status?: string, refreshTrigger?: number) {
  const [members, setMembers] = useState<MemberWithClasses[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const supabase = createClient();

        let query: any = supabase
          .from('members')
          .select('*, member_classes(*, classes(name))')
          .order('created_at', { ascending: false });

        if (status && status !== 'all') {
          query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) throw error;

        setMembers((data as unknown as MemberWithClasses[]) || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [status, refreshTrigger]);

  return { members, loading, error };
}

/**
 * Hook to fetch a single member with classes
 */
export function useMember(id: number | null) {
  const [member, setMember] = useState<MemberWithClasses | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setMember(null);
      setLoading(false);
      return;
    }

    const fetchMember = async () => {
      try {
        setLoading(true);
        const supabase = createClient();

        const { data, error }: any = await supabase
          .from('members')
          .select(
            `
            *,
            member_classes (
              *,
              classes (*)
            )
          `
          )
          .eq('id', id)
          .single();

        if (error) throw error;

        setMember(data as MemberWithClasses);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [id]);

  return { member, loading, error };
}

/**
 * Hook to get members with overdue payments
 */
export function useOverdueMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOverdueMembers = async () => {
      try {
        setLoading(true);
        const supabase = createClient();
        const today = new Date().toISOString().split('T')[0];

        // 1. Find overdue enrollments first
        // We select distinct member_id ideally, but JS client select distinct is tricky.
        // We fetch minimal data.
        const { data: overdueClasses, error: classError } = await supabase
          .from('member_classes')
          .select('member_id')
          .eq('active', true)
          .lt('next_payment_date', today);

        if (classError) throw classError;

        if (!overdueClasses || overdueClasses.length === 0) {
          setMembers([]);
          return;
        }

        // 2. Get unique distinct IDs
        const uniqueMemberIds = [
          ...new Set(overdueClasses.map((item) => item.member_id)),
        ];

        // 3. Fetch members
        const { data, error }: any = await supabase
          .from('members')
          .select('*')
          .in('id', uniqueMemberIds)
          .eq('status', 'active')
          .order('first_name');

        if (error) throw error;

        setMembers(data || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchOverdueMembers();
  }, []);

  return { members, loading, error };
}
