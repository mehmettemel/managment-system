'use client';

import { useEffect } from 'react';
import {
  ColorSchemeScript,
  MantineProvider,
  Button,
  Container,
  Title,
  Text,
  Stack,
} from '@mantine/core';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="tr">
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider>
          <Container size="md" py={100}>
            <Stack align="center" gap="md">
              <Title>Kritik Uygulama Hatası</Title>
              <Text>Uygulama yüklenirken kritik bir hata oluştu.</Text>
              <Text size="sm" c="dimmed">
                {error.message}
              </Text>
              <Button onClick={() => reset()}>Tekrar Dene</Button>
            </Stack>
          </Container>
        </MantineProvider>
      </body>
    </html>
  );
}
