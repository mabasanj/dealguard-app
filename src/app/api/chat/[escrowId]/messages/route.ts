import { NextRequest } from 'next/server';
import { proxyToBackend } from '../../../_utils/proxy';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ escrowId: string }> }
) {
  const { escrowId } = await params;
  return proxyToBackend(request, `/chat/${escrowId}/messages`);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ escrowId: string }> }
) {
  const { escrowId } = await params;
  return proxyToBackend(request, `/chat/${escrowId}/messages`);
}