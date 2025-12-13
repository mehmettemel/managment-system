/**
 * Class Members Drawer
 * Displays list of members enrolled in a specific class
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Drawer,
  Table,
  LoadingOverlay,
  Text,
  Badge,
  Group,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { IconEye } from '@tabler/icons-react';
import Link from 'next/link';
import { getClassMembers } from '@/actions/classes';
import { formatPhone } from '@/utils/formatters';
import type { Member } from '@/types';

interface ClassMembersDrawerProps {
  opened: boolean;
  onClose: () => void;
  classId: number | null;
  className: string;
}

export function ClassMembersDrawer({
  opened,
  onClose,
  classId,
  className,
}: ClassMembersDrawerProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (opened && classId) {
      setLoading(true);
      getClassMembers(classId)
        .then((res) => {
          if (res.data) setMembers(res.data);
        })
        .finally(() => setLoading(false));
    } else {
      setMembers([]);
    }
  }, [opened, classId]);

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={<Text fw={600}>Ders: {className} - Kayıtlı Üyeler</Text>}
      position="right"
      size="md"
    >
      <div style={{ position: 'relative', minHeight: 200 }}>
        <LoadingOverlay visible={loading} />

        {members.length === 0 && !loading ? (
          <Text c="dimmed" ta="center" mt="xl">
            Bu derse kayıtlı üye yok.
          </Text>
        ) : (
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Ad Soyad</Table.Th>
                <Table.Th>Telefon</Table.Th>
                <Table.Th>Durum</Table.Th>
                <Table.Th>Kayıt Tarihi</Table.Th>
                <Table.Th w={50}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {members.map((m: any) => (
                <Table.Tr key={m.id}>
                  <Table.Td>
                    {m.first_name} {m.last_name}
                  </Table.Td>
                  <Table.Td>{formatPhone(m.phone)}</Table.Td>
                  <Table.Td>
                    {m.status === 'active' ? (
                      <Badge color="green" size="sm">
                        Aktif
                      </Badge>
                    ) : m.status === 'frozen' ? (
                      <Badge color="cyan" size="sm">
                        Donduruldu
                      </Badge>
                    ) : (
                      <Badge color="gray" size="sm">
                        {m.status}
                      </Badge>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">
                      {m.enrollment_date
                        ? new Date(m.enrollment_date).toLocaleDateString(
                            'tr-TR'
                          )
                        : '-'}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Tooltip label="Üye Detayına Git">
                      <ActionIcon
                        component={Link}
                        href={`/members/${m.id}`}
                        variant="subtle"
                        color="blue"
                        onClick={onClose}
                      >
                        <IconEye size={18} />
                      </ActionIcon>
                    </Tooltip>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </div>
    </Drawer>
  );
}
