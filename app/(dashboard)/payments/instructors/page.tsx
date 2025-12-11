/**
 * Instructor Payments Page
 */

import { Title, Text, Stack } from '@mantine/core'
import { getPayableLedger } from '@/actions/finance'
import { InstructorPaymentsTable } from '@/components/payments/InstructorPaymentsTable'

export default async function InstructorPaymentsPage() {
  const { data: payableData } = await getPayableLedger()

  return (
    <Stack gap="xl">
      <div>
        <Title order={1}>Eğitmen Ödemeleri</Title>
        <Text c="dimmed">vadesi gelmiş eğitmen hakedişlerini görüntüleyin ve ödeyin.</Text>
      </div>

      <InstructorPaymentsTable data={payableData || []} />
    </Stack>
  )
}
