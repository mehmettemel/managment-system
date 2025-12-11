'use client'

import { useEffect, useState } from 'react'
import { Table, NumberInput, Text, Button, Group, Select, ActionIcon, Stack, Card } from '@mantine/core'
import { getDanceTypes } from '@/actions/dance-types'
import { IconPlus, IconTrash, IconX, IconCheck } from '@tabler/icons-react'
import type { DanceType } from '@/types'

interface RateItem {
    dance_type_id: number
    rate: number
}

interface Props {
    value: RateItem[]
    onChange: (value: RateItem[]) => void
}

export function InstructorSpecialtiesInput({ value, onChange }: Props) {
  const [types, setTypes] = useState<DanceType[]>([])
  const [isAdding, setIsAdding] = useState(false)
  
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [newRate, setNewRate] = useState<number | ''>('')

  useEffect(() => {
    getDanceTypes().then(res => {
        if (res.data) setTypes(res.data)
    })
  }, [])

  const handleAdd = () => {
      if (!selectedType || newRate === '') return
      const typeId = parseInt(selectedType)
      
      const exists = value.some(v => v.dance_type_id === typeId)
      if (exists) return 

      const newItem = { dance_type_id: typeId, rate: Number(newRate) }
      onChange([...value, newItem])
      
      handleCancel()
  }

  const handleCancel = () => {
      setIsAdding(false)
      setSelectedType(null)
      setNewRate('')
  }

  const handleDelete = (typeId: number) => {
      onChange(value.filter(v => v.dance_type_id !== typeId))
  }

  // Filter available types
  const availableTypes = types.filter(t => !value.some(v => v.dance_type_id === t.id))
  const selectData = availableTypes.map(t => ({ value: t.id.toString(), label: t.name }))

  // Helper to get name
  const getTypeName = (id: number) => types.find(t => t.id === id)?.name || '-'

  return (
    <Stack gap="xs">
        <Text fz="sm" fw={500}>Uzmanlık Alanları ve Komisyon Oranları</Text>
        
        {value.length > 0 && (
            <Table highlightOnHover withTableBorder variant="vertical">
                <Table.Tbody>
                    {value.map(item => (
                        <Table.Tr key={item.dance_type_id}>
                            <Table.Td>{getTypeName(item.dance_type_id)}</Table.Td>
                            <Table.Td>{item.rate}%</Table.Td>
                            <Table.Td w={40}>
                                <ActionIcon color="red" variant="subtle" size="sm" onClick={() => handleDelete(item.dance_type_id)}>
                                    <IconTrash size={14} />
                                </ActionIcon>
                            </Table.Td>
                        </Table.Tr>
                    ))}
                </Table.Tbody>
            </Table>
        )}

        {isAdding ? (
            <Card withBorder p="sm" radius="md">
                 <Stack gap="sm">
                    <Select 
                        label="Dans Türü"
                        placeholder="Seçiniz"
                        data={selectData}
                        value={selectedType}
                        onChange={setSelectedType}
                        searchable
                        nothingFoundMessage="Kullanılabilir tür kalmadı"
                        allowDeselect={false}
                    />
                    <NumberInput 
                        label="Komisyon Oranı (%)"
                        placeholder="50"
                        value={newRate}
                        onChange={(val) => setNewRate(val === '' ? '' : Number(val))}
                        min={0} max={100}
                        suffix="%"
                    />
                    <Group justify="flex-end">
                        <Button variant="subtle" size="xs" color="gray" onClick={handleCancel} leftSection={<IconX size={14} />}>
                            İptal
                        </Button>
                        <Button size="xs" onClick={handleAdd} disabled={!selectedType || newRate === ''} leftSection={<IconCheck size={14} />}>
                            Ekle
                        </Button>
                    </Group>
                 </Stack>
            </Card>
        ) : (
             <Button 
                variant="light" 
                leftSection={<IconPlus size={16} />} 
                onClick={() => setIsAdding(true)}
                size="xs"
                fullWidth
                style={{ borderStyle: 'dashed' }}
            >
                Uzmanlık Ekle
            </Button>
        )}
    </Stack>
  )
}
