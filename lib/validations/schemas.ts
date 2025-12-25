import { z } from 'zod';

export const phoneRegex =
  /^(05)[0-9][0-9][\s]([0-9]){3}[\s]([0-9]){2}[\s]([0-9]){2}$/; // 05XX XXX XX XX format hint/check, simplified for now to accept reasonably clean input or refine

export const MemberSchema = z.object({
  first_name: z.string().min(2, 'Ad en az 2 karakter olmalıdır'),
  last_name: z.string().min(2, 'Soyad en az 2 karakter olmalıdır'),
  email: z
    .string()
    .email('Geçerli bir email adresi giriniz')
    .optional()
    .or(z.literal('')),
  phone: z.string().min(10, 'Telefon numarası en az 10 karakter olmalıdır'),
  status: z.enum(['active', 'inactive', 'frozen']).default('active'),
  notes: z.string().optional(),
});

export const UpdateMemberSchema = MemberSchema.partial();

export const PaymentSchema = z.object({
  member_id: z.number().int().positive(),
  class_id: z.number().int().positive(),
  amount: z.number().positive('Ödeme tutarı pozitif olmalıdır'),
  payment_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Geçersiz tarih formatı',
  }),
  payment_method: z.enum(['Nakit', 'Kredi Kartı', 'Havale', 'Diğer']), // Updated to match DB/UI values
  description: z.string().optional(),
});

export type MemberInput = z.infer<typeof MemberSchema>;
export type PaymentInput = z.infer<typeof PaymentSchema>;
