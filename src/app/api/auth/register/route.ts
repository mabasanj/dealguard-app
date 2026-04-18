import { NextRequest } from 'next/server';
import { proxyToBackend } from '../../_utils/proxy';

export async function POST(request: NextRequest) {
  const registerResponse = await proxyToBackend(new NextRequest(request.clone()), '/auth/register');

  if (registerResponse.status === 404) {
    return proxyToBackend(request, '/auth/signup');
  }

  return registerResponse;
}