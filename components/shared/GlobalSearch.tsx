'use client';

import { useState, useEffect } from 'react';
import { Autocomplete, Loader, Group, Text, Avatar } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useDebouncedValue } from '@mantine/hooks';
import { searchMembers } from '@/actions/members';
import { Member } from '@/types';

export function GlobalSearch() {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [debounced] = useDebouncedValue(value, 300);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Member[]>([]);

  useEffect(() => {
    if (debounced.length === 0) {
      setData([]);
      return;
    }

    setLoading(true);
    searchMembers(debounced)
      .then((res) => {
        if (res.data) setData(res.data);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [debounced]);

  const handleItemSubmit = (item: any) => {
    // Navigate to member profile
    router.push(`/members/${item.id}`);
    setValue(''); // Clear search
  };

  return (
    <Autocomplete
      placeholder="Üye ara (Ad, Soyad, Tel)..."
      leftSection={<IconSearch size={16} stroke={1.5} />}
      data={data.map((item) => ({
        value: `${item.first_name} ${item.last_name}`,
        id: item.id.toString(),
        ...item,
      }))}
      value={value}
      onChange={setValue}
      rightSection={loading ? <Loader size={16} /> : null}
      onOptionSubmit={(val) => {
        const selected = data.find(
          (d) => `${d.first_name} ${d.last_name}` === val
        );
        if (selected) {
          handleItemSubmit(selected);
        }
      }}
      renderOption={({ option }: any) => {
        const member = data.find((d) => d.id.toString() === option.id);
        if (!member) return <Text>{option.value}</Text>;

        return (
          <Group gap="sm" wrap="nowrap">
            <Avatar src={null} color="blue" radius="xl" size="sm">
              {member.first_name[0]}
              {member.last_name[0]}
            </Avatar>
            <div style={{ flex: 1 }}>
              <Text size="sm">
                {member.first_name} {member.last_name}
              </Text>
              <Text size="xs" c="dimmed">
                {member.phone || '-'}
              </Text>
            </div>
          </Group>
        );
      }}
      filter={({ options }) => options} // Server side filtering
      limit={10}
      w={{ base: '100%', xs: 200, sm: 250, md: 300 }}
      comboboxProps={{ transitionProps: { transition: 'pop', duration: 200 } }}
    />
  );
}
