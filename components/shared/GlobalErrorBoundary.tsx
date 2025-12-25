'use client';

import { ErrorBoundary } from 'react-error-boundary';
import {
  Button,
  Container,
  Group,
  Text,
  Title,
  Stack,
  Alert,
} from '@mantine/core';
import { IconAlertCircle, IconRefresh } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  const router = useRouter();

  return (
    <Container size="md" py={80}>
      <Stack align="center" gap="md">
        <IconAlertCircle size={50} color="var(--mantine-color-red-6)" />
        <Title order={2}>Bir şeyler ters gitti!</Title>
        <Text c="dimmed" ta="center" maw={500}>
          İşleminiz sırasında beklenmeyen bir hata oluştu. Lütfen sayfayı
          yenilemeyi deneyin veya hatayı bildirin.
        </Text>

        <Alert
          variant="light"
          color="red"
          title="Hata Mesajı"
          mt="md"
          w="100%"
          maw={600}
          icon={<IconAlertCircle size={16} />}
        >
          <Text size="sm" style={{ wordBreak: 'break-all' }}>
            {error.message}
          </Text>
        </Alert>

        <Group mt="lg">
          <Button
            leftSection={<IconRefresh size={16} />}
            onClick={() => {
              resetErrorBoundary();
              router.refresh();
            }}
          >
            Tekrar Dene
          </Button>
          <Button variant="subtle" onClick={() => (window.location.href = '/')}>
            Anasayfaya Dön
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}

export function GlobalErrorBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>{children}</ErrorBoundary>
  );
}
