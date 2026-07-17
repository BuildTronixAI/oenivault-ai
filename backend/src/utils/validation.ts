import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  fullName: z.string().min(1).max(255),
  role: z.enum(['admin', 'customer']).optional().default('customer'),
  facilityId: z.string().uuid().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const wineSchema = z.object({
  collectionId: z.string().uuid(),
  name: z.string().min(1).max(255),
  vintage: z.number().int().min(1800).max(2100).optional().nullable(),
  region: z.string().max(255).optional().nullable(),
  varietal: z.string().max(255).optional().nullable(),
  quantity: z.number().int().min(1).default(1),
  locationCode: z.string().max(50).optional().nullable(),
  notes: z.string().optional().nullable(),
  estimatedValue: z.number().nonnegative().optional().nullable(),
});

export const wineUpdateSchema = wineSchema.partial().omit({ collectionId: true });

export const collectionSchema = z.object({
  customerId: z.string().uuid(),
  facilityId: z.string().uuid(),
  name: z.string().min(1).max(255),
  totalCases: z.number().int().min(0).optional().default(0),
});

export const customerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  fullName: z.string().min(1).max(255),
  facilityId: z.string().uuid().optional().nullable(),
});

export const customerUpdateSchema = z.object({
  email: z.string().email().optional(),
  fullName: z.string().min(1).max(255).optional(),
  facilityId: z.string().uuid().optional().nullable(),
  password: z.string().min(8).max(128).optional(),
});

export function parseBody<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}
