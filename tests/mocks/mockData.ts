import type {
  Member,
  Class,
  MemberClassWithDetails,
  PaymentWithClass,
} from '@/types';

export const mockMember: Member = {
  id: 1,
  first_name: 'Ahmet',
  last_name: 'Yılmaz',
  phone: '5551234567',
  join_date: '2024-01-15',
  status: 'active',
  created_at: '2024-01-15T10:00:00Z',
  photo_url: '',
  notes: '',
};

export const mockClass: Class = {
  id: 1,
  name: 'Salsa Başlangıç',
  description: 'Salsa başlangıç seviye dersi',
  price_monthly: 1500,
  instructor_id: 1,
  day_of_week: 'Pazartesi',
  start_time: '19:00',
  duration_minutes: 60,
  active: true,
  archived: false,
  created_at: '2024-01-01T10:00:00Z',
};

export const mockEnrollment: MemberClassWithDetails = {
  id: 1,
  member_id: 1,
  class_id: 1,

  active: true,
  payment_interval: 1,
  custom_price: 1500,
  first_payment_date: '2024-01-15T10:00:00Z',
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
  payment_type: 'monthly',
  class_id: 1,
  period_start: '2024-02-01',
  period_end: '2024-03-01',
  description: 'Aylık ödeme',
  snapshot_price: 1500,
  snapshot_class_name: 'Salsa Başlangıç',
  created_at: '2024-02-01T10:00:00Z',
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
    photo_url: '',
    notes: '',
  },
];

export const mockClasses: Class[] = [
  mockClass,
  {
    id: 2,
    name: 'Bachata İleri',
    description: 'Bachata ileri seviye dersi',
    price_monthly: 2000,
    instructor_id: 2,
    day_of_week: 'Salı',
    start_time: '20:00',
    duration_minutes: 60,
    active: true,
    archived: false,
    created_at: '2024-01-01T10:00:00Z',
  },
];
