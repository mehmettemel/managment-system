/**
 * Classes Page
 */

import { Title, Text, Stack } from '@mantine/core'
import { getClasses } from '@/actions/classes'
import { getInstructors } from '@/actions/instructors'
import { ClassesContent } from '@/components/classes/ClassesContent'

export default async function ClassesPage() {
  const [classesRes, instructorsRes] = await Promise.all([
    getClasses(),
    getInstructors(),
  ])

  return (
    <Stack gap="xl">
      <div>
        <Title order={1}>Dersler</Title>
        <Text c="dimmed">Ders programını ve sınıfları yönetin.</Text>
      </div>

      <ClassesContent
        initialClasses={classesRes.data || []}
        instructors={instructorsRes.data || []}
      />
    </Stack>
  )
}
