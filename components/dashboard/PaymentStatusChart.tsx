'use client'

import { Card, Text, Group, Stack, RingProgress, Center } from '@mantine/core'
import { useState, useEffect } from 'react'
import { getPaymentStatusStats } from '@/actions/dashboard'

export function PaymentStatusChart() {
    const [data, setData] = useState<{ name: string; value: number; color: string }[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getPaymentStatusStats().then(res => {
            if (res.data) setData(res.data)
            setLoading(false)
        })
    }, [])

    const total = data.reduce((sum, item) => sum + item.value, 0)

    const sections = data.map((item) => ({
        value: (item.value / (total || 1)) * 100,
        color: item.color,
        tooltip: `${item.name}: ${item.value}`
    }))

    return (
        <Card withBorder radius="md" p="md">
            <Text fw={600} mb="lg">Ödeme Durumu Dağılımı</Text>
            
            <Group align="center" justify="center" gap="xl">
                <div style={{ position: 'relative' }}>
                     <RingProgress
                        size={160}
                        thickness={20}
                        roundCaps
                        sections={sections}
                        label={
                            <Center>
                                <Stack gap={0} align="center">
                                    <Text fw={700} size="xl">{total}</Text>
                                    <Text size="xs" c="dimmed">Aktif Üye</Text>
                                </Stack>
                            </Center>
                        }
                     />
                </div>
                
                <Stack gap="xs">
                    {data.map((item) => (
                        <Group key={item.name} gap="xs">
                            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: `var(--mantine-color-${item.color}-filled)` }}></div>
                            <Text size="sm">{item.name}</Text>
                            <Text size="sm" c="dimmed" fw={500}>{item.value}</Text>
                        </Group>
                    ))}
                </Stack>
            </Group>
        </Card>
    )
}
