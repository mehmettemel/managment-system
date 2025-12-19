/**
 * App Shell Layout
 * Main layout with sidebar navigation
 */

'use client';

import { useState } from 'react';
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
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconHome,
  IconUsers,
  IconCreditCard,
  IconSchool,
  IconChalkboard,
  IconUserCircle,
  IconSettings,
  IconLogout,
  IconHelp,
} from '@tabler/icons-react';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { GlobalSearch } from '@/components/shared/GlobalSearch';
import { usePathname, useRouter } from 'next/navigation';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: string | number;
  children?: NavItem[];
}

const mainNavItems: NavItem[] = [
  { label: 'Dashboard', icon: <IconHome size={20} />, href: '/' },
  { label: 'Üyeler', icon: <IconUsers size={20} />, href: '/members' },
  { label: 'Finans', icon: <IconCreditCard size={20} />, href: '/finance' },
  { label: 'Dersler', icon: <IconSchool size={20} />, href: '/classes' },
  {
    label: 'Eğitmenler',
    icon: <IconChalkboard size={20} />,
    href: '#instructors', // Dummy href for parent
    children: [
      {
        label: 'Liste',
        href: '/instructors',
        icon: <IconChalkboard size={16} />,
      },
      {
        label: 'Ödemeler',
        href: '/payments/instructors',
        icon: <IconCreditCard size={16} />,
      },
    ],
  },
  { label: 'Yardım', icon: <IconHelp size={20} />, href: '/help' },
];

const bottomNavItems: NavItem[] = [
  { label: 'Profil', icon: <IconUserCircle size={20} />, href: '/profile' },
  {
    label: 'Ayarlar',
    icon: <IconSettings size={20} />,
    href: '#settings',
    children: [
      { label: 'Genel', href: '/settings', icon: <IconSettings size={16} /> },
      {
        label: 'Dans Türleri',
        href: '/settings/dance-types',
        icon: <IconSchool size={16} />,
      },
    ],
  },
];

export function AppShellLayout({ children }: { children: React.ReactNode }) {
  const [opened, { toggle, close }] = useDisclosure();
  const pathname = usePathname();
  const router = useRouter();

  const handleNavClick = (href: string) => {
    router.push(href);
    close();
  };

  const renderNavItem = (item: NavItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const isActive =
      item.href === '/'
        ? pathname === '/'
        : pathname.startsWith(item.href) &&
          item.href !== '#' &&
          !item.href.startsWith('#') &&
          // Special case: /finance should not match /payments/instructors
          !(
            item.href === '/finance' &&
            pathname.startsWith('/payments/instructors')
          );
    // Check if any child is active to open parent
    const isChildActive =
      hasChildren &&
      item.children?.some(
        (c) => pathname === c.href || pathname.startsWith(c.href)
      );

    return (
      <NavLink
        key={item.label}
        label={item.label}
        leftSection={item.icon}
        active={isActive || isChildActive}
        defaultOpened={!!isChildActive}
        onClick={() => {
          if (!hasChildren) handleNavClick(item.href);
        }}
        variant="subtle"
        rightSection={
          item.badge ? (
            <Text size="xs" c="dimmed">
              {item.badge}
            </Text>
          ) : undefined
        }
      >
        {hasChildren &&
          item.children?.map((child) => (
            <NavLink
              key={child.href}
              label={child.label}
              leftSection={child.icon}
              active={child.href === pathname}
              onClick={() => handleNavClick(child.href)}
              variant="subtle"
              style={{ paddingLeft: 20 }} // Simple indentation
            />
          ))}
      </NavLink>
    );
  };

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
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <Group gap="xs">
              <ThemeIcon
                size="lg"
                variant="gradient"
                gradient={{ from: 'orange', to: 'red' }}
              >
                <IconSchool size={20} />
              </ThemeIcon>
              <Text fw={700} size="lg">
                Dans Okulu
              </Text>
            </Group>
          </Group>

          <Group>
            <GlobalSearch />
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
          <Stack gap="xs">{mainNavItems.map(renderNavItem)}</Stack>
        </MantineAppShell.Section>

        <MantineAppShell.Section>
          <Stack gap="xs">
            {bottomNavItems.map(renderNavItem)}
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
  );
}
