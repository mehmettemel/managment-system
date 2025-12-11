/**
 * Mantine Theme Configuration
 * Orange color scheme
 */

import { createTheme } from '@mantine/core'

export const theme = createTheme({
  primaryColor: 'orange',
  defaultRadius: 'md',
  fontFamily: 'var(--font-geist-sans)',
  headings: {
    fontFamily: 'var(--font-geist-sans)',
    fontWeight: '700',
  },
  colors: {
    orange: [
      '#fff4e6',
      '#ffe8cc',
      '#ffd8a8',
      '#ffc078',
      '#ffa94d',
      '#ff922b',
      '#fd7e14',
      '#f76707',
      '#e8590c',
      '#d9480f',
    ],
  },
})
