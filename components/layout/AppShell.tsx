/**
 * App Shell Layout
 * Main layout with sidebar navigation
 */

'use client'

import { useState } from 'react'
import {
  AppShell as MantineAppShell,
  Burger,
  Group,
  NavLink,
  Text,
  ThemeIcon,
  UnstyledButton,
  Stack,
  Box,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconHome,
  IconUsers,
  IconCreditCard,
  IconSchool,
  IconChalkboard,
  IconUserCircle,
  IconSettings,
  IconLogout,
} from '@tabler/icons-react'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { usePathname, useRouter } from 'next/navigation'

interface NavItem {
  label: string
  icon: React.ReactNode
  href: string
  badge?: string | number
}

const mainNavItems: NavItem[] = [
  { label: 'Dashboard', icon: <IconHome size={20} />, href: '/' },
  { label: 'Üyeler', icon: <IconUsers size={20} />, href: '/members' },
  { label: 'Ödemeler', icon: <IconCreditCard size={20} />, href: '/payments' },
  { label: 'Dersler', icon: <IconSchool size={20} />, href: '/classes' },
  { label: 'Eğitmenler', icon: <IconChalkboard size={20} />, href: '/instructors' },
]

const bottomNavItems: NavItem[] = [
  { label: 'Profil', icon: <IconUserCircle size={20} />, href: '/profile' },
  { label: 'Ayarlar', icon: <IconSettings size={20} />, href: '/settings' },
]

export function AppShellLayout({ children }: { children: React.ReactNode }) {
  const [opened, { toggle, close }] = useDisclosure()
  const pathname = usePathname()
  const router = useRouter()

  const handleNavClick = (href: string) => {
    router.push(href)
    close()
  }

  return (
    <MantineAppShell
      header={{ height: 60 }}
      navbar={{
        width: 280,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      {/* Header */}
      <MantineAppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Group gap="xs">
              <ThemeIcon size="lg" variant="gradient" gradient={{ from: 'orange', to: 'red' }}>
                <IconSchool size={20} />
              </ThemeIcon>
              <Text fw={700} size="lg">
                Dans Okulu
              </Text>
            </Group>
          </Group>

          <Group>
            <ThemeToggle />
            <UnstyledButton>
              <Group gap="xs">
                <IconUserCircle size={24} />
                <Box visibleFrom="sm">
                  <Text size="sm" fw={500}>
                    Admin
                  </Text>
                </Box>
              </Group>
            </UnstyledButton>
          </Group>
        </Group>
      </MantineAppShell.Header>

      {/* Navbar */}
      <MantineAppShell.Navbar p="md">
        <MantineAppShell.Section grow>
          <Stack gap="xs">
            {mainNavItems.map((item) => (
              <NavLink
                key={item.href}
                label={item.label}
                leftSection={item.icon}
                active={pathname === item.href}
                onClick={() => handleNavClick(item.href)}
                variant="subtle"
                rightSection={
                  item.badge ? (
                    <Text size="xs" c="dimmed">
                      {item.badge}
                    </Text>
                  ) : undefined
                }
              />
            ))}
          </Stack>
        </MantineAppShell.Section>

        <MantineAppShell.Section>
          <Stack gap="xs">
            {bottomNavItems.map((item) => (
              <NavLink
                key={item.href}
                label={item.label}
                leftSection={item.icon}
                active={pathname === item.href}
                onClick={() => handleNavClick(item.href)}
                variant="subtle"
              />
            ))}
            <NavLink
              label="Çıkış Yap"
              leftSection={<IconLogout size={20} />}
              onClick={() => console.log('Logout')}
              variant="subtle"
              c="red"
            />
          </Stack>
        </MantineAppShell.Section>
      </MantineAppShell.Navbar>

      {/* Main Content */}
      <MantineAppShell.Main>{children}</MantineAppShell.Main>
    </MantineAppShell>
  )
}
