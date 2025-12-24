import type { Member, Class, MemberClassWithDetails, PaymentWithClass } from '@/types';

export const mockMember: Member = {
  id: 1,
  first_name: 'Ahmet',
  last_name: 'Yılmaz',
  phone: '5551234567',
  join_date: '2024-01-15',
  status: 'active',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
};

export const mockClass: Class = {
  id: 1,
  name: 'Salsa Başlangıç',
  default_price: 1500,
  instructor_id: 1,
  active: true,
  created_at: '2024-01-01T10:00:00Z',
  updated_at: '2024-01-01T10:00:00Z',
};

export const mockEnrollment: MemberClassWithDetails = {
  id: 1,
  member_id: 1,
  class_id: 1,
  price: 1500,
  duration: 12,
  active: true,
  created_at: '2024-01-15T10:00:00Z',
  next_payment_date: '2024-02-15',
  classes: mockClass,
};

export const mockPayment: PaymentWithClass = {
  id: 1,
  member_id: 1,
  member_class_id: 1,
  amount: 1500,
  payment_date: '2024-02-01',
  payment_method: 'cash',
  type: 'monthly',
  created_at: '2024-02-01T10:00:00Z',
  members: {
    first_name: 'Ahmet',
    last_name: 'Yılmaz',
  },
  classes: mockClass,
};

export const mockFrozenMember: Member = {
  ...mockMember,
  id: 2,
  first_name: 'Mehmet',
  last_name: 'Demir',
  status: 'frozen',
};

export const mockMembers: Member[] = [
  mockMember,
  mockFrozenMember,
  {
    id: 3,
    first_name: 'Ayşe',
    last_name: 'Kaya',
    phone: '5559876543',
    join_date: '2024-02-01',
    status: 'active',
    created_at: '2024-02-01T10:00:00Z',
    updated_at: '2024-02-01T10:00:00Z',
  },
];

export const mockClasses: Class[] = [
  mockClass,
  {
    id: 2,
    name: 'Bachata İleri',
    default_price: 2000,
    instructor_id: 2,
    active: true,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
  },
];
