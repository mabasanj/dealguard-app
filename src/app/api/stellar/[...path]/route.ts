import { NextRequest } from 'next/server';
import { proxyToBackend } from '../../_utils/proxy';

function buildPath(segments: string[]): string {
  return `/stellar/${segments.join('/')}`;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyToBackend(request, buildPath(path));
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyToBackend(request, buildPath(path));
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyToBackend(request, buildPath(path));
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyToBackend(request, buildPath(path));
}
