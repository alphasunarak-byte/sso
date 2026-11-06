import { NextRequest, NextResponse } from 'next/server';
import { OAuthIdpService } from '@/server/services/oauth/oauth-idp.service';
import { RegisterClientSchema, UpdateClientSchema, OAuthClientApp } from '@/schemas/oauth-idp.schema';
import { AuthService } from '@/server/services/auth/auth.service';
import { verifySessionToken } from '@/lib/session';

async function getSessionUser(request: NextRequest) {
  const nhhSessionVal = request.cookies.get('nhh_session')?.value;
  if (nhhSessionVal) {
    try {
      const decoded = decodeURIComponent(nhhSessionVal);
      const user = JSON.parse(decoded);
      if (user && (user.hospitalCode === '11018' || user.providerId || user.cid)) {
        return {
          ...user,
          isAdmin: AuthService.isSystemAdmin(user),
          role: AuthService.isSystemAdmin(user) ? 'ADMIN' : 'USER',
        };
      }
    } catch {}
  }

  const sessionVal = request.cookies.get('session')?.value;
  if (sessionVal) {
    try {
      const jwtPayload = await verifySessionToken(sessionVal);
      if (jwtPayload) {
        return {
          ...jwtPayload,
          isAdmin: AuthService.isSystemAdmin(jwtPayload),
          role: AuthService.isSystemAdmin(jwtPayload) ? 'ADMIN' : 'USER',
        };
      }
    } catch {}
    try {
      const decoded = decodeURIComponent(sessionVal);
      const user = JSON.parse(decoded);
      if (user) {
        return {
          ...user,
          isAdmin: AuthService.isSystemAdmin(user),
          role: AuthService.isSystemAdmin(user) ? 'ADMIN' : 'USER',
        };
      }
    } catch {}
  }

  return null;
}

function isClientOwner(client: OAuthClientApp, user: any): boolean {
  if (!client || !user) return false;
  if (user.isAdmin) return true;

  const userCid = (user.cid || user.citizen_id || '').toString().trim();
  const userHashCid = (user.hashCid || user.hash_cid || '').toString().trim().toLowerCase();
  const userProviderId = (user.providerId || user.accountId || '').toString().trim();
  const userName = (user.fullName || user.name || '').toString().trim();

  if (client.createdByCid) {
    if (userCid && client.createdByCid === userCid) return true;
    if (userHashCid && client.createdByCid.toLowerCase() === userHashCid) return true;
  }
  if (client.createdById && userProviderId && client.createdById === userProviderId) {
    return true;
  }
  if (client.createdByName && userName && client.createdByName === userName) {
    return true;
  }
  return false;
}

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  const url = new URL(request.url);
  const clientId = url.searchParams.get('client_id');

  if (clientId) {
    const client = OAuthIdpService.getClient(clientId);
    if (!client) {
      return NextResponse.json({ success: false, error: 'ไม่พบแอปพลิเคชัน' }, { status: 404 });
    }
    const isOwner = user && isClientOwner(client, user);
    if (isOwner) {
      return NextResponse.json({ success: true, client: { ...client, canEdit: true, canDelete: true } });
    }
    return NextResponse.json({
      success: true,
      client: {
        clientId: client.clientId,
        name: client.name,
        description: client.description,
        redirectUris: client.redirectUris,
        allowedScopes: client.allowedScopes,
        isTrusted: client.isTrusted,
        createdAt: client.createdAt,
        createdByName: client.createdByName,
        canEdit: false,
        canDelete: false,
      },
    });
  }

  if (!user) {
    return NextResponse.json({ success: false, error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  }

  const allClients = OAuthIdpService.listClients();

  // ส่งคืนแอปพลิเคชันทั้งหมดในโรงพยาบาลให้ผู้ใช้งานทุกคนเห็น
  // โดยระบุสิทธิ์ canEdit / canDelete เฉพาะแอปที่เป็นเจ้าของ หรือมีสิทธิ์ Admin เท่านั้น
  const clientsWithPermissions = allClients.map((c) => {
    const isOwnerOrAdmin = isClientOwner(c, user);
    return {
      ...c,
      canEdit: Boolean(isOwnerOrAdmin),
      canDelete: Boolean(isOwnerOrAdmin),
      clientSecret: isOwnerOrAdmin ? c.clientSecret : '••••••••••••••••••••••••••••••••',
    };
  });

  return NextResponse.json({ success: true, clients: clientsWithPermissions });
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'กรุณาเข้าสู่ระบบก่อนลงทะเบียนแอปพลิเคชัน' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parseResult = RegisterClientSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'ข้อมูลไม่ถูกต้อง',
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const newClient = OAuthIdpService.registerClient(parseResult.data, {
      cid: user.cid || '',
      hashCid: user.hashCid || '',
      providerId: user.providerId || '',
      fullName: user.fullName || '',
    });

    return NextResponse.json({ success: true, client: newClient }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const body = await request.json();
    const { clientId, ...updates } = body;

    if (!clientId || typeof clientId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'clientId จำเป็นต้องระบุ' },
        { status: 400 }
      );
    }

    const existing = OAuthIdpService.getClient(clientId);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบแอปพลิเคชันที่ต้องการแก้ไข' },
        { status: 404 }
      );
    }

    // ตรวจสอบสิทธิ์ความเป็นเจ้าของแอปพลิเคชัน
    if (!isClientOwner(existing, user)) {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิ์แก้ไขแอปพลิเคชันของผู้อื่น' },
        { status: 403 }
      );
    }

    const parseResult = UpdateClientSchema.safeParse(updates);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'ข้อมูลไม่ถูกต้อง',
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const updated = OAuthIdpService.updateClient(clientId, parseResult.data);
    return NextResponse.json({ success: true, client: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const url = new URL(request.url);
    let clientId = url.searchParams.get('client_id');

    if (!clientId) {
      try {
        const body = await request.json();
        clientId = body?.clientId;
      } catch {}
    }

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'client_id จำเป็นต้องระบุ' },
        { status: 400 }
      );
    }

    const existing = OAuthIdpService.getClient(clientId);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบแอปพลิเคชันที่ต้องการลบ' },
        { status: 404 }
      );
    }

    // ตรวจสอบสิทธิ์ความเป็นเจ้าของแอปพลิเคชัน
    if (!isClientOwner(existing, user)) {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิ์ลบแอปพลิเคชันของผู้อื่น' },
        { status: 403 }
      );
    }

    const deleted = OAuthIdpService.deleteClient(clientId);
    return NextResponse.json({ success: true, message: 'ลบแอปพลิเคชันเรียบร้อยแล้ว' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
