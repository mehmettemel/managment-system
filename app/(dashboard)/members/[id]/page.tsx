/**
 * Member Detail Page
 * /members/[id]
 */

import { AppShellLayout } from '@/components/layout/AppShell'
import { MemberDetailView } from '@/components/members/MemberDetailView'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MemberDetailPage({ params }: PageProps) {
  const { id } = await params
  const memberId = parseInt(id, 10)

  return (
    <AppShellLayout>
      <MemberDetailView memberId={memberId} />
    </AppShellLayout>
  )
}
