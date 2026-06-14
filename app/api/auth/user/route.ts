import { NextResponse } from 'next/server';

function parseMockUserFromCookie(cookieHeader: string | null) {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|; )mock_user=([^;]+)/);
  if (!match) return null;
  try {
    const decoded = decodeURIComponent(match[1]);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const cookieHeader = req.headers.get('cookie');
  const user = parseMockUserFromCookie(cookieHeader);

  if (user) {
    return NextResponse.json({ success: true, user });
  }

  return NextResponse.json({ success: false });
}
