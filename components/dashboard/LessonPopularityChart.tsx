'use client'

import { Card, Text, Stack, Group, Progress } from '@mantine/core'
import { useState, useEffect } from 'react'
import { getLessonPopularityStats } from '@/actions/dashboard'

export function LessonPopularityChart() {
    const [data, setData] = useState<{ name: string; value: number }[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getLessonPopularityStats().then(res => {
            if (res.data) setData(res.data)
            setLoading(false)
        })
    }, [])
    
    // Calculate total students to show percentage
    const totalStudents = data.reduce((acc, curr) => acc + curr.value, 0)

    return (
        <Card withBorder radius="md" p="md">
             <Text fw={600} mb="lg">Ders Tipi Popülaritesi</Text>
             
             <Stack gap="md">
                {data.slice(0, 6).map((item, index) => {
                    const percentage = Math.round((item.value / (totalStudents || 1)) * 100)
                    return (
                        <div key={item.name}>
                            <Group justify="space-between" mb={6}>
                                 <Text size="sm" fw={500}>{item.name}</Text>
                                 <Group gap={6}>
                                     <Text size="sm" fw={600}>{item.value}</Text>
                                     <Text size="xs" c="dimmed">({percentage}%)</Text>
                                 </Group>
                            </Group>
                            <Progress 
                                value={percentage} 
                                color="blue"
                                size="sm"
                                radius="xl"
                            />
                        </div>
                    )
                })}
                {data.length === 0 && !loading && <Text c="dimmed" size="sm">Veri yok</Text>}
             </Stack>
        </Card>
    )
}
