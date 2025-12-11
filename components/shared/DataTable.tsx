/**
 * Reusable DataTable Component
 * Features: Sorting, Filtering, Checkbox Selection, Pagination, Search
 */

'use client'

import { useState, useMemo } from 'react'
import {
  Table,
  Checkbox,
  TextInput,
  ActionIcon,
  Group,
  Text,
  Pagination,
  Paper,
  Stack,
  Select,
  Badge,
  rem,
  Box,
  ScrollArea,
} from '@mantine/core'
import { IconSearch, IconSortAscending, IconSortDescending, IconSelector } from '@tabler/icons-react'

export interface DataTableColumn<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  searchable?: boolean
  render?: (item: T) => React.ReactNode
  width?: string | number
}

interface DataTableProps<T> {
  data: T[]
  columns: DataTableColumn<T>[]
  onRowClick?: (item: T) => void
  onSelectionChange?: (selectedItems: T[]) => void
  enableSelection?: boolean
  pageSize?: number
  loading?: boolean
  emptyText?: string
  idField?: keyof T
  filters?: React.ReactNode
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  onSelectionChange,
  enableSelection = false,
  pageSize = 10,
  loading = false,
  emptyText = 'Kayıt bulunamadı',
  idField = 'id' as keyof T,
  filters,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedRows, setSelectedRows] = useState<Set<any>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchQuery) return data

    return data.filter((item) => {
      return columns.some((column) => {
        if (!column.searchable) return false
        const value = item[column.key as keyof T]
        return String(value).toLowerCase().includes(searchQuery.toLowerCase())
      })
    })
  }, [data, searchQuery, columns])

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortBy) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortBy]
      const bValue = b[sortBy]

      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      let comparison = 0
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue, 'tr')
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue
      } else {
        comparison = String(aValue).localeCompare(String(bValue), 'tr')
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [filteredData, sortBy, sortOrder])

  // Paginate data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return sortedData.slice(start, end)
  }, [sortedData, currentPage, pageSize])

  const totalPages = Math.ceil(sortedData.length / pageSize)

  // Handle sort
  const handleSort = (columnKey: string) => {
    if (sortBy === columnKey) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(columnKey)
      setSortOrder('asc')
    }
  }

  // Handle selection
  const toggleRow = (id: any) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(id)) {
        newSelected.delete(id)
    } else {
    newSelected.add(id)
    }
    setSelectedRows(newSelected)

    if (onSelectionChange) {
      const selectedItems = data.filter((item) => newSelected.has(item[idField]))
      onSelectionChange(selectedItems)
    }
  }

  const toggleAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set())
      onSelectionChange?.([])
    } else {
      const allIds = new Set(paginatedData.map((item) => item[idField]))
      setSelectedRows(allIds)
      const selectedItems = data.filter((item) => allIds.has(item[idField]))
      onSelectionChange?.(selectedItems)
    }
  }

  return (
    <Paper withBorder radius="md">
      <Stack gap={0}>
        {/* Search Bar */}
        <Box p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
          <Group justify="space-between">
            <Group gap="xs">
                <TextInput
                placeholder="Ara..."
                leftSection={<IconSearch size={16} />}
                value={searchQuery}
                onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                }}
                style={{ width: 300 }}
                />
                {filters}
            </Group>
            <Badge variant="light" size="lg">
              {sortedData.length} kayıt
            </Badge>
          </Group>
        </Box>

        {/* Table */}
        <ScrollArea>
          <Table horizontalSpacing="md" verticalSpacing="sm" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                {enableSelection && (
                  <Table.Th style={{ width: 40 }}>
                    <Checkbox
                      checked={
                        paginatedData.length > 0 &&
                        selectedRows.size === paginatedData.length
                      }
                      indeterminate={
                        selectedRows.size > 0 && selectedRows.size < paginatedData.length
                      }
                      onChange={toggleAll}
                    />
                  </Table.Th>
                )}
                {columns.map((column) => (
                  <Table.Th
                    key={String(column.key)}
                    style={{
                      cursor: column.sortable ? 'pointer' : 'default',
                      width: column.width,
                    }}
                    onClick={() => column.sortable && handleSort(String(column.key))}
                  >
                    <Group gap="xs" wrap="nowrap">
                      <Text fw={600} size="sm">
                        {column.label}
                      </Text>
                      {column.sortable && (
                        <ActionIcon
                          variant="transparent"
                          size="xs"
                          color={sortBy === column.key ? undefined : 'gray'}
                        >
                          {sortBy === column.key ? (
                            sortOrder === 'asc' ? (
                              <IconSortAscending size={14} />
                            ) : (
                              <IconSortDescending size={14} />
                            )
                          ) : (
                            <IconSelector size={14} style={{ opacity: 0.5 }} />
                          )}
                        </ActionIcon>
                      )}
                    </Group>
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
              {loading ? (
                <Table.Tr>
                  <Table.Td colSpan={columns.length + (enableSelection ? 1 : 0)}>
                    <Text ta="center" py="xl" c="dimmed">
                      Yükleniyor...
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : paginatedData.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={columns.length + (enableSelection ? 1 : 0)}>
                    <Text ta="center" py="xl" c="dimmed">
                      {emptyText}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                paginatedData.map((item) => (
                  <Table.Tr
                    key={item[idField]}
                    onClick={() => onRowClick?.(item)}
                    style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                  >
                    {enableSelection && (
                      <Table.Td>
                        <Checkbox
                          checked={selectedRows.has(item[idField])}
                          onChange={() => toggleRow(item[idField])}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Table.Td>
                    )}
                    {columns.map((column) => (
                      <Table.Td key={String(column.key)}>
                        {column.render
                          ? column.render(item)
                          : String(item[column.key as keyof T] ?? '-')}
                      </Table.Td>
                    ))}
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box p="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                {(currentPage - 1) * pageSize + 1}-
                {Math.min(currentPage * pageSize, sortedData.length)} / {sortedData.length}
              </Text>
              <Pagination
                total={totalPages}
                value={currentPage}
                onChange={setCurrentPage}
                size="sm"
                />
            </Group>
          </Box>
        )}
      </Stack>
    </Paper>
  )
}
