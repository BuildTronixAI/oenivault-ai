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

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const inviteSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1).max(255),
  facilityId: z.string().uuid().optional().nullable(),
});

export const preferencesSchema = z.object({
  emailAlerts: z.boolean().optional(),
  emailDigest: z.boolean().optional(),
  inAppAlerts: z.boolean().optional(),
});

export const sensorCreateSchema = z.object({
  sensorName: z.string().min(1).max(255),
  sensorType: z.string().max(100).optional(),
  location: z.string().max(255).optional(),
  facilityId: z.string().uuid().optional(),
});

export const thresholdsSchema = z.object({
  tempWarnMin: z.number(),
  tempWarnMax: z.number(),
  tempCritMin: z.number(),
  tempCritMax: z.number(),
  humidityWarnMin: z.number(),
  humidityWarnMax: z.number(),
  humidityCritMin: z.number(),
  humidityCritMax: z.number(),
});

export const muteSchema = z.object({
  hours: z.number().positive().max(168),
  alertType: z.string().max(100).optional().nullable(),
});

export function parseBody<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}
