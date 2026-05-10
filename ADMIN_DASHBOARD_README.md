# DealGuard Admin Dashboard - Internal Use

**Access URL:** `https://dealguard-app.vercel.app/admin/dashboard`

## Overview

The Admin Dashboard is an internal-only monitoring tool for DealGuard operations team. It provides real-time visibility into:

- **Deployment Status** - Current version, environment, build info, and uptime
- **System Health** - Status of all critical services (Database, API, Blockchain, Payments, Notifications)
- **Key Metrics** - Active users, transaction count, escrow activity, failure rates
- **Transaction Activity** - 24-hour volume trends and status breakdown
- **System Events** - Recent activity log for debugging and auditing
- **API Performance** - Endpoint status and latency monitoring
- **External Services** - Third-party service health (Stellar, Stripe, SendGrid)

---

## Access & Security

### Requirements
- Internal team member credentials
- Access to internal dashboard IP/VPN (if applicable)
- `INTERNAL_API_KEY` environment variable for API calls

### API Endpoint
```
GET /api/admin/status
Authorization: Bearer <INTERNAL_API_KEY>
```

**Response:**
```json
{
  "deployment": {
    "version": "0.1.0",
    "environment": "production",
    "buildTime": "2026-05-10T14:32:00Z",
    "commitHash": "de29c5c",
    "uptime": "2h 34m"
  },
  "health": { ... },
  "metrics": { ... },
  "recentEvents": [ ... ]
}
```

---

## Key Metrics Explained

| Metric | Description | Target |
|--------|-------------|--------|
| **Active Users** | Users currently on platform | Monitor for spikes |
| **Total Transactions** | Lifetime transaction count | Growth tracking |
| **Active Escrows** | Escrows in progress | ≤ 200 |
| **Failed Transactions** | Failed payment/escrow operations | ≤ 5 per 24h |
| **Avg Response Time** | API response latency | ≤ 500ms |
| **Total Value** | Total escrow value locked | Growth tracking |

---

## System Health Indicators

### Status Colors
- 🟢 **Healthy (Green)** - All systems operational, latency normal
- 🟡 **Warning (Yellow)** - Minor issues, degraded performance, or elevated latency
- 🔴 **Error (Red)** - Service down, critical failures, investigation needed

### Critical Services
1. **Database** - PostgreSQL connection pool and query performance
2. **API** - Backend Express server health and response times
3. **Blockchain** - Stellar network connectivity and contract calls
4. **Payments** - Stripe/payment gateway integration status
5. **Notifications** - Email/SMS notification delivery service

---

## Monitoring Checklist

### Daily
- [ ] Review **System Health** - Ensure all services green
- [ ] Check **Failed Transactions** - Investigate if > 0
- [ ] Monitor **Average Response Time** - Alert if > 500ms

### Weekly
- [ ] Review **Transaction Activity Trends** - Identify patterns
- [ ] Check **Active Escrows** - Ensure normal distribution
- [ ] Audit **Recent System Events** - Look for anomalies
- [ ] Review **API Endpoint Latencies** - Identify bottlenecks

### Monthly
- [ ] Generate performance report
- [ ] Review growth metrics
- [ ] Analyze system capacity requirements
- [ ] Plan infrastructure scaling if needed

---

## Troubleshooting

### High API Latency
1. Check database connection pool status
2. Review backend server CPU/memory usage
3. Check network connectivity to Stellar/payment providers
4. Look for database query slowness in logs

### Failed Transactions
1. Check payment provider integration status
2. Verify blockchain network connectivity
3. Review transaction logs for error patterns
4. Contact payment provider if issues persist

### Service Outages
1. Check external service status pages (Stripe, Stellar, SendGrid)
2. Review recent deployments/changes
3. Check server resource utilization
4. Review error logs and event timeline

---

## Development & Updates

### Local Testing
```bash
# Start dashboard locally
npm run dev
# Visit http://localhost:3000/admin/dashboard
```

### Environment Variables
```env
# In .env.local (internal use only)
INTERNAL_API_KEY=your-secret-admin-key
NODE_ENV=production
```

### Adding New Metrics
1. Update `/src/app/api/admin/status/route.ts` to include new metric
2. Update `/src/app/admin/dashboard/page.tsx` to display metric
3. Add to monitoring checklist above
4. Deploy and test

---

## Alerts & Notifications

### Auto-Alerts (Send to Slack/Email)
- Failed transaction count > 5 in 1 hour
- API average latency > 1000ms
- Any service health = "error"
- Database connections > 40/50
- Transaction failure rate > 1%

**Setup Integration:**
```
TODO: Configure Slack/PagerDuty webhook
```

---

## Data Retention & Privacy

- Dashboard data is **internal only** - do not share publicly
- Real-time metrics refreshed every 30 seconds
- Historical data retained for 30 days
- All access logged for audit trail
- PII (user emails) never displayed in raw metrics

---

## Support & Escalation

### Issues & Alerts
1. **Tier 1 Alert** (Service healthy) - Monitor, no action
2. **Tier 2 Alert** (Service warning) - Investigate, prepare action plan
3. **Tier 3 Alert** (Service error) - Immediate investigation & fix required

### Contacts
- **Backend Engineer:** Escalate API/database issues
- **DevOps Engineer:** Escalate infrastructure/deployment issues
- **Payment Operations:** Escalate payment provider issues
- **Blockchain Engineer:** Escalate Stellar/contract issues

---

**Last Updated:** May 10, 2026  
**Version:** 1.0  
**Access Level:** Internal Team Only
