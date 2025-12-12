/**
 * Member Detail Page
 * /members/[id]
 */

import { MemberDetailView } from '@/components/members/MemberDetailView';
import { getServerToday } from '@/utils/server-date-helper';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MemberDetailPage({ params }: PageProps) {
  const { id } = await params;
  const memberId = parseInt(id, 10);
  const effectiveDate = await getServerToday();

  return (
    <>
      <MemberDetailView memberId={memberId} effectiveDate={effectiveDate} />
    </>
  );
}
