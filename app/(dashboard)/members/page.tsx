import { getServerToday } from '@/utils/server-date-helper';
import MembersContent from '@/components/members/MembersContent';

export default async function MembersPage() {
  const effectiveDate = await getServerToday();

  return <MembersContent effectiveDate={effectiveDate} />;
}
