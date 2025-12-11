'use client'

import { Table, Button, Badge, Group, Text, Paper, Stack } from '@mantine/core'
import { processPayout } from '@/actions/finance'
import { showSuccess, showError } from '@/utils/notifications'
import { modals } from '@mantine/modals'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Instructor } from '@/types'
import { IconCash } from '@tabler/icons-react'
import { formatCurrency } from '@/utils/formatters'

interface PayableItem {
    instructor: Instructor
    totalAmount: number
    entryCount: number
}

export function InstructorPaymentsTable({ data }: { data: PayableItem[] }) {
    const router = useRouter()
    const [loadingMap, setLoadingMap] = useState<Record<number, boolean>>({})

    const handlePay = (item: PayableItem) => {
        modals.openConfirmModal({
            title: 'Ödeme Onayı',
            children: (
                <Text size="sm">
                    {item.instructor.first_name} {item.instructor.last_name} için <Text span fw={700}>{formatCurrency(item.totalAmount)}</Text> tutarındaki hakediş ödemesini onaylıyor musunuz?
                </Text>
            ),
            labels: { confirm: 'Ödeme Yap', cancel: 'İptal' },
            confirmProps: { color: 'green' },
            onConfirm: async () => {
                setLoadingMap(prev => ({ ...prev, [item.instructor.id]: true }))
                try {
                    const res = await processPayout(item.instructor.id, item.totalAmount)
                    if (res.error) {
                        showError(res.error)
                    } else {
                        showSuccess('Ödeme Başarılı')
                        router.refresh()
                    }
                } catch (err) {
                    showError('Hata oluştu')
                } finally {
                    setLoadingMap(prev => ({ ...prev, [item.instructor.id]: false }))
                }
            }
        })
    }

    if (data.length === 0) {
        return (
            <Paper p="xl" withBorder>
                <Text ta="center" c="dimmed">Şu an ödemesi gelen eğitmen bulunmamaktadır.</Text>
            </Paper>
        )
    }

    return (
        <Paper withBorder radius="md">
            <Table highlightOnHover>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Eğitmen</Table.Th>
                        <Table.Th>Bekleyen Hakediş Sayısı</Table.Th>
                        <Table.Th>Toplam Tutar</Table.Th>
                        <Table.Th></Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {data.map(item => (
                        <Table.Tr key={item.instructor.id}>
                            <Table.Td fw={500}>
                                {item.instructor.first_name} {item.instructor.last_name}
                            </Table.Td>
                            <Table.Td>
                                <Badge variant="light" size="lg">{item.entryCount} İşlem</Badge>
                            </Table.Td>
                            <Table.Td fw={700} fz="lg" c="green">
                                {formatCurrency(item.totalAmount)}
                            </Table.Td>
                            <Table.Td>
                                <Button 
                                    color="green" 
                                    leftSection={<IconCash size={16} />}
                                    onClick={() => handlePay(item)}
                                    loading={loadingMap[item.instructor.id]}
                                >
                                    Ödeme Yap
                                </Button>
                            </Table.Td>
                        </Table.Tr>
                    ))}
                </Table.Tbody>
            </Table>
        </Paper>
    )
}
