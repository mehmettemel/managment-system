/**
 * Currency Input Component
 * Wrapper around Mantine NumberInput with preset formatting
 */

'use client'

import { NumberInput, NumberInputProps } from '@mantine/core'
import { forwardRef } from 'react'
import { IconCurrencyLira } from '@tabler/icons-react'

export const CurrencyInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (props, ref) => {
    return (
      <NumberInput
        ref={ref}
        thousandSeparator="."
        decimalSeparator=","
        suffix=" ₺"
        leftSection={<IconCurrencyLira size={16} />}
        min={0}
        allowNegative={false}
        {...props}
      />
    )
  }
)

CurrencyInput.displayName = 'CurrencyInput'
