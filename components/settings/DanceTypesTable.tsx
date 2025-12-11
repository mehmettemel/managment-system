'use client'

import { Table, Button, Group, TextInput, Modal, ActionIcon, Stack, Title, Text } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useState } from 'react'
import { IconEdit, IconTrash, IconPlus } from '@tabler/icons-react'
import { createDanceType, updateDanceType, deleteDanceType } from '@/actions/dance-types'
import { showSuccess, showError } from '@/utils/notifications'
import { modals } from '@mantine/modals'
import { useRouter } from 'next/navigation'
import type { DanceType } from '@/types'

export function DanceTypesTable({ data }: { data: DanceType[] }) {
    const [opened, setOpened] = useState(false)
    const [editingType, setEditingType] = useState<DanceType | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const form = useForm({
        initialValues: { name: '' },
        validate: {
            name: (value) => value.trim().length < 2 ? 'En az 2 karakter olmalı' : null
        }
    })

    const handleOpen = (type: DanceType | null = null) => {
        setEditingType(type)
        form.setValues({ name: type?.name || '' })
        setOpened(true)
    }

    const  handleClose = () => {
        setOpened(false)
        setEditingType(null)
        form.reset()
    }

    const handleSubmit = async (values: typeof form.values) => {
        setLoading(true)
        try {
            let res
            if (editingType) {
                res = await updateDanceType(editingType.id, values.name)
            } else {
                res = await createDanceType(values.name)
            }

            if (res.error) {
                showError(res.error)
            } else {
                showSuccess(editingType ? 'Güncellendi' : 'Oluşturuldu')
                handleClose()
                router.refresh()
            }
        } catch (error) {
            showError('Hata oluştu')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = (id: number) => {
        modals.openConfirmModal({
            title: 'Silme Onayı',
            children: (
                <Text size="sm">
                   Bu dans türünü silmek istediğinize emin misiniz?
                </Text>
            ),
            labels: { confirm: 'Sil', cancel: 'İptal' },
            confirmProps: { color: 'red' },
            onConfirm: async () => {
                try {
                    const res = await deleteDanceType(id)
                    if (res.error) {
                        showError(res.error)
                    } else {
                        showSuccess('Silindi')
                        router.refresh()
                    }
                } catch (err) {
                    showError('Hata oluştu')
                }
            }
        })
    }

    return (
        <Stack>
            <Group justify="space-between">
                <Title order={2} size="h3">Dans Kökenleri</Title>
                <Button leftSection={<IconPlus size={16} />} onClick={() => handleOpen()}>
                    Yeni Ekle
                </Button>
            </Group>

            <Table withTableBorder withColumnBorders>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Ad</Table.Th>
                        <Table.Th>Slug</Table.Th>
                        <Table.Th w={100}>İşlemler</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {data.map(type => (
                        <Table.Tr key={type.id}>
                            <Table.Td>{type.name}</Table.Td>
                            <Table.Td c="dimmed">{type.slug}</Table.Td>
                            <Table.Td>
                                <Group gap={4}>
                                    <ActionIcon variant="subtle" color="blue" onClick={() => handleOpen(type)}>
                                        <IconEdit size={16} />
                                    </ActionIcon>
                                    <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(type.id)}>
                                        <IconTrash size={16} />
                                    </ActionIcon>
                                </Group>
                            </Table.Td>
                        </Table.Tr>
                    ))}
                    {data.length === 0 && (
                        <Table.Tr>
                            <Table.Td colSpan={3} ta="center" c="dimmed">
                                Kayıt bulunamadı.
                            </Table.Td>
                        </Table.Tr>
                    )}
                </Table.Tbody>
            </Table>

            <Modal opened={opened} onClose={handleClose} title={editingType ? 'Düzenle' : 'Yeni Ekle'} centered>
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <TextInput 
                        label="Dans Türü Adı" 
                        placeholder="Örn: Salsa" 
                        required 
                        data-autofocus 
                        {...form.getInputProps('name')}
                    />
                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={handleClose}>İptal</Button>
                        <Button type="submit" loading={loading}>Kaydet</Button>
                    </Group>
                </form>
            </Modal>
        </Stack>
    )
}
