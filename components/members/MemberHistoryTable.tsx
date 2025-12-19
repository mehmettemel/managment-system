'use client';

import {
  Table,
  Badge,
  Text,
  Group,
  Button,
  Box,
  Card,
  Pagination,
  Stack,
} from '@mantine/core';
import { MemberLog } from '@/types';
import { formatDate } from '@/utils/date-helpers';
import { useState } from 'react';
import {
  IconChevronDown,
  IconChevronUp,
  IconInfoCircle,
} from '@tabler/icons-react';

interface MemberHistoryTableProps {
  logs: MemberLog[];
}

const ITEMS_PER_PAGE = 10;

export function MemberHistoryTable({ logs }: MemberHistoryTableProps) {
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const toggleRow = (id: number) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const getActionBadge = (type: string) => {
    switch (type) {
      case 'enrollment':
        return <Badge color="green">Kayıt</Badge>;
      case 'termination':
        return <Badge color="red">Sonlandırma</Badge>;
      case 'freeze':
        return <Badge color="blue">Dondurma</Badge>;
      case 'unfreeze':
        return <Badge color="cyan">Aktifleştirme</Badge>;
      case 'payment':
        return <Badge color="teal">Ödeme</Badge>;
      default:
        return <Badge color="gray">{type}</Badge>;
    }
  };

  if (logs.length === 0) {
    return (
      <Card withBorder padding="xl" radius="md">
        <Text c="dimmed" ta="center">
          Henüz kayıtlı geçmiş bulunmamaktadır.
        </Text>
      </Card>
    );
  }

  // Pagination calculations
  const totalPages = Math.ceil(logs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedLogs = logs.slice(startIndex, endIndex);

  return (
    <Stack gap="md">
      <Card withBorder padding="sm" radius="md">
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Tarih</Table.Th>
              <Table.Th>Ders</Table.Th>
              <Table.Th>İşlem</Table.Th>
              <Table.Th>Açıklama</Table.Th>
              <Table.Th></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {paginatedLogs.map((log) => (
            <>
              <Table.Tr key={log.id}>
                <Table.Td>
                  {formatDate(log.date)}
                  <Text size="xs" c="dimmed">
                    {new Date(log.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </Table.Td>
                <Table.Td>
                  {log.member_classes?.classes?.name ? (
                    <Badge variant="dot" color="blue">
                      {log.member_classes.classes.name}
                    </Badge>
                  ) : (
                    <Text size="xs" c="dimmed">
                      -
                    </Text>
                  )}
                </Table.Td>
                <Table.Td>{getActionBadge(log.action_type)}</Table.Td>
                <Table.Td>{log.description}</Table.Td>
                <Table.Td>
                  <Button
                    variant="subtle"
                    size="xs"
                    onClick={() => toggleRow(log.id)}
                    rightSection={
                      expandedRows.includes(log.id) ? (
                        <IconChevronUp size={14} />
                      ) : (
                        <IconChevronDown size={14} />
                      )
                    }
                  >
                    Detay
                  </Button>
                </Table.Td>
              </Table.Tr>
              {expandedRows.includes(log.id) && (
                <Table.Tr>
                  <Table.Td
                    colSpan={5}
                    style={{ padding: 0, borderBottom: 'none' }}
                  >
                    <Box bg="gray.0" p="md">
                      <Group align="flex-start" gap="xs">
                        <IconInfoCircle
                          size={16}
                          style={{ marginTop: 4, opacity: 0.5 }}
                        />
                        <Box>
                          <Text size="sm" fw={500}>
                            Metadata:
                          </Text>
                          <pre style={{ fontSize: '11px', margin: 0 }}>
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </Box>
                      </Group>
                    </Box>
                  </Table.Td>
                </Table.Tr>
              )}
            </>
          ))}
        </Table.Tbody>
      </Table>
    </Card>

    {totalPages > 1 && (
      <Group justify="center">
        <Pagination
          total={totalPages}
          value={currentPage}
          onChange={setCurrentPage}
          size="sm"
        />
        <Text size="xs" c="dimmed">
          {startIndex + 1}-{Math.min(endIndex, logs.length)} / {logs.length}{' '}
          kayıt
        </Text>
      </Group>
    )}
  </Stack>
  );
}
