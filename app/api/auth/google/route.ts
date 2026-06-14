import { NextResponse } from 'next/server';

// Mock Google OAuth entrypoint for local development.
// Sets a cookie with a mock user payload and redirects back to the app.
export async function GET(req: Request) {
  const user = {
    id: 'local-1',
    name: 'Local Dev User',
    email: 'local@example.com',
  };

  const cookieValue = encodeURIComponent(JSON.stringify(user));
  const origin = new URL(req.url).origin;
  const callbackUrl = new URL('/auth/callback', origin);

  const res = NextResponse.redirect(callbackUrl);
  // Basic cookie for mock session
  res.headers.set(
    'Set-Cookie',
    `mock_user=${cookieValue}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`
  );

  return res;
}
