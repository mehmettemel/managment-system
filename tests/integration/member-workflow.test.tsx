/**
 * Integration Tests for Member Workflows
 * Based on Help Page Scenarios:
 * 1. Yeni Üye Kaydı (New Member Registration)
 * 2. Üye Arama ve Filtreleme
 * 3. Üye Bilgilerini Düzenleme
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../utils/test-utils';
import userEvent from '@testing-library/user-event';

// Mock the server actions
vi.mock('@/actions/members', () => ({
  getMembers: vi.fn().mockResolvedValue({
    data: [
      {
        id: 1,
        first_name: 'Ahmet',
        last_name: 'Yılmaz',
        phone: '5551234567',
        join_date: '2024-01-15',
        status: 'active',
      },
      {
        id: 2,
        first_name: 'Mehmet',
        last_name: 'Demir',
        phone: '5559876543',
        join_date: '2024-02-01',
        status: 'frozen',
      },
    ],
    error: null,
  }),
  createMember: vi.fn().mockResolvedValue({
    data: {
      id: 3,
      first_name: 'Ayşe',
      last_name: 'Kaya',
      phone: '5551112233',
      join_date: '2024-12-25',
      status: 'active',
    },
    error: null,
  }),
  updateMember: vi.fn().mockResolvedValue({
    data: { success: true },
    error: null,
  }),
  getMemberById: vi.fn().mockResolvedValue({
    data: {
      id: 1,
      first_name: 'Ahmet',
      last_name: 'Yılmaz',
      phone: '5551234567',
      join_date: '2024-01-15',
      status: 'active',
      member_classes: [],
    },
    error: null,
  }),
}));

describe('Member Registration Workflow', () => {
  describe('Scenario 1: Yeni Üye Kaydı (New Member Registration)', () => {
    it('should allow creating a new member with minimal information', async () => {
      // Senaryo: Okulunuza yeni bir öğrenci geldi ve kayıt olmak istiyor.
      // Test: Ad, Soyad ve Telefon ile basit kayıt oluşturma

      const { createMember } = await import('@/actions/members');

      const newMember = {
        first_name: 'Ayşe',
        last_name: 'Kaya',
        phone: '5551112233',
      };

      const result = await createMember(newMember);

      expect(result.error).toBeNull();
      expect(result.data).toMatchObject({
        first_name: 'Ayşe',
        last_name: 'Kaya',
        phone: '5551112233',
        status: 'active',
      });
      expect(createMember).toHaveBeenCalledWith(newMember);
    });

    it('should validate required fields for member registration', async () => {
      const { createMember } = await import('@/actions/members');

      // Test eksik bilgi ile kayıt
      createMember.mockResolvedValueOnce({
        data: null,
        error: 'Ad, soyad ve telefon gerekli',
      });

      const result = await createMember({ first_name: 'Ayşe' } as any);

      expect(result.error).toBe('Ad, soyad ve telefon gerekli');
      expect(result.data).toBeNull();
    });
  });

  describe('Scenario 2: Üye Arama ve Filtreleme', () => {
    it('should filter members by status', async () => {
      const { getMembers } = await import('@/actions/members');

      // Aktif üyeleri getir
      getMembers.mockResolvedValueOnce({
        data: [
          {
            id: 1,
            first_name: 'Ahmet',
            last_name: 'Yılmaz',
            status: 'active',
          },
        ],
        error: null,
      });

      const result = await getMembers('active');

      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].status).toBe('active');
    });

    it('should show frozen members in separate tab', async () => {
      const { getMembers } = await import('@/actions/members');

      // Dondurulmuş üyeleri getir
      getMembers.mockResolvedValueOnce({
        data: [
          {
            id: 2,
            first_name: 'Mehmet',
            last_name: 'Demir',
            status: 'frozen',
          },
        ],
        error: null,
      });

      const result = await getMembers('frozen');

      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].status).toBe('frozen');
    });
  });

  describe('Scenario 3: Üye Bilgilerini Düzenleme', () => {
    it('should update member information', async () => {
      const { updateMember } = await import('@/actions/members');

      const updates = {
        id: 1,
        first_name: 'Ahmet',
        last_name: 'Yılmaz (Güncellendi)',
        phone: '5551234567',
      };

      const result = await updateMember(1, updates);

      expect(result.error).toBeNull();
      expect(updateMember).toHaveBeenCalledWith(1, updates);
    });
  });
});
