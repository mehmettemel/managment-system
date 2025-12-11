/**
 * Date Helper Functions
 * Utilities for date calculations and formatting
 */

import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import 'dayjs/locale/tr'

// Extend dayjs with plugins
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('tr')

/**
 * Payment cycle duration in days (4 weeks)
 */
export const PAYMENT_CYCLE_DAYS = 28

/**
 * Calculate next payment date (28 days from the given date)
 */
export function calculateNextPaymentDate(fromDate: Date | string): string {
  return dayjs(fromDate).add(PAYMENT_CYCLE_DAYS, 'day').format('YYYY-MM-DD')
}

/**
 * Calculate period end date for a payment
 */
export function calculatePeriodEndDate(startDate: Date | string): string {
  return dayjs(startDate)
    .add(PAYMENT_CYCLE_DAYS - 1, 'day')
    .format('YYYY-MM-DD')
}

/**
 * Check if a payment is overdue
 */
export function isPaymentOverdue(dueDate: Date | string | null): boolean {
  if (!dueDate) return false
  return dayjs(dueDate).isBefore(dayjs(), 'day')
}

/**
 * Get days until next payment
 * Returns negative number if overdue
 */
export function getDaysUntilPayment(dueDate: Date | string | null): number {
  if (!dueDate) return 0
  return dayjs(dueDate).diff(dayjs(), 'day')
}

/**
 * Format date for display (Turkish locale)
 */
export function formatDate(date: Date | string | null, format = 'DD MMMM YYYY'): string {
  if (!date) return '-'
  return dayjs(date).format(format)
}

/**
 * Format date as relative time (e.g., "3 gün önce", "5 gün sonra")
 */
export function formatRelativeDate(date: Date | string | null): string {
  if (!date) return '-'
  const diff = dayjs(date).diff(dayjs(), 'day')

  if (diff === 0) return 'Bugün'
  if (diff === 1) return 'Yarın'
  if (diff === -1) return 'Dün'
  if (diff > 0) return `${diff} gün sonra`
  return `${Math.abs(diff)} gün önce`
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  return dayjs().format('YYYY-MM-DD')
}

/**
 * Adjust next payment date for freeze period
 */
export function adjustPaymentDateForFreeze(
  currentDueDate: string | null,
  freezeDays: number
): string {
  if (!currentDueDate) {
    return calculateNextPaymentDate(getTodayDate())
  }
  return dayjs(currentDueDate).add(freezeDays, 'day').format('YYYY-MM-DD')
}

/**
 * Calculate number of days between two dates
 */
export function calculateDaysBetween(startDate: Date | string, endDate: Date | string): number {
  return dayjs(endDate).diff(dayjs(startDate), 'day')
}

/**
 * Validate if a date string is valid
 */
export function isValidDate(dateString: string): boolean {
  return dayjs(dateString).isValid()
}
