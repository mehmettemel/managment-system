'use client';

import { Tooltip, Text, TextProps } from '@mantine/core';

interface TruncatedTooltipProps extends TextProps {
  text: string | null | undefined;
  maxLength?: number;
}

export function TruncatedTooltip({
  text,
  maxLength = 20,
  ...textProps
}: TruncatedTooltipProps) {
  if (!text) return <Text {...textProps}>-</Text>;

  if (text.length <= maxLength) {
    return <Text {...textProps}>{text}</Text>;
  }

  return (
    <Tooltip label={text} withArrow multiline w={300}>
      <Text style={{ cursor: 'help' }} {...textProps}>
        {text.substring(0, maxLength)}...
      </Text>
    </Tooltip>
  );
}
