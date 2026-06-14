import { NextResponse } from 'next/server';

export async function GET() {
  const res = NextResponse.json({ message: 'logged out' });
  // Clear the mock cookie
  res.headers.set('Set-Cookie', 'mock_user=; Path=/; HttpOnly; Max-Age=0');
  return res;
}
