'use client';

import { MantineProvider } from '@mantine/core';
import { theme } from '../theme';

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MantineProvider theme={theme} forceColorScheme="dark">
      {children}
    </MantineProvider>
  );
}
