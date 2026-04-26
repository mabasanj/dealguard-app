import { NextRequest } from 'next/server';
import { proxyToBackend } from '../_utils/proxy';

export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/stellar');
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request, '/stellar');
}

export async function PUT(request: NextRequest) {
  return proxyToBackend(request, '/stellar');
}

export async function DELETE(request: NextRequest) {
  return proxyToBackend(request, '/stellar');
}
