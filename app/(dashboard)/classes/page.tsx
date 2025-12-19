/**
 * Classes Page
 */

import { Suspense } from 'react';
import { Title, Text, Stack, Loader, Center } from '@mantine/core';
import { getClasses } from '@/actions/classes';
import { getInstructors } from '@/actions/instructors';
import { getDanceTypes } from '@/actions/dance-types';
import { ClassesContent } from '@/components/classes/ClassesContent';

export default async function ClassesPage() {
  const [classesRes, instructorsRes, danceTypesRes] = await Promise.all([
    getClasses('all'), // Fetch all classes (active and archived)
    getInstructors(),
    getDanceTypes(),
  ]);

  return (
    <Stack gap="xl">
      <div>
        <Title order={1}>Dersler</Title>
        <Text c="dimmed">Ders programını ve sınıfları yönetin.</Text>
      </div>

      <Suspense
        fallback={
          <Center h={400}>
            <Loader />
          </Center>
        }
      >
        <ClassesContent
          initialClasses={classesRes.data || []}
          instructors={instructorsRes.data || []}
          danceTypes={danceTypesRes.data || []}
        />
      </Suspense>
    </Stack>
  );
}
