import { NextRequest } from 'next/server';
import { proxyToBackend } from '../../_utils/proxy';

export async function POST(request: NextRequest) {
  // Buffer the body once so it can be forwarded regardless of fallback path
  const body = await request.text();
  const headers = new Headers(request.headers);

  const makeRequest = () =>
    new NextRequest(new Request(`${request.nextUrl.origin}${request.nextUrl.pathname}`, {
      method: 'POST',
      headers,
      body,
    }));

  const registerResponse = await proxyToBackend(makeRequest(), '/auth/register');

  if (registerResponse.status === 404) {
    return proxyToBackend(makeRequest(), '/auth/signup');
  }

  return registerResponse;
}