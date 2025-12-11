/**
 * Member Detail Page
 * /members/[id]
 */


import { MemberDetailView } from '@/components/members/MemberDetailView';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MemberDetailPage({ params }: PageProps) {
  const { id } = await params;
  const memberId = parseInt(id, 10);

  return (
    <>
      <MemberDetailView memberId={memberId} />
    </>
  );
}
