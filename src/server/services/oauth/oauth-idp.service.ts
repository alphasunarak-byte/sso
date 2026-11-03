import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { OAuthClientApp, RegisterClientInput, UpdateClientInput } from '@/schemas/oauth-idp.schema';

interface AuthCodeEntry {
  code: string;
  clientId: string;
  redirectUri: string;
  user: any;
  scope: string;
  expiresAt: number;
}

// Global In-Memory Stores
const globalClients: Map<string, OAuthClientApp> = new Map();
const globalAuthCodes: Map<string, AuthCodeEntry> = new Map();

// รองรับทั้ง Vercel Serverless (/tmp) และ Local Development (process.cwd()/data)
const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'nhh-data') : path.join(process.cwd(), 'data');
const CLIENTS_FILE = path.join(DATA_DIR, 'oauth-clients.json');

function getDefaultClients(): OAuthClientApp[] {
  return [
    {
      id: 'client-superapp-01',
      clientId: 'super-app-nhh-11018',
      clientSecret: 'secret_nhh_superapp_2026',
      name: 'Super App By รพ.หนองหาน [11018]',
      description: 'ระบบแอปพลิเคชันกลางและมอนิเตอร์ API โรงพยาบาลหนองหาน',
      redirectUris: [
        'http://localhost:3030/api/auth/callback',
        'http://127.0.0.1:3030/api/auth/callback',
        'http://localhost:3000/api/auth/callback',
        'http://localhost:3000/api/auth/callback/nhh-sso',
        'https://superapp.nhh.go.th/callback',
      ],
      allowedScopes: ['openid', 'profile', 'provider', 'hospital.11018'],
      isTrusted: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'client-nhh-income-02',
      clientId: 'nhh-income-platform-11018',
      clientSecret: 'secret_nhh_income_platform_prod',
      name: 'NHH-Income Platform (ระบบบริหารรายได้)',
      description: 'ระบบวิเคราะห์และบริหารรายได้ทุกกองทุน รพ.หนองหาน',
      redirectUris: [
        'http://localhost:3000/api/auth/provider-id/callback',
        'http://localhost:3000/api/auth/callback',
        'http://localhost:3030/api/auth/callback',
      ],
      allowedScopes: ['openid', 'profile', 'provider', 'hospital.11018'],
      isTrusted: true,
      createdAt: '2026-02-15T00:00:00.000Z',
    },
    {
      id: 'client-hosxp-03',
      clientId: 'hosxp-connector-11018',
      clientSecret: 'secret_hosxp_nhh_connect_secure',
      name: 'HOSxP Connector & API Gateway',
      description: 'เชื่อมโยงข้อมูลเวชระเบียนและระบบบริการสุขภาพโรงพยาบาลหนองหาน',
      redirectUris: [
        'http://localhost:8080/oauth/callback',
      ],
      allowedScopes: ['openid', 'profile', 'provider', 'hospital.11018', 'hospital.read', 'hospital.write'],
      isTrusted: true,
      createdAt: '2026-03-01T00:00:00.000Z',
    },
  ];
}

function loadClients(): Map<string, OAuthClientApp> {
  const map = new Map<string, OAuthClientApp>();
  try {
    if (fs.existsSync(CLIENTS_FILE)) {
      const content = fs.readFileSync(CLIENTS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        for (const client of parsed) {
          map.set(client.clientId, client);
        }
        return map;
      }
    }
  } catch (err) {
    console.warn('[OAuthIdpService] Error reading oauth-clients.json:', err);
  }

  // สร้างค่าเริ่มต้นเฉพาะกรณีที่ยังไม่เคยมีไฟล์ oauth-clients.json เท่านั้น
  const defaultClients = getDefaultClients();
  for (const client of defaultClients) {
    map.set(client.clientId, client);
  }
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CLIENTS_FILE, JSON.stringify(defaultClients, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to initialize oauth-clients.json:', err);
  }
  return map;
}

function saveClients(map: Map<string, OAuthClientApp>): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const list = Array.from(map.values());
    fs.writeFileSync(CLIENTS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save oauth-clients.json:', err);
  }
}

const JWT_SECRET = process.env.NHH_IDP_SECRET || 'nhh_sso_idp_secure_jwt_signing_key_11018_udonthani';

export class OAuthIdpService {
  /**
   * ลงทะเบียนหรือดึงข้อมูล Client Applications
   */
  static listClients(): OAuthClientApp[] {
    const map = loadClients();
    return Array.from(map.values());
  }

  static getClient(clientId: string): OAuthClientApp | undefined {
    const map = loadClients();
    return map.get(clientId);
  }

  static registerClient(
    input: RegisterClientInput,
    creator?: {
      cid?: string;
      hashCid?: string;
      providerId?: string;
      fullName?: string;
    }
  ): OAuthClientApp {
    const map = loadClients();
    const clientId = `nhh-app-${crypto.randomBytes(6).toString('hex')}`;
    const clientSecret = `secret_${crypto.randomBytes(16).toString('hex')}`;

    const newClient: OAuthClientApp = {
      id: `client-${Date.now()}`,
      clientId,
      clientSecret,
      name: input.name,
      description: input.description || '',
      redirectUris: input.redirectUris,
      allowedScopes: ['openid', 'profile', 'provider', 'hospital.11018'],
      isTrusted: input.isTrusted || false,
      createdAt: new Date().toISOString(),
      createdByCid: creator?.cid || creator?.hashCid || '',
      createdById: creator?.providerId || '',
      createdByName: creator?.fullName || '',
    };

    map.set(clientId, newClient);
    saveClients(map);
    return newClient;
  }

  static updateClient(clientId: string, input: UpdateClientInput): OAuthClientApp | null {
    const map = loadClients();
    const existing = map.get(clientId);
    if (!existing) return null;

    const updated: OAuthClientApp = {
      ...existing,
      name: input.name ?? existing.name,
      description: input.description ?? existing.description,
      redirectUris: input.redirectUris ?? existing.redirectUris,
      isTrusted: input.isTrusted ?? existing.isTrusted,
    };

    map.set(clientId, updated);
    saveClients(map);
    return updated;
  }

  static deleteClient(clientId: string): boolean {
    const map = loadClients();
    if (!map.has(clientId)) return false;
    map.delete(clientId);
    saveClients(map);
    return true;
  }

  static resetDefaultClients(): OAuthClientApp[] {
    const map = new Map<string, OAuthClientApp>();
    for (const client of getDefaultClients()) {
      map.set(client.clientId, client);
    }
    saveClients(map);
    return Array.from(map.values());
  }

  static validateClientCredentials(clientId: string, clientSecret: string): OAuthClientApp | null {
    const map = loadClients();
    const client = map.get(clientId);
    if (!client) return null;
    if (client.clientSecret !== clientSecret) return null;
    return client;
  }

  static isRedirectUriAllowed(client: OAuthClientApp, redirectUri: string): boolean {
    if (!redirectUri) return false;
    const cleanUri = redirectUri.trim().replace(/\/$/, '').toLowerCase();

    // 1. ตรวจสอบตรงๆ (Exact Match)
    const exactMatch = client.redirectUris.some(
      (uri) => uri.trim().replace(/\/$/, '').toLowerCase() === cleanUri
    );
    if (exactMatch) return true;

    // 2. ตรวจสอบ Pathname และ Localhost / IP สำหรับสภาพแวดล้อม Development / Intranet
    try {
      const targetUrl = new URL(redirectUri);
      return client.redirectUris.some((allowedUri) => {
        try {
          const allowedUrl = new URL(allowedUri);
          const isLocal = (host: string) =>
            host === 'localhost' ||
            host === '127.0.0.1' ||
            host.startsWith('192.168.') ||
            host.startsWith('10.');

          if (
            targetUrl.pathname.replace(/\/$/, '') === allowedUrl.pathname.replace(/\/$/, '') &&
            isLocal(targetUrl.hostname) &&
            isLocal(allowedUrl.hostname)
          ) {
            return true;
          }
        } catch {
          return false;
        }
        return false;
      });
    } catch {
      return false;
    }
  }

  /**
   * สร้าง Authorization Code สำหรับ OAuth2 Flow
   */
  static createAuthorizationCode(params: {
    clientId: string;
    redirectUri: string;
    user: any;
    scope?: string;
  }): string {
    const code = `nhh_code_${crypto.randomBytes(24).toString('hex')}`;
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 นาที

    globalAuthCodes.set(code, {
      code,
      clientId: params.clientId,
      redirectUri: params.redirectUri,
      user: params.user,
      scope: params.scope || 'openid profile provider hospital.11018',
      expiresAt,
    });

    return code;
  }

  /**
   * แลกเปลี่ยน Authorization Code เป็น Access Token และ ID Token
   */
  static exchangeCode(params: {
    code: string;
    clientId: string;
    clientSecret: string;
    redirectUri?: string;
  }): { success: boolean; tokens?: any; error?: string } {
    const client = this.validateClientCredentials(params.clientId, params.clientSecret);
    if (!client) {
      return { success: false, error: 'invalid_client: Client ID หรือ Client Secret ไม่ถูกต้อง' };
    }

    const entry = globalAuthCodes.get(params.code);
    if (!entry) {
      return { success: false, error: 'invalid_grant: Authorization Code ไม่ถูกต้องหรือถูกใช้งานไปแล้ว' };
    }

    // ลบ code ทันทีเพื่อป้องกัน Replay Attack (One-time use)
    globalAuthCodes.delete(params.code);

    if (Date.now() > entry.expiresAt) {
      return { success: false, error: 'invalid_grant: Authorization Code หมดอายุ' };
    }

    if (entry.clientId !== params.clientId) {
      return { success: false, error: 'invalid_grant: Client ID ไม่ตรงกับตอนขอ Authorization Code' };
    }

    if (params.redirectUri && entry.redirectUri !== params.redirectUri) {
      return { success: false, error: 'invalid_grant: Redirect URI ไม่ตรงกับตอนขอ Authorization Code' };
    }

    const tokens = this.generateTokenResponse({
      client,
      user: entry.user,
      scope: entry.scope,
    });

    return { success: true, tokens };
  }

  /**
   * รองรับ Client Credentials Grant (Machine-to-Machine API)
   */
  static issueClientCredentialsToken(params: {
    clientId: string;
    clientSecret: string;
    scope?: string;
  }): { success: boolean; tokens?: any; error?: string } {
    const client = this.validateClientCredentials(params.clientId, params.clientSecret);
    if (!client) {
      return { success: false, error: 'invalid_client: Client ID หรือ Client Secret ไม่ถูกต้อง' };
    }

    const tokens = this.generateTokenResponse({
      client,
      user: {
        providerId: 'SERVICE_ACCOUNT',
        fullName: client.name,
        hospitalCode: '11018',
        hospitalName: 'โรงพยาบาลหนองหาน',
        position: 'M2M Service Client',
      },
      scope: params.scope || 'hospital.read hospital.write hospital.11018',
    });

    return { success: true, tokens };
  }

  /**
   * สร้าง Signed JWT Access Token & ID Token
   */
  private static generateTokenResponse(params: {
    client: OAuthClientApp;
    user: any;
    scope: string;
  }) {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = 3600; // 1 ชั่วโมง

    const tokenPayload = {
      iss: 'https://sso.nhh.go.th',
      sub: params.user.providerId || params.user.accountId || params.client.clientId,
      aud: params.client.clientId,
      iat: now,
      exp: now + expiresIn,
      jti: crypto.randomUUID(),
      scope: params.scope,
      hospital: {
        code: '11018',
        name: 'โรงพยาบาลหนองหาน',
      },
      user: {
        cid: params.user.cid || params.user.citizen_id || '',
        provider_id: params.user.providerId || params.user.provider_id,
        full_name: params.user.fullName || params.user.full_name || params.user.name,
        position: params.user.position,
        hospital_code: '11018',
        hospital_name: 'โรงพยาบาลหนองหาน',
      },
    };

    const accessToken = this.signJwt(tokenPayload);

    // OpenID Connect id_token
    const idTokenPayload = {
      iss: 'https://sso.nhh.go.th',
      sub: params.user.providerId || params.user.accountId || params.client.clientId,
      aud: params.client.clientId,
      iat: now,
      exp: now + expiresIn,
      name: params.user.fullName || params.user.full_name || params.user.name,
      cid: params.user.cid || params.user.citizen_id || '',
      provider_id: params.user.providerId || params.user.provider_id,
      position: params.user.position,
      hospital_code: '11018',
      hospital_name: 'โรงพยาบาลหนองหาน',
      auth_time: now,
    };
    const idToken = this.signJwt(idTokenPayload);

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: expiresIn,
      id_token: idToken,
      scope: params.scope,
      user_profile: {
        providerId: params.user.providerId,
        fullName: params.user.fullName,
        position: params.user.position,
        hospitalCode: '11018',
        hospitalName: 'โรงพยาบาลหนองหาน',
      },
    };
  }

  /**
   * ตรวจสอบความถูกต้องของ Access Token
   */
  static verifyAccessToken(token: string): { valid: boolean; payload?: any; error?: string } {
    try {
      const payload = this.verifyJwt(token);
      if (!payload) return { valid: false, error: 'invalid_token: ลายมือชื่อโทเค็นไม่ถูกต้อง' };

      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return { valid: false, error: 'token_expired: โทเค็นหมดอายุ' };
      }

      return { valid: true, payload };
    } catch (err: any) {
      return { valid: false, error: err.message || 'invalid_token' };
    }
  }

  /**
   * ดึงข้อมูล OIDC UserInfo
   */
  static getUserInfo(token: string) {
    const verified = this.verifyAccessToken(token);
    if (!verified.valid || !verified.payload) {
      return { success: false, error: verified.error || 'Unauthorized' };
    }

    const payload = verified.payload;
    const user = payload.user || {};

    return {
      success: true,
      data: {
        sub: payload.sub,
        name: user.full_name || payload.name,
        cid: user.cid || payload.cid || '',
        provider_id: user.provider_id || payload.provider_id,
        position: user.position || payload.position,
        hospital_code: '11018',
        hospital_name: 'โรงพยาบาลหนองหาน',
        organization: {
          hcode: '11018',
          hname_th: 'โรงพยาบาลหนองหาน',
          hname_eng: 'Nonghan Hospital',
        },
        aud: payload.aud,
        iss: payload.iss,
      },
    };
  }

  /**
   * OIDC Discovery Metadata
   */
  static getOpenIdConfiguration(baseUrl: string) {
    return {
      issuer: baseUrl,
      authorization_endpoint: `${baseUrl}/oauth/authorize`,
      token_endpoint: `${baseUrl}/api/oauth/token`,
      userinfo_endpoint: `${baseUrl}/api/oauth/userinfo`,
      jwks_uri: `${baseUrl}/api/oauth/jwks`,
      response_types_supported: ['code'],
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['HS256'],
      scopes_supported: ['openid', 'profile', 'provider', 'hospital.11018'],
      token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
      claims_supported: ['sub', 'iss', 'aud', 'exp', 'iat', 'name', 'position', 'hospital_code', 'hospital_name'],
    };
  }

  // Helper JWT Signature (HMAC-SHA256)
  private static signJwt(payload: object): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  private static verifyJwt(token: string): any | null {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;

    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');

    if (signature !== expectedSignature) return null;

    try {
      const decodedPayload = Buffer.from(payload, 'base64url').toString('utf8');
      return JSON.parse(decodedPayload);
    } catch {
      return null;
    }
  }
}

