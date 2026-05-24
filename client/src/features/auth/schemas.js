import { z } from 'zod';

export const password = z
  .string()
  .min(8, 'At least 8 characters')
  .max(128)
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), 'Must contain a letter and a number');

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Required'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Too short').max(80),
  email: z.string().email(),
  password,
});

export const forgotSchema = z.object({ email: z.string().email() });

export const resetSchema = z.object({
  token: z.string().min(32),
  password,
  confirm: z.string(),
}).refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Passwords do not match' });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Required'),
    newPassword: password,
    confirm: z.string(),
  })
  .refine((v) => v.newPassword === v.confirm, { path: ['confirm'], message: 'Passwords do not match' });
