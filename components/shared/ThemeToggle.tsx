/**
 * Theme Toggle Component
 * Toggles between light and dark mode with animation
 */

'use client'

import { ActionIcon, useMantineColorScheme, useComputedColorScheme, Group } from '@mantine/core'
import { IconSun, IconMoon } from '@tabler/icons-react'
import cx from 'clsx'
import classes from './ThemeToggle.module.css'

export function ThemeToggle() {
  const {setColorScheme } = useMantineColorScheme()
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true })

  return (
    <Group justify="center">
      <ActionIcon
        onClick={() => setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')}
        variant="default"
        size="lg"
        aria-label="Toggle color scheme"
      >
        <IconSun className={cx(classes.icon, classes.light)} stroke={1.5} />
        <IconMoon className={cx(classes.icon, classes.dark)} stroke={1.5} />
      </ActionIcon>
    </Group>
  )
}
