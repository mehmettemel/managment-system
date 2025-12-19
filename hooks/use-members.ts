/**
 * Custom Hooks for Member Operations
 * Client-side hooks using React hooks and Supabase client
 */

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Member, MemberWithClasses } from '@/types';
import { getEnrollmentPaymentDates } from '@/actions/payments';

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

        // Fetch all members (except archived if not requested)
        let query: any = supabase
          .from('members')
          .select(
            '*, member_classes(*, classes(name), frozen_logs(id, end_date))'
          )
          .order('created_at', { ascending: false });

        // Only apply archived filter at DB level
        if (status === 'archived') {
          query = query.eq('status', 'archived');
        } else if (status !== 'all') {
          // For non-archived filters, exclude archived members
          query = query.neq('status', 'archived');
        }

        const { data, error } = await query;

        if (error) throw error;

        let membersData = (data as unknown as MemberWithClasses[]) || [];

        // Fetch payment dates for all enrollments
        const enrollmentIds = membersData.flatMap(
          (m) => m.member_classes?.map((mc) => mc.id) || []
        );

        if (enrollmentIds.length > 0) {
          const paymentDatesRes = await getEnrollmentPaymentDates(enrollmentIds);

          if (paymentDatesRes.data) {
            // Merge payment dates into member classes
            membersData.forEach((member) => {
              member.member_classes?.forEach((mc: any) => {
                const dates = paymentDatesRes.data![mc.id];
                if (dates) {
                  mc.last_payment_date = dates.last_payment_date;
                  // Also update first_payment_date if not set in DB
                  if (!mc.first_payment_date && dates.first_payment_date) {
                    mc.first_payment_date = dates.first_payment_date;
                  }
                }
              });
            });
          }

          // Fetch active frozen logs for all enrollments
          const { data: frozenLogs } = await supabase
            .from('frozen_logs')
            .select('member_class_id')
            .in('member_class_id', enrollmentIds)
            .is('end_date', null);

          const frozenEnrollmentIds = new Set(
            frozenLogs?.map((log: any) => log.member_class_id) || []
          );

          // Compute dynamic status for each member based on their enrollments
          membersData = membersData.map((member) => {
            // Skip computation for archived members
            if (member.status === 'archived') {
              return { ...member, computed_status: 'archived' };
            }

            const activeEnrollments =
              member.member_classes?.filter((mc) => mc.active) || [];

            if (activeEnrollments.length === 0) {
              // No active enrollments, keep original status
              return { ...member, computed_status: member.status };
            }

            // Check how many active enrollments are frozen
            const frozenActiveEnrollments = activeEnrollments.filter((mc) =>
              frozenEnrollmentIds.has(mc.id)
            );

            // If ALL active enrollments are frozen, member is frozen
            // If at least one active enrollment is not frozen, member is active
            const computedStatus =
              frozenActiveEnrollments.length === activeEnrollments.length
                ? 'frozen'
                : 'active';

            return { ...member, computed_status: computedStatus };
          });
        }

        // Apply status filter based on computed status
        if (status && status !== 'all' && status !== 'archived') {
          membersData = membersData.filter(
            (m: any) => m.computed_status === status
          );
        }

        setMembers(membersData);
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
