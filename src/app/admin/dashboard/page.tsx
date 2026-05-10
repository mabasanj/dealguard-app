'use client';

import React, { useState, useEffect } from 'react';

interface DeploymentStatus {
  version: string;
  environment: string;
  buildTime: string;
  commitHash: string;
  uptime: string;
}

interface SystemMetrics {
  activeUsers: number;
  totalTransactions: number;
  totalValue: number;
  activeEscrows: number;
  failedTransactions: number;
  averageResponseTime: number;
}

export default function AdminDashboard() {
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus>({
    version: '0.1.0',
    environment: 'production',
    buildTime: new Date().toISOString(),
    commitHash: 'de29c5c',
    uptime: '2h 34m',
  });

  const [metrics, setMetrics] = useState<SystemMetrics>({
    activeUsers: 142,
    totalTransactions: 1284,
    totalValue: 2_450_000,
    activeEscrows: 89,
    failedTransactions: 3,
    averageResponseTime: 245,
  });

  const [systemHealth, setSystemHealth] = useState({
    database: 'healthy',
    api: 'healthy',
    blockchain: 'healthy',
    payments: 'healthy',
    notifications: 'healthy',
  });

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getHealthBg = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const statCard = (label: string, value: string | number, icon: string) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
        <div className="text-3xl opacity-20">{icon}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Internal monitoring & system status</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</p>
              <p className="text-xs text-gray-400 mt-1">Auto-refresh every 30s</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Deployment Status */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Deployment Status</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider">Version</p>
                <p className="text-lg font-bold text-gray-900 mt-1 font-mono">{deploymentStatus.version}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider">Environment</p>
                <p className="text-lg font-bold text-green-600 mt-1 uppercase">{deploymentStatus.environment}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider">Commit Hash</p>
                <p className="text-lg font-bold text-gray-900 mt-1 font-mono">{deploymentStatus.commitHash}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider">Build Time</p>
                <p className="text-sm text-gray-900 mt-1">{new Date(deploymentStatus.buildTime).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider">Uptime</p>
                <p className="text-lg font-bold text-gray-900 mt-1">{deploymentStatus.uptime}</p>
              </div>
            </div>
          </div>
        </section>

        {/* System Health */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">System Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Object.entries(systemHealth).map(([service, status]) => (
              <div key={service} className={`rounded-lg border p-4 ${getHealthBg(status)}`}>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900 capitalize">{service}</p>
                  <span className={`inline-flex items-center justify-center w-3 h-3 rounded-full ${getHealthColor(status)} bg-current opacity-20`}>
                    <span className="w-2 h-2 rounded-full bg-current"></span>
                  </span>
                </div>
                <p className={`text-sm font-medium mt-2 ${getHealthColor(status)}`}>{status.toUpperCase()}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Key Metrics */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Key Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {statCard('Active Users', metrics.activeUsers, '👥')}
            {statCard('Total Transactions', metrics.totalTransactions, '💰')}
            {statCard('Active Escrows', metrics.activeEscrows, '🔒')}
            {statCard('Failed Tx', metrics.failedTransactions, '❌')}
            {statCard('Avg Response', `${metrics.averageResponseTime}ms`, '⚡')}
            {statCard('Total Value', `R${(metrics.totalValue / 1_000_000).toFixed(1)}M`, '💳')}
          </div>
        </section>

        {/* Transaction Volume */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Transaction Activity (Last 24h)</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Volume Chart Placeholder */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 lg:col-span-2">
              <div className="h-64 flex items-end justify-between gap-1">
                {[65, 72, 68, 75, 82, 70, 78, 85, 80, 76, 88, 92, 89, 85, 90, 95, 92, 88, 85, 80, 75, 70, 65, 60].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t opacity-80 hover:opacity-100 transition"
                    style={{ height: `${(h / 100) * 100}%` }}
                  ></div>
                ))}
              </div>
              <div className="mt-4 flex justify-between text-xs text-gray-500">
                <span>00:00</span>
                <span>12:00</span>
                <span>23:59</span>
              </div>
            </div>

            {/* Stats Breakdown */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Completed</span>
                  <span className="font-bold text-gray-900">1,258</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: '85%' }}></div>
                </div>
                <div className="flex justify-between items-center pt-3">
                  <span className="text-gray-600">In Progress</span>
                  <span className="font-bold text-gray-900">89</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: '6%' }}></div>
                </div>
                <div className="flex justify-between items-center pt-3">
                  <span className="text-gray-600">Disputed</span>
                  <span className="font-bold text-gray-900">28</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500" style={{ width: '2%' }}></div>
                </div>
                <div className="flex justify-between items-center pt-3">
                  <span className="text-gray-600">Failed</span>
                  <span className="font-bold text-gray-900">3</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500" style={{ width: '0.2%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Events */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent System Events</h2>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-200">
              {[
                { time: '14:32:51', type: 'Payment', message: 'R50,000 payment received from buyer ID #4521', status: 'success' },
                { time: '14:28:15', type: 'Escrow', message: 'New escrow created: 15x iPhone 15 Pro - R450,000', status: 'info' },
                { time: '14:25:42', type: 'Release', message: 'Escrow #3847 funds released to seller', status: 'success' },
                { time: '14:22:19', type: 'Dispute', message: 'Dispute opened for escrow #3842', status: 'warning' },
                { time: '14:19:03', type: 'System', message: 'Database backup completed (2.4GB)', status: 'info' },
              ].map((event, i) => (
                <div key={i} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition">
                  <span className="text-xs font-mono text-gray-500 min-w-[70px]">{event.time}</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium min-w-[70px] text-center ${
                      event.status === 'success'
                        ? 'bg-green-50 text-green-700'
                        : event.status === 'warning'
                        ? 'bg-yellow-50 text-yellow-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {event.type}
                  </span>
                  <span className="text-sm text-gray-600 flex-1">{event.message}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>DealGuard Admin Dashboard • Deployment: {deploymentStatus.version} • Built for internal use only</p>
        </div>
      </div>
    </div>
  );
}
