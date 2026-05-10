# DealGuard Internal Dashboard - Quick Reference

## 🎯 What is This?

**Internal Monitoring Dashboard** for DealGuard operations team to track:
- System health & performance
- Real-time transaction metrics  
- Deployment status
- Active service monitoring

---

## 📊 Dashboard Sections

### 1. **Deployment Status** (Top)
Shows current production version and build info:
- **Version:** Current app version (e.g., 0.1.0)
- **Environment:** production/staging
- **Commit Hash:** Latest code deployment ID
- **Build Time:** When last deployed
- **Uptime:** How long services have been running

**Action if Issue:** Check recent deployments in Vercel dashboard

---

### 2. **System Health** (5 Services)
Quick status indicator for critical services:

| Service | What it is | Alert threshold |
|---------|-----------|-----------------|
| 🟢 **Database** | PostgreSQL connection | Any RED status |
| 🟢 **API** | Backend server | Any RED status |
| 🟢 **Blockchain** | Stellar network | Any RED status |
| 🟢 **Payments** | Stripe integration | Any RED status |
| 🟢 **Notifications** | Email/SMS service | Any RED status |

**Action if Red:** Page backend engineer immediately

---

### 3. **Key Metrics** (6 Cards)

```
👥 Active Users      → How many users online right now
💰 Total Tx          → Lifetime transaction count
🔒 Active Escrows    → Deals currently in progress
❌ Failed Tx         → Failed transactions (should be 0-3)
⚡ Avg Response      → API speed in milliseconds (< 500ms = good)
💳 Total Value       → Money locked in escrows (trends matter)
```

**Action if Issue:**
- Failed TX > 5 → Check payment provider
- Response time > 500ms → Contact backend team
- Active escrows > 200 → May need to scale

---

### 4. **Transaction Activity Chart** (24-hour)
Bar chart showing transaction volume by hour + status breakdown.

**What to look for:**
- ✅ Smooth curve with normal peaks/valleys
- ⚠️ Sudden drops = possible outage
- ⚠️ Spike in failures = investigate

**Status Breakdown:**
- 🟢 Completed (85% = healthy)
- 🔵 In Progress (6% = normal)
- 🟡 Disputed (2% = monitor)
- 🔴 Failed (< 1% = healthy)

---

### 5. **Recent System Events** (Log)
Last 5 events with timestamp and status:

Example:
```
14:32:51 | Payment  | ✅ R50,000 received from buyer #4521
14:28:15 | Escrow   | ℹ️ New deal: 15x iPhone 15 Pro
14:25:42 | Release  | ✅ Escrow #3847 funds released
14:22:19 | Dispute  | ⚠️ Dispute opened for escrow #3842
14:19:03 | System   | ℹ️ Database backup completed (2.4GB)
```

**Action if Issue:** Click on event to investigate in system logs

---

## 🚨 Alert Severity

### 🟢 GREEN (No Action)
- All services operational
- Response time < 500ms
- Failed transactions = 0-2 per hour

### 🟡 YELLOW (Monitor)
- Response time 500-1000ms
- 1-2 services warning status
- Failed transactions 3-5 per hour
- **Action:** Watch for escalation

### 🔴 RED (Immediate Action)
- Any service down
- Response time > 1000ms
- Failed transactions > 5 per hour
- Users reporting errors
- **Action:** Page on-call engineer NOW

---

## 📋 Daily Checklist (5 min)

```
☐ System Health = All Green?
☐ Failed TX ≤ 3?
☐ Response time < 500ms?
☐ No spike in active escrows?
☐ Recent events look normal?

If ANY red = Escalate immediately
```

---

## 🔧 Common Issues & Fixes

### API Latency High (> 500ms)
```
1. Check database connections (max 50)
2. Restart backend if stuck processes
3. Check Stellar network status
4. Contact backend engineer
```

### Payments Failing (Red indicator)
```
1. Check Stripe status page
2. Verify API keys in production
3. Check CORS/webhook configuration
4. Contact Stripe support if needed
```

### Blockchain (Stellar) Down
```
1. Check https://status.stellar.org
2. Verify network URLs in config
3. Check contract deployment status
4. Contact blockchain engineer
```

### Database Connection Issues
```
1. Check PostgreSQL service status
2. Verify connection string in env
3. Check connection pool not maxed (50)
4. Restart if stuck, then contact DBA
```

---

## 📞 Who to Call

| Issue | Contact | Slack |
|-------|---------|-------|
| API/Backend | Backend Lead | #backend-oncall |
| Database | DevOps Engineer | #devops-oncall |
| Payments | Payment Ops | #payments |
| Stellar/Blockchain | Blockchain Lead | #blockchain |
| Frontend/UI | Frontend Lead | #frontend |
| Deployment | DevOps | #deployments |

---

## 📱 Access & Login

**URL:** `https://dealguard-app.vercel.app/admin/dashboard`

**Who can access:**
- Core team only (engineers, ops)
- NOT customer-facing
- NOT public

**API (for automation):**
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://dealguard-app.vercel.app/api/admin/status
```

---

## 🔄 Auto-Refresh

Dashboard refreshes every **30 seconds** automatically.  
Last updated timestamp shown in top-right.

Manual refresh: **F5** or browser refresh button

---

## ❓ FAQ

**Q: Why is response time 600ms?**  
A: Might be normal spike. If sustained > 15 min, investigate API/DB.

**Q: What if I see a failed transaction?**  
A: Check payment provider status. 1-2 failures normal. >5 = escalate.

**Q: How often should I check dashboard?**  
A: Start of day (5 min), then spot-check 2-3x during day.

**Q: Can I share this with customers?**  
A: **NO** - Internal only. Create separate status page for customers.

**Q: How to add new metrics?**  
A: Edit `/src/app/api/admin/status/route.ts` then redeploy.

---

## 📚 Full Documentation

See `ADMIN_DASHBOARD_README.md` for complete guide including:
- Detailed metric explanations
- Troubleshooting procedures
- Development setup
- Alert configuration
- Data retention policies

---

**Last Updated:** May 10, 2026  
**For:** DealGuard Internal Team  
**Confidential - Do Not Share**
