/**
 * Currency Formatter Component
 * Uses react-number-format to display formatted currency
 */

'use client'

import { NumericFormat } from 'react-number-format'
import { Text, TextProps } from '@mantine/core'

interface CurrencyFormatterProps extends TextProps {
  value: number | string | null | undefined
}

export function CurrencyFormatter({ value, ...props }: CurrencyFormatterProps) {
  if (value === null || value === undefined) return <Text {...props}>-</Text>

  return (
    <NumericFormat
      value={value}
      displayType="text"
      thousandSeparator="."
      decimalSeparator=","
      suffix=" ₺"
      decimalScale={0} // No decimals as per request (1.200 ₺)
      renderText={(formattedValue) => <Text {...props}>{formattedValue}</Text>}
    />
  )
}
