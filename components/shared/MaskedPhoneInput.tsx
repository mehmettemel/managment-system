/**
 * Masked Phone Input
 * Uses react-imask with Mantine Input
 */

'use client'

import { IMaskInput } from 'react-imask'
import { InputBase, InputBaseProps } from '@mantine/core'
import { forwardRef } from 'react'
import { IconPhone } from '@tabler/icons-react'

// Define the mask format
// +90 5XX XXX XX XX
const PHONE_MASK = '+90 000 000 00 00'

interface MaskedPhoneInputProps extends InputBaseProps {
  // Add any custom props if needed
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export const MaskedPhoneInput = forwardRef<HTMLInputElement, MaskedPhoneInputProps>(
  (props, ref) => {
    return (
      <InputBase
        component={IMaskInput}
        mask={PHONE_MASK}
        placeholder="+90 5XX XXX XX XX"
        leftSection={<IconPhone size={16} />}
        {...props}
        // IMask specific props
        inputRef={ref} // Pass ref to the input element
        onAccept={(value: string, mask: any) => {
           // If we need to handle raw value, we can use mask.unmaskedValue
           // But usually onChange passed from Mantine form handles the masked value
           if (props.onChange) {
             // We need to simulate an event or just let it bubble?
             // IMaskInput triggers onChange with event.currentTarget.value = masked value
             // So standard props.onChange should work for storing the formatted string
           }
        }}
      />
    )
  }
)

MaskedPhoneInput.displayName = 'MaskedPhoneInput'
