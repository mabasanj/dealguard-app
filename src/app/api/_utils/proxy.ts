import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

function sanitizeRequestHeaders(request: NextRequest): Headers {
  const headers = new Headers();

  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === 'host' || lower === 'connection' || lower === 'content-length') {
      return;
    }
    headers.set(key, value);
  });

  return headers;
}

function buildTargetUrl(pathname: string, search: string): string {
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${base}${path}${search}`;
}

export async function proxyToBackend(request: NextRequest, backendPath: string): Promise<NextResponse> {
  const target = buildTargetUrl(backendPath, request.nextUrl.search);
  const method = request.method;
  const headers = sanitizeRequestHeaders(request);

  const hasBody = method !== 'GET' && method !== 'HEAD';
  const rawBody = hasBody ? await request.text() : undefined;

  try {
    const backendResponse = await fetch(target, {
      method,
      headers,
      body: rawBody && rawBody.length > 0 ? rawBody : undefined,
      redirect: 'manual',
      cache: 'no-store',
    });

    const responseHeaders = new Headers();
    backendResponse.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (lower === 'content-length' || lower === 'connection' || lower === 'transfer-encoding') {
        return;
      }
      responseHeaders.set(key, value);
    });

    const body = await backendResponse.arrayBuffer();
    return new NextResponse(body, {
      status: backendResponse.status,
      headers: responseHeaders,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Backend proxy request failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 502 }
    );
  }
}
