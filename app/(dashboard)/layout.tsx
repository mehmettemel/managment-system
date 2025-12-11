/**
 * Dashboard Layout
 * Wraps pages with AppShell
 */

import { AppShellLayout } from '@/components/layout/AppShell'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShellLayout>{children}</AppShellLayout>
}
