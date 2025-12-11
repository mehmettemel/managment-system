/**
 * Custom Hooks for Payment Operations
 */

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Payment } from '@/types'

/**
 * Hook to fetch payments for a specific member
 */
export function useMemberPayments(memberId: number | null) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!memberId) {
      setPayments([])
      setLoading(false)
      return
    }

    const fetchPayments = async () => {
      try {
        setLoading(true)
        const supabase = createClient()

        const { data, error }: any = await supabase
          .from('payments')
          .select('*')
          .eq('member_id', memberId)
          .order('payment_date', { ascending: false })

        if (error) throw error

        setPayments(data || [])
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bir hata oluştu')
      } finally {
        setLoading(false)
      }
    }

    fetchPayments()
  }, [memberId])

  return { payments, loading, error, refetch: () => {} }
}

/**
 * Hook to fetch recent payments across all members
 */
export function useRecentPayments(limit = 10) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true)
        const supabase = createClient()

        const { data, error }: any = await supabase
          .from('payments')
          .select('*')
          .order('payment_date', { ascending: false })
          .limit(limit)

        if (error) throw error

        setPayments(data || [])
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bir hata oluştu')
      } finally {
        setLoading(false)
      }
    }

    fetchPayments()
  }, [limit])

  return { payments, loading, error }
}
