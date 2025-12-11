/**
 * Status Badge Component
 * Color-coded badges for member/payment status
 */

import { Badge, BadgeProps } from '@mantine/core'
import type { MemberStatus } from '@/types'

interface StatusBadgeProps extends Omit<BadgeProps, 'children'> {
  status: MemberStatus | 'overdue' | 'paid'
}

export function StatusBadge({ status, ...props }: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return { color: 'green', label: 'Aktif' }
      case 'frozen':
        return { color: 'blue', label: 'Dondurulmuş' }
      case 'archived':
        return { color: 'gray', label: 'Arşiv' }
      case 'overdue':
        return { color: 'red', label: 'Gecikmiş' }
      case 'paid':
        return { color: 'teal', label: 'Ödendi' }
      default:
        return { color: 'gray', label: status }
    }
  }

  const { color, label } = getStatusConfig()

  return (
    <Badge color={color} variant="light" {...props}>
      {label}
    </Badge>
  )
}
