import { z } from 'zod';

export const EnvironmentSchema = z.enum(['UAT', 'PRD']);
export type Environment = z.infer<typeof EnvironmentSchema>;

export const ServiceProviderSchema = z.enum(['PROVIDER_ID', 'HEALTH_ID']);
export type ServiceProvider = z.infer<typeof ServiceProviderSchema>;

export const AuthTokenRequestSchema = z.object({
  environment: EnvironmentSchema.default('UAT'),
  provider: ServiceProviderSchema.default('PROVIDER_ID'),
  hospitalCode: z.string().default('11018'),
  serviceName: z.string().default('Super App By รพ.หนองหาน'),
  citizenId: z.string().optional(),
});
export type AuthTokenRequest = z.infer<typeof AuthTokenRequestSchema>;

export const ProviderLoginSchema = z.object({
  citizenId: z
    .string()
    .length(13, 'เลขบัตรประชาชนต้องมีความยาว 13 หลัก')
    .regex(/^[0-9]+$/, 'ต้องเป็นตัวเลขเท่านั้น'),
  password: z.string().min(4, 'รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร'),
  environment: EnvironmentSchema.default('UAT'),
});
export type ProviderLoginInput = z.infer<typeof ProviderLoginSchema>;

export const ApiMonitorLogSchema = z.object({
  id: z.string(),
  endpoint: z.string(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
  statusCode: z.number(),
  responseTimeMs: z.number(),
  timestamp: z.string(),
  environment: EnvironmentSchema,
  serviceName: z.string(),
  status: z.enum(['SUCCESS', 'WARNING', 'ERROR']),
});
export type ApiMonitorLog = z.infer<typeof ApiMonitorLogSchema>;
