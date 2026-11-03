import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'nhh_sso_super_secret_jwt_key_11018_udonthani_hospital';
const key = new TextEncoder().encode(JWT_SECRET);

export interface UserSessionPayload {
  providerId: string;
  fullName: string;
  position: string;
  hospitalCode: string;
  hospitalName: string;
  role: string;
  [key: string]: any;
}

/**
 * สร้าง JWT Session Token ด้วยไลบรารี jose
 * อายุการใช้งาน 8 ชั่วโมง
 */
export async function createSessionToken(payload: UserSessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(key);
}

/**
 * ตรวจสอบความถูกต้องของ Session Token
 */
export async function verifySessionToken(token: string): Promise<UserSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    return payload as unknown as UserSessionPayload;
  } catch {
    return null;
  }
}

