import { NextRequest, NextResponse } from 'next/server';

/**
 * Internal Admin API - System Status & Metrics
 * For internal dashboarding and monitoring only
 */

export async function GET(req: NextRequest) {
  // Check for internal authorization (basic check)
  const authHeader = req.headers.get('authorization');
  const isAuthorized = authHeader === `Bearer ${process.env.INTERNAL_API_KEY || 'admin-secret-key'}`;

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Simulate getting real metrics from database/backend
    // In production, fetch from actual backend API or database

    const systemStatus = {
      // Deployment Info
      deployment: {
        version: '0.1.0',
        environment: process.env.NODE_ENV || 'development',
        buildTime: new Date().toISOString(),
        commitHash: 'de29c5c',
        uptime: calculateUptime(),
      },

      // System Health
      health: {
        database: 'healthy',
        api: 'healthy',
        blockchain: 'healthy',
        payments: 'healthy',
        notifications: 'healthy',
      },

      // Live Metrics
      metrics: {
        activeUsers: 142,
        totalTransactions: 1284,
        totalValue: 2_450_000,
        activeEscrows: 89,
        failedTransactions: 3,
        averageResponseTime: 245,
      },

      // Transaction Breakdown
      transactionStatus: {
        completed: 1258,
        inProgress: 89,
        disputed: 28,
        failed: 3,
      },

      // Recent Events (mocked)
      recentEvents: [
        { time: new Date().toISOString(), type: 'Payment', message: 'Payment received', status: 'success' },
        { time: new Date(Date.now() - 3 * 60000).toISOString(), type: 'Escrow', message: 'New escrow created', status: 'info' },
        { time: new Date(Date.now() - 5 * 60000).toISOString(), type: 'Release', message: 'Funds released', status: 'success' },
      ],

      // API Endpoints Status
      endpoints: {
        '/api/auth': { status: 'operational', latency: 45 },
        '/api/escrow': { status: 'operational', latency: 120 },
        '/api/payments': { status: 'operational', latency: 250 },
        '/api/disputes': { status: 'operational', latency: 85 },
        '/api/wallet': { status: 'operational', latency: 60 },
        '/api/chat': { status: 'operational', latency: 75 },
        '/api/notifications': { status: 'operational', latency: 95 },
      },

      // Database Stats
      database: {
        connections: 15,
        maxConnections: 50,
        queries24h: 89234,
        avgQueryTime: 12,
      },

      // External Services
      externalServices: {
        stellar: { status: 'operational', latency: 340 },
        stripe: { status: 'operational', latency: 520 },
        sendgrid: { status: 'operational', latency: 180 },
      },
    };

    return NextResponse.json(systemStatus, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch system status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function calculateUptime(): string {
  // Calculate from deployment time (mocked)
  const deploymentTime = Date.now() - 9240000; // ~2h 34m ago
  const hours = Math.floor((Date.now() - deploymentTime) / (1000 * 60 * 60));
  const minutes = Math.floor(((Date.now() - deploymentTime) % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}
