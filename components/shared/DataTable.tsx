/**
 * Reusable DataTable Component
 * Features: Sorting, Filtering, Checkbox Selection, Pagination, Search
 */

'use client';

import { useState, useMemo } from 'react';
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
  Badge,
  Box,
  ScrollArea,
} from '@mantine/core';
import {
  IconSearch,
  IconSortAscending,
  IconSortDescending,
  IconSelector,
} from '@tabler/icons-react';

export interface DataTableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  searchable?: boolean;
  render?: (item: T) => React.ReactNode;
  width?: string | number;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  onRowClick?: (item: T) => void;
  onSelectionChange?: (selectedItems: T[]) => void;
  enableSelection?: boolean;
  pageSize?: number;
  loading?: boolean;
  emptyText?: string;
  idField?: keyof T;
  filters?: React.ReactNode;
  // Server-side pagination props
  totalRecords?: number;
  page?: number;
  onPageChange?: (page: number) => void;
  // Server-side sorting props
  sortField?: string | null;
  sortDirection?: 'asc' | 'desc';
  searchable?: boolean;
  searchKeys?: (keyof T | string)[];
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
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
  totalRecords,
  page,
  onPageChange,
  sortField,
  sortDirection,
  onSort,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [internalSortBy, setInternalSortBy] = useState<string | null>(null);
  const [internalSortOrder, setInternalSortOrder] = useState<'asc' | 'desc'>(
    'asc'
  );
  const [selectedRows, setSelectedRows] = useState<Set<any>>(new Set());
  const [internalPage, setInternalPage] = useState(1);

  const currentPage = page || internalPage;
  // Use controlled sort state if provided, otherwise internal
  const sortBy = sortField !== undefined ? sortField : internalSortBy;
  const sortOrder =
    sortDirection !== undefined ? sortDirection : internalSortOrder;

  const handlePageChange = (newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage);
    } else {
      setInternalPage(newPage);
    }
  };

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;

    return data.filter((item) => {
      return columns.some((column) => {
        if (!column.searchable) return false;
        const value = item[column.key as keyof T];
        return String(value).toLowerCase().includes(searchQuery.toLowerCase());
      });
    });
  }, [data, searchQuery, columns]);

  // Sort data (Client-side)
  // Note: If using server-side sort (onSort provided), we might still want this for optimistic updates
  // OR we rely entirely on data prop updating.
  // If totalRecords is provided (Server Side Pagination), we assume data is ALREADY sorted by server.
  // So client-side sort is only for "all data loaded" mode.
  const sortedData = useMemo(() => {
    // If server-side data (totalRecords defined), we don't client-sort here usually,
    // BUT if the user wants to sort the *current page* only, they could.
    // However, usually server-sort implies data comes back sorted.
    if (totalRecords !== undefined) return filteredData;

    if (!sortBy) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue, 'tr');
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue), 'tr');
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortBy, sortOrder, totalRecords]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (totalRecords !== undefined) return data; // Server-side data
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return sortedData.slice(start, end);
  }, [data, sortedData, currentPage, pageSize, totalRecords]);

  const totalPages = useMemo(() => {
    if (totalRecords !== undefined) return Math.ceil(totalRecords / pageSize);
    return Math.ceil(sortedData.length / pageSize);
  }, [sortedData.length, pageSize, totalRecords]);

  // Handle sort
  const handleSort = (columnKey: string) => {
    let newOrder: 'asc' | 'desc' = 'asc';
    if (sortBy === columnKey) {
      newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    }

    if (onSort) {
      onSort(columnKey, newOrder);
    } else {
      setInternalSortBy(columnKey);
      setInternalSortOrder(newOrder);
    }
  };

  // Handle selection
  const toggleRow = (id: any) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
    // Logic for onSelectionChange
    if (onSelectionChange) {
      // For server side, we might need a different strategy to get full items if they aren't all loaded.
      // But assuming we only select from visible:
      const selectedItems = data.filter((item) =>
        newSelected.has(item[idField])
      );
      // Note: This only returns selected items FROM CURRENT PAGE if server side.
      // For full cross-page selection state, we'd need more complex logic.
      // For now, let's assume selection is per-page or accumulated differently.
      // Actually, standard DataTable behavior often clears selection on page change or accumulates IDs.
      // Let's keep it simple: strict ID match from current data.
      onSelectionChange(selectedItems);
    }
  };

  const toggleAll = () => {
    if (paginatedData.every((item) => selectedRows.has(item[idField]))) {
      // Unselect all on this page
      const newSelected = new Set(selectedRows);
      paginatedData.forEach((item) => newSelected.delete(item[idField]));
      setSelectedRows(newSelected);
      if (onSelectionChange) {
        // Re-calculate selected items list (difficult if data is partial)
        // Sending [] might be wrong if we have other pages selected.
        // Let's just send what we can find in 'data'.
        const selectedItems = data.filter((item) =>
          newSelected.has(item[idField])
        );
        onSelectionChange(selectedItems);
      }
    } else {
      // Select all on this page
      const newSelected = new Set(selectedRows);
      paginatedData.forEach((item) => newSelected.add(item[idField]));
      setSelectedRows(newSelected);
      if (onSelectionChange) {
        const selectedItems = data.filter((item) =>
          newSelected.has(item[idField])
        );
        onSelectionChange(selectedItems);
      }
    }
  };

  const headerCheckboxChange = () => {
    toggleAll();
  };

  return (
    <Paper withBorder radius="md">
      <Stack gap={0}>
        {/* Search Bar */}
        <Box p="md" className="border-b border-gray-200 dark:border-zinc-800">
          <Group justify="space-between">
            <Group gap="xs">
              <TextInput
                placeholder="Ara..."
                leftSection={<IconSearch size={16} />}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handlePageChange(1);
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
                        paginatedData.every((item) =>
                          selectedRows.has(item[idField])
                        )
                      }
                      indeterminate={
                        paginatedData.some((item) =>
                          selectedRows.has(item[idField])
                        ) &&
                        !paginatedData.every((item) =>
                          selectedRows.has(item[idField])
                        )
                      }
                      onChange={headerCheckboxChange}
                    />
                  </Table.Th>
                )}
                {columns.map((column) => (
                  <Table.Th
                    key={column.key as string}
                    style={{
                      cursor: column.sortable ? 'pointer' : 'default',
                      width: column.width,
                    }}
                    onClick={() =>
                      column.sortable && handleSort(column.key as string)
                    }
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
                  <Table.Td
                    colSpan={columns.length + (enableSelection ? 1 : 0)}
                    align="center"
                    py="xl"
                  >
                    <Text ta="center" py="xl" c="dimmed">
                      Yükleniyor...
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : paginatedData.length === 0 ? (
                <Table.Tr>
                  <Table.Td
                    colSpan={columns.length + (enableSelection ? 1 : 0)}
                    align="center"
                    py="xl"
                  >
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
                      <Table.Td onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedRows.has(item[idField])}
                          onChange={() => toggleRow(item[idField])}
                        />
                      </Table.Td>
                    )}
                    {columns.map((column) => (
                      <Table.Td key={column.key as string}>
                        {column.render
                          ? column.render(item)
                          : ((item[column.key as keyof T] as React.ReactNode) ??
                            '-')}
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
          <Box p="md" className="border-t border-gray-200 dark:border-zinc-800">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                {(currentPage - 1) * pageSize + 1}-
                {Math.min(
                  currentPage * pageSize,
                  totalRecords ?? sortedData.length
                )}{' '}
                / {totalRecords ?? sortedData.length}
              </Text>
              <Pagination
                total={totalPages}
                value={currentPage}
                onChange={handlePageChange}
                size="sm"
              />
            </Group>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}
