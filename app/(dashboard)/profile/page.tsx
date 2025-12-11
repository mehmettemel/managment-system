/**
 * Profile Page (Placeholder)
 */

import { Title, Text, Stack } from '@mantine/core'
import { EmptyState } from '@/components/shared/EmptyState'
import { IconUserCircle } from '@tabler/icons-react'

export default function ProfilePage() {
  return (
    <Stack gap="xl">
      <div>
        <Title order={1}>Profil</Title>
        <Text c="dimmed">Profil bilgilerinizi görüntüleyin</Text>
      </div>

      <EmptyState
        title="Yakında Gelecek"
        description="Profil sayfası geliştirme aşamasında"
        icon={<IconUserCircle size={64} />}
      />
    </Stack>
  )
}
