import { Suspense } from 'react';
import { Loader, Center } from '@mantine/core';
import { EnrollmentDetailView } from '@/components/enrollments/EnrollmentDetailView';
import { getServerToday } from '@/utils/server-date-helper';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function EnrollmentDetailPage({
  params,
}: {
  params: Promise<{ id: string; enrollmentId: string }>;
}) {
  const { id, enrollmentId } = await params;
  const enrollmentIdInt = parseInt(enrollmentId);
  const classId = parseInt(id);

  if (isNaN(enrollmentIdInt) || isNaN(classId)) return notFound();

  // Fetch enrollment data with fallback logic
  const supabase = await createClient();

  // 1. Try treating it as an Enrollment ID (Primary)
  let { data: enrollment } = await supabase
    .from('member_classes')
    .select('id, member_id')
    .eq('id', enrollmentIdInt)
    .maybeSingle();

  // 2. If not found, try treating it as a Member ID (Fallback/Legacy)
  // This handles keys from old navigation link or direct member access
  if (!enrollment) {
    const { data: fallbackEnrollment } = await supabase
      .from('member_classes')
      .select('id, member_id')
      .eq('member_id', enrollmentIdInt)
      .eq('class_id', classId)
      .eq('active', true) // Prefer active, but could relax this
      .maybeSingle();

    if (fallbackEnrollment) {
      enrollment = fallbackEnrollment;
    }
  }

  if (!enrollment) return notFound();

  const effectiveDate = await getServerToday();

  return (
    <Suspense
      fallback={
        <Center h={400}>
          <Loader />
        </Center>
      }
    >
      <EnrollmentDetailView
        memberId={enrollment.member_id}
        enrollmentId={enrollment.id}
        classId={classId}
        effectiveDate={effectiveDate}
      />
    </Suspense>
  );
}
