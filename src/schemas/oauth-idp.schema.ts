import { z } from 'zod';

export const OAuthAuthorizeQuerySchema = z.object({
  client_id: z.string().min(1, 'client_id จำเป็นต้องระบุ'),
  redirect_uri: z.string().min(1, 'redirect_uri จำเป็นต้องระบุ'),
  response_type: z.literal('code'),
  scope: z.string().optional().default('openid profile provider hospital.11018'),
  state: z.string().min(1, 'state จำเป็นต้องระบุเพื่อความปลอดภัย'),
  nonce: z.string().optional(),
});
export type OAuthAuthorizeQuery = z.infer<typeof OAuthAuthorizeQuerySchema>;

export const OAuthTokenRequestSchema = z.object({
  grant_type: z.enum(['authorization_code', 'client_credentials', 'refresh_token']),
  code: z.string().optional(),
  redirect_uri: z.string().optional(),
  client_id: z.string().min(1, 'client_id จำเป็นต้องระบุ'),
  client_secret: z.string().min(1, 'client_secret จำเป็นต้องระบุ'),
  refresh_token: z.string().optional(),
});
export type OAuthTokenRequest = z.infer<typeof OAuthTokenRequestSchema>;

export interface OAuthClientApp {
  id: string;
  clientId: string;
  clientSecret: string;
  name: string;
  description: string;
  redirectUris: string[];
  allowedScopes: string[];
  isTrusted: boolean;
  createdAt: string;
  createdByCid?: string;
  createdById?: string;
  createdByName?: string;
}

export const RegisterClientSchema = z.object({
  name: z.string().min(2, 'ชื่อระบบ/แอปพลิเคชันต้องมีอย่างน้อย 2 ตัวอักษร'),
  description: z.string().optional().default(''),
  redirectUris: z.array(z.string().url('รูปแบบ URL ไม่ถูกต้อง')).min(1, 'ต้องระบุ Redirect URI อย่างน้อย 1 รายการ'),
  isTrusted: z.boolean().default(false),
});
export type RegisterClientInput = z.infer<typeof RegisterClientSchema>;

export const UpdateClientSchema = z.object({
  name: z.string().min(2, 'ชื่อระบบ/แอปพลิเคชันต้องมีอย่างน้อย 2 ตัวอักษร').optional(),
  description: z.string().optional(),
  redirectUris: z.array(z.string().url('รูปแบบ URL ไม่ถูกต้อง')).min(1, 'ต้องระบุ Redirect URI อย่างน้อย 1 รายการ').optional(),
  isTrusted: z.boolean().optional(),
});
export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;


