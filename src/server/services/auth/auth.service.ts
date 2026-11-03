import crypto from 'crypto';
import { Environment } from '@/schemas/auth.schema';

export interface ProviderCredentials {
  clientId: string;
  secretKey: string;
}

export interface UserSessionData {
  providerId: string;
  accountId: string;
  hashCid: string;
  cid?: string;
  fullName: string;
  title?: string;
  position?: string;
  department?: string;
  hospitalCode: string;
  hospitalName: string;
  licenseId?: string;
  expertise?: string;
  isHrAdmin?: boolean;
  isDirector?: boolean;
  role: 'ADMIN' | 'USER';
  isAdmin: boolean;
  loginBy: string;
  environment: 'UAT' | 'PRD';
  authenticatedAt: string;
}

export interface SystemAuthConfig {
  hospitalCode: string;
  hospitalName: string;
  serviceName: string;
  purpose: string;
  healthId: {
    uat: ProviderCredentials;
    prd: ProviderCredentials;
  };
  providerId: {
    uat: ProviderCredentials;
    prd: ProviderCredentials;
  };
}

export const NHH_AUTH_CONFIG: SystemAuthConfig = {
  hospitalCode: '11018',
  hospitalName: 'โรงพยาบาลหนองหาน',
  serviceName: 'Super App By รพ.หนองหาน',
  purpose: 'ใช้ API เป็นหลักและ Monitor',
  healthId: {
    uat: {
      clientId: process.env.MOPH_CLIENT_ID_UAT || '019eca47-a5e4-7bf3-bc6d-45fed747be13',
      secretKey: process.env.MOPH_CLIENT_SECRET_UAT || '0aea89f1e97b141b88902e8b551eb9d31b3c4dc7',
    },
    prd: {
      clientId: process.env.MOPH_CLIENT_ID_PRD || '019eca47-ca58-7deb-9feb-bd1f06956605',
      secretKey: process.env.MOPH_CLIENT_SECRET_PRD || '0892b41db2e8e3ad42f906ea92468918a41e5c82',
    },
  },
  providerId: {
    uat: {
      clientId: process.env.PROVIDER_CLIENT_ID_UAT || '3018aa53-7f2e-4dad-bc85-947355d58123',
      secretKey: process.env.PROVIDER_SECRET_KEY_UAT || '5vlVlHbgTt4THf90hYBzIh6wfYexJ2Dd',
    },
    prd: {
      clientId: process.env.PROVIDER_CLIENT_ID_PRD || '95e5b7ca-0ff9-4989-bb74-81812eda4d4f',
      secretKey: process.env.PROVIDER_SECRET_KEY_PRD || 'UVAh5o6onyOLUYSJSjAMeLApAZWMboWn',
    },
  },
};

export class AuthService {
  /**
   * รายการเลขบัตรประชาชนที่ได้รับสิทธิ์เป็น ผู้ดูแลระบบ (Admin)
   * โหลดจาก Environment Variable ADMIN_CIDS (คั่นด้วยจุลภาค)
   */
  static getAdminCids(): string[] {
    const envCids = process.env.ADMIN_CIDS;
    if (envCids) {
      return envCids.split(',').map((c) => c.trim()).filter(Boolean);
    }
    return ['1439900002681'];
  }

  static getAdminHashCids(): string[] {
    const envHashes = process.env.ADMIN_HASH_CIDS;
    if (envHashes) {
      return envHashes.split(',').map((h) => h.trim().toLowerCase()).filter(Boolean);
    }
    return ['fb76972749bff90cca10057a798a54acc84d8512bc3d77e3e9589b61fcc5728d'];
  }

  /**
   * ตรวจสอบสิทธิ์ระดับผู้ดูแลระบบ (Admin)
   * เฉพาะเลขประจำตัวประชาชนที่กำหนดเท่านั้น ส่วนคนอื่นเป็นผู้ใช้งานทั่วไป (User)
   */
  static isSystemAdmin(userOrProfile: any): boolean {
    if (!userOrProfile) return false;

    const rawCid = (
      userOrProfile.cid ||
      userOrProfile.citizen_id ||
      userOrProfile.id_card ||
      userOrProfile.account_id ||
      userOrProfile.provider_id ||
      ''
    ).toString().trim();

    const adminCids = this.getAdminCids();
    if (adminCids.includes(rawCid)) return true;

    const hashCid = (
      userOrProfile.hash_cid ||
      userOrProfile.hashCid ||
      ''
    ).toString().trim().toLowerCase();

    const adminHashCids = this.getAdminHashCids();
    if (adminHashCids.includes(hashCid)) return true;

    if (rawCid) {
      try {
        const computed = crypto.createHash('sha256').update(rawCid).digest('hex').toLowerCase();
        if (adminHashCids.includes(computed)) return true;
      } catch {}
    }

    return false;
  }

  /**
   * ดึงค่า URL ระบบจริง (Production) ของกระทรวงสาธารณสุข
   * Health ID: https://moph.id.th
   * Provider ID: https://provider.id.th
   */
  static getEndpoints(_env: 'UAT' | 'PRD' = 'PRD') {
    return {
      healthIdUrl: 'https://moph.id.th',
      providerIdUrl: 'https://provider.id.th',
    };
  }

  static getActiveEnvironment(): 'UAT' | 'PRD' {
    return 'PRD';
  }

  static getCredentials(_env: 'UAT' | 'PRD' = 'PRD') {
    return {
      environment: 'PRD' as const,
      hospital: {
        code: NHH_AUTH_CONFIG.hospitalCode,
        name: NHH_AUTH_CONFIG.hospitalName,
        serviceName: NHH_AUTH_CONFIG.serviceName,
      },
      healthId: NHH_AUTH_CONFIG.healthId.prd,
      providerId: NHH_AUTH_CONFIG.providerId.prd,
    };
  }

  /**
   * ส่วนที่ 1 : สร้าง URL สำหรับ Redirect ไปยัง Health ID OAuth
   * รูปแบบ: {HealthID-URL}/oauth/redirect?client_id={client_id}&redirect_uri={redirect_uri}&response_type=code&state={state}
   */
  static buildOAuthRedirectUrl(params: {
    redirectUri: string;
    state: string;
    env?: 'UAT' | 'PRD';
  }): string {
    const env = params.env || this.getActiveEnvironment();
    const { healthIdUrl } = this.getEndpoints(env);
    const creds = this.getCredentials(env).healthId;

    const url = new URL(`${healthIdUrl}/oauth/redirect`);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', creds.clientId);
    url.searchParams.set('redirect_uri', params.redirectUri);
    url.searchParams.set('state', params.state);

    return url.toString();
  }

  /**
   * ส่วนที่ 1 ข้อ 2 : Token Request - แลกเปลี่ยน Authorization Code เป็น Access Token ของ Health ID
   * POST {HealthID-URL}/api/v1/token
   */
  static async exchangeHealthIdToken(params: {
    code: string;
    redirectUri: string;
    env?: 'UAT' | 'PRD';
  }): Promise<{ success: boolean; accessToken?: string; raw?: any; error?: string }> {
    const env = params.env || this.getActiveEnvironment();
    const { healthIdUrl } = this.getEndpoints(env);
    const creds = this.getCredentials(env).healthId;

    try {
      const response = await fetch(`${healthIdUrl}/api/v1/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: params.code,
          redirect_uri: params.redirectUri,
          client_id: creds.clientId,
          client_secret: creds.secretKey,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data) {
        console.error('[Health ID Token Exchange Error]', response.status, data);
        return {
          success: false,
          error: data?.message || `Token exchange failed with status ${response.status}`,
          raw: data,
        };
      }

      // ดึง access_token จาก data.data.access_token หรือ data.access_token ตามสเปก
      const accessToken = data.data?.access_token || data.access_token;
      if (!accessToken) {
        return {
          success: false,
          error: 'No access_token found in Health ID response',
          raw: data,
        };
      }

      return {
        success: true,
        accessToken,
        raw: data,
      };
    } catch (err: any) {
      console.error('[Health ID Token Exchange Exception]', err?.message, err?.cause);
      return {
        success: false,
        error: err?.cause?.message || err?.message || 'Network error during Health ID token exchange',
      };
    }
  }

  /**
   * ส่วนที่ 2 ข้อ 1 : ขอ Access Token ของระบบ Provider ID ด้วย Access Token ของ Health ID
   * POST {Provider-URL}/api/v1/services/token
   * Body: { client_id, secret_key, token_by: 'Health ID', token: healthIdAccessToken }
   */
  static async exchangeProviderServiceToken(params: {
    healthIdAccessToken: string;
    env?: 'UAT' | 'PRD';
  }): Promise<{ success: boolean; serviceAccessToken?: string; raw?: any; error?: string }> {
    const env = params.env || this.getActiveEnvironment();
    const { providerIdUrl } = this.getEndpoints(env);
    const creds = this.getCredentials(env).providerId;

    const payload = {
      client_id: creds.clientId,
      secret_key: creds.secretKey,
      token_by: 'Health ID',
      token: params.healthIdAccessToken,
    };

    try {
      // ทดลองส่งแบบ JSON ตามเอกสารคู่มือ สธ. ส่วนที่ 2 ข้อ 1
      let response = await fetch(`${providerIdUrl}/api/v1/services/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // ถ้าเซิร์ฟเวอร์ต้องการ form-urlencoded ให้ลอง fallback
      if (!response.ok && response.status === 400) {
        response = await fetch(`${providerIdUrl}/api/v1/services/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams(payload),
        });
      }

      const data = await response.json().catch(() => null);

      if (!response.ok || !data) {
        return {
          success: false,
          error: data?.message || data?.message_th || `Provider token failed with status ${response.status}`,
          raw: data,
        };
      }

      const serviceAccessToken = data.data?.access_token || data.access_token;
      if (!serviceAccessToken) {
        return {
          success: false,
          error: data.message || 'No service access_token in Provider ID response',
          raw: data,
        };
      }

      return {
        success: true,
        serviceAccessToken,
        raw: data,
      };
    } catch (err: any) {
      console.error('[Provider ID Service Token Exchange Exception]', err?.message, err?.cause);
      return {
        success: false,
        error: err?.cause?.message || err.message || 'Network error during Provider ID service token exchange',
      };
    }
  }

  /**
   * ส่วนที่ 2 ข้อ 2 : ขอข้อมูลส่วนบุคคล และข้อมูลการทำงาน จากระบบ Provider ID
   * GET {Provider-URL}/api/v1/services/profile
   * Headers: Authorization: Bearer {serviceAccessToken}, client-id, secret-key
   */
  static async fetchProviderProfile(params: {
    serviceAccessToken: string;
    env?: 'UAT' | 'PRD';
  }): Promise<{ success: boolean; profile?: any; error?: string }> {
    const env = params.env || this.getActiveEnvironment();
    const { providerIdUrl } = this.getEndpoints(env);
    const creds = this.getCredentials(env).providerId;

    try {
      const response = await fetch(`${providerIdUrl}/api/v1/services/profile?position_type=1&moph_idp_permission=1`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${params.serviceAccessToken}`,
          'client-id': creds.clientId,
          'secret-key': creds.secretKey,
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data) {
        return {
          success: false,
          error: data?.message || `Provider profile fetch failed with status ${response.status}`,
        };
      }

      return {
        success: true,
        profile: data.data || data,
      };
    } catch (err: any) {
      console.error('[Provider ID Fetch Profile Exception]', err?.message, err?.cause);
      return {
        success: false,
        error: err?.cause?.message || err.message || 'Network error fetching Provider ID profile',
      };
    }
  }

  /**
   * ตรวจสอบสิทธิ์เฉพาะบุคลากรของ โรงพยาบาลหนองหาน [11018]
   * ตามข้อกำหนดระบบ:
   * "ระบบหลังบ้านนี้จำกัดสิทธิ์เฉพาะบุคลากรของ โรงพยาบาลหนองหาน [11018] ที่ผ่านการยืนยันตัวตนด้วย Provider ID กระทรวงสาธารณสุข เท่านั้น"
   */
  static verifyNonghanHospitalAffiliation(profile: any): {
    authorized: boolean;
    nonghanOrg?: any;
    reason?: string;
  } {
    if (!profile) {
      return { authorized: false, reason: 'ไม่พบข้อมูลโปรไฟล์จาก Provider ID' };
    }

    // organization ในเอกสารอาจเป็น Array หรือ Object เดี่ยว
    const rawOrg = profile.organization;
    const orgList = Array.isArray(rawOrg) ? rawOrg : rawOrg ? [rawOrg] : [];

    const nonghanOrg = orgList.find((org: any) => {
      const hcode = String(org?.hcode ?? '').trim();
      return hcode === NHH_AUTH_CONFIG.hospitalCode;
    });

    if (!nonghanOrg) {
      return {
        authorized: false,
        reason: `บัญชี Provider ID นี้ไม่ได้สังกัดโรงพยาบาลหนองหาน [${NHH_AUTH_CONFIG.hospitalCode}]`,
      };
    }

    return {
      authorized: true,
      nonghanOrg,
    };
  }

  /**
   * ทดสอบยิง Request จริงไปยัง API กระทรวงสาธารณสุข และวัดค่าความเร็วตอบสนองจริง (Real Live Probe)
   */
  static async testLiveEndpoint(req: {
    environment?: 'UAT' | 'PRD';
    provider?: 'PROVIDER_ID' | 'HEALTH_ID';
    hospitalCode?: string;
    serviceName?: string;
  }) {
    const env = req.environment || this.getActiveEnvironment();
    const { healthIdUrl, providerIdUrl } = this.getEndpoints(env);
    const creds = this.getCredentials(env);
    const isHealth = req.provider === 'HEALTH_ID';
    const targetUrl = isHealth
      ? `${healthIdUrl}/api/v1/token`
      : `${providerIdUrl}/api/v1/services/token`;
    const selectedCreds = isHealth ? creds.healthId : creds.providerId;

    const startTime = Date.now();
    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: selectedCreds.clientId,
          grant_type: 'probe',
        }),
      });

      const responseTimeMs = Date.now() - startTime;
      const data = await response.json().catch(() => null);

      return {
        success: true,
        data: {
          provider: req.provider || 'PROVIDER_ID',
          endpoint: targetUrl,
          status: response.status < 500 ? 'ONLINE' : 'DEGRADED',
          httpStatus: response.status,
          responseTimeMs,
          clientId: selectedCreds.clientId,
          hospitalCode: NHH_AUTH_CONFIG.hospitalCode,
          serviceName: NHH_AUTH_CONFIG.serviceName,
          environment: env,
          checkedAt: new Date().toISOString(),
          mophResponse: data?.message || `HTTP ${response.status}`,
        },
      };
    } catch (err: any) {
      const responseTimeMs = Date.now() - startTime;
      return {
        success: false,
        data: {
          provider: req.provider || 'PROVIDER_ID',
          endpoint: targetUrl,
          status: 'OFFLINE',
          httpStatus: 0,
          responseTimeMs,
          clientId: selectedCreds.clientId,
          hospitalCode: NHH_AUTH_CONFIG.hospitalCode,
          serviceName: NHH_AUTH_CONFIG.serviceName,
          environment: env,
          checkedAt: new Date().toISOString(),
          error: err?.message || 'Connection failed',
        },
      };
    }
  }
}
