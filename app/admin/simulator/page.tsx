/**
 * Simulation Dashboard
 * Allows manual time travel for testing purposes
 */

'use server';

import { Title, Text, Stack } from '@mantine/core';
import { getSimulationStatus } from '@/actions/simulation';
import { SimulationControls } from '@/components/admin/SimulationControls';
import { TestDataManager } from '@/components/admin/TestDataManager';
import { QuickActions } from '@/components/admin/QuickActions';
import { FreezeTestManager } from '@/components/admin/FreezeTestManager';

export default async function SimulatorPage() {
  const status = await getSimulationStatus();

  return (
    <Stack gap="xl">
      <div>
        <Title order={1}>Sistem Simülatörü</Title>
        <Text c="dimmed">
          Zaman yolculuğu yaparak sistemi test edin. "Sanal Bugün" tarihini
          ayarladığınızda, sistem tüm hesaplamaları o güne göre yapar.
        </Text>
      </div>

      <SimulationControls initialStatus={status} />

      <TestDataManager />

      <FreezeTestManager />

      <QuickActions />
    </Stack>
  );
}
