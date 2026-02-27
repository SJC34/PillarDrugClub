# AWS Migration Guide
## Pharmacy Autopilot — Replit to AWS

**Last Updated:** February 2026  
**Prepared By:** Seth Collins, Pharm.D.

---

## 1. Architecture Overview

| Component | Current (Replit) | Target (AWS) |
|-----------|-----------------|-------------|
| Hosting | Replit | AWS EC2 or ECS |
| Database | Neon (serverless PostgreSQL) | AWS RDS PostgreSQL |
| Payment | Stripe | Square |
| File Storage | In-memory | AWS S3 |
| Secrets | Replit Secrets | AWS Secrets Manager |
| Domain | pharmacyautopilot.com | Route 53 + ACM SSL |
| CI/CD | Manual | GitHub Actions |

---

## 2. Database Migration (Neon to AWS RDS)

### 2.1 What Changed in the Codebase

The database driver has been updated from Neon's serverless driver to standard PostgreSQL:

**Before (`server/db.ts`):**
```typescript
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
neonConfig.webSocketConstructor = ws;
```

**After (`server/db.ts`):**
```typescript
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
```

This makes the app compatible with any standard PostgreSQL instance, including AWS RDS, without any code changes.

### 2.2 Creating the RDS Instance

```bash
aws rds create-db-instance \
  --db-instance-identifier pharmacyautopilot-prod \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.4 \
  --master-username pharmacyadmin \
  --master-user-password YOUR_SECURE_PASSWORD \
  --db-name pharmacyautopilot \
  --allocated-storage 20 \
  --storage-type gp3 \
  --storage-encrypted \
  --vpc-security-group-ids sg-xxxxxx \
  --db-subnet-group-name your-private-subnet-group \
  --backup-retention-period 7 \
  --deletion-protection \
  --no-publicly-accessible
```

**Required for HIPAA:**
- `--storage-encrypted` — encryption at rest
- `--no-publicly-accessible` — private VPC subnet only
- `--deletion-protection` — prevents accidental deletion
- Enable SSL enforcement in RDS parameter group: `rds.force_ssl = 1`

### 2.3 Migrating Data from Neon to RDS

```bash
# Step 1: Export current data from Neon
pg_dump "$NEON_DATABASE_URL" --no-owner --no-acl > pharmacy_backup_$(date +%Y%m%d).sql

# Step 2: Import into RDS (from within VPC or via SSH tunnel)
psql "$RDS_DATABASE_URL" < pharmacy_backup_$(date +%Y%m%d).sql

# Step 3: Apply any pending schema changes
DATABASE_URL="$RDS_DATABASE_URL" npm run db:push
```

### 2.4 RDS Connection String Format

```
postgresql://username:password@instance.xxxx.us-east-1.rds.amazonaws.com:5432/pharmacyautopilot?sslmode=require
```

Set this as the `DATABASE_URL` environment variable in AWS Secrets Manager.

---

## 3. Payment Migration (Stripe to Square)

### 3.1 What Changed

The payment processor has been fully migrated from Stripe to Square. The codebase no longer imports or uses the Stripe SDK.

**New environment variables required:**
```
SQUARE_ACCESS_TOKEN=EAAAl...
SQUARE_LOCATION_ID=L...
SQUARE_PLAN_VARIATION_ID=...
SQUARE_WEBHOOK_SIGNATURE_KEY=...
SQUARE_WEBHOOK_URL=https://pharmacyautopilot.com/api/webhooks/square
VITE_SQUARE_APP_ID=sq0idp-...
VITE_SQUARE_LOCATION_ID=L...
VITE_SQUARE_SANDBOX=false
```

### 3.2 Square Setup Steps

1. Create a Square Developer account at https://developer.squareup.com
2. Create an Application in the Square Developer Dashboard
3. Note your `Application ID` and `Access Token`
4. Enable Subscriptions in your Square Dashboard
5. Create a Subscription Plan in the Square Catalog:
   - Name: "Pharmacy Autopilot Annual Membership"
   - Price: $99.00 USD / year
   - Note the `Plan Variation ID`
6. Get your `Location ID` from the Square Dashboard
7. Configure the webhook endpoint in Square:
   - URL: `https://pharmacyautopilot.com/api/webhooks/square`
   - Events: `subscription.updated`, `payment.completed`

### 3.3 Database Schema Changes

Three new columns were added to the `users` table:
- `square_customer_id` — Square customer ID
- `square_subscription_id` — Square subscription ID
- `square_card_id` — Square saved card ID

The legacy Stripe columns remain in the DB for reference but are no longer used. They can be dropped after confirming no rollback is needed:
```sql
ALTER TABLE users DROP COLUMN stripe_customer_id;
ALTER TABLE users DROP COLUMN stripe_subscription_id;
```

---

## 4. AWS EC2 Deployment

### 4.1 Server Setup

```bash
# Ubuntu 22.04 LTS on EC2

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx certbot python3-certbot-nginx

# Clone repository
git clone https://github.com/your-org/pharmacy-autopilot.git /var/www/pharmacy-autopilot
cd /var/www/pharmacy-autopilot

# Install dependencies and build
npm ci
npm run build
```

### 4.2 Environment Variables (via AWS Secrets Manager)

```bash
# Store all secrets
aws secretsmanager create-secret \
  --name pharmacyautopilot/production \
  --secret-string file://production-secrets.json

# Load at startup in /etc/environment or systemd unit
ExecStartPre=/bin/bash -c 'export $(aws secretsmanager get-secret-value \
  --secret-id pharmacyautopilot/production \
  --query SecretString --output text | jq -r "to_entries[]|\"\(.key)=\(.value)\"")'
```

### 4.3 Process Management with PM2

```bash
npm install -g pm2

# Start the application
NODE_ENV=production pm2 start "node dist/index.js" \
  --name pharmacyautopilot \
  --max-memory-restart 512M \
  --restart-delay 3000

# Persist across reboots
pm2 startup
pm2 save

# View logs
pm2 logs pharmacyautopilot
```

### 4.4 Nginx Configuration

```nginx
server {
    listen 80;
    server_name pharmacyautopilot.com www.pharmacyautopilot.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name pharmacyautopilot.com www.pharmacyautopilot.com;

    ssl_certificate /etc/letsencrypt/live/pharmacyautopilot.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pharmacyautopilot.com/privkey.pem;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
    }
}
```

### 4.5 SSL Certificate

```bash
sudo certbot --nginx -d pharmacyautopilot.com -d www.pharmacyautopilot.com
# Set up auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 5. GitHub Repository Setup

### 5.1 Initial Push

```bash
git init
git add .
git commit -m "Initial commit — Pharmacy Autopilot"
git remote add origin https://github.com/your-org/pharmacy-autopilot.git
git branch -M main
git push -u origin main
```

### 5.2 Branch Strategy

```
main        Production-ready. Direct to AWS deployment.
staging     Pre-production testing environment.
develop     Active development. Merged to staging for testing.
feature/*   Feature branches, merge into develop via PR.
hotfix/*    Emergency production fixes, merge to main + develop.
```

### 5.3 GitHub Actions Deployment

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install and build
        run: |
          npm ci
          npm run build

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USER }}
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd /var/www/pharmacy-autopilot
            git pull origin main
            npm ci --omit=dev
            npm run build
            DATABASE_URL="$(aws secretsmanager get-secret-value --secret-id pharmacyautopilot/production --query SecretString --output text | jq -r .DATABASE_URL)" npm run db:push
            pm2 restart pharmacyautopilot
            echo "Deployment complete"
```

---

## 6. DNS Configuration (Route 53)

```bash
# Create A record pointing to EC2 Elastic IP
aws route53 change-resource-record-sets \
  --hosted-zone-id YOUR_HOSTED_ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "pharmacyautopilot.com",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [{"Value": "YOUR_EC2_ELASTIC_IP"}]
      }
    }, {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "www.pharmacyautopilot.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "pharmacyautopilot.com"}]
      }
    }]
  }'
```

---

## 7. Pre-Launch Checklist

### Infrastructure
- [ ] RDS instance created with encryption enabled
- [ ] RDS in private VPC subnet (not publicly accessible)
- [ ] All secrets stored in AWS Secrets Manager
- [ ] EC2 instance running Ubuntu 22.04 LTS
- [ ] Node.js 20 installed
- [ ] Nginx configured and running
- [ ] SSL certificate active
- [ ] PM2 running with auto-restart enabled

### Application
- [ ] `DATABASE_URL` pointing to RDS instance
- [ ] `npm run db:push` completed on production database
- [ ] All Square credentials configured and tested
- [ ] Square webhook endpoint registered in Square Dashboard
- [ ] Square webhook events verified end-to-end
- [ ] Health check endpoint responding: `GET /health`
- [ ] Test user registration and subscription flow completed
- [ ] Audit log writing to database verified
- [ ] Session persistence working

### Security & Compliance
- [ ] `ENCRYPTION_KEY` set (server won't start without it)
- [ ] `SESSION_SECRET` set with 64+ character random string
- [ ] HTTPS enforced on all routes
- [ ] HSTS header active
- [ ] Rate limiting confirmed working
- [ ] Account lockout confirmed working
- [ ] HIPAA audit log retention confirmed (6 years)

### Monitoring
- [ ] CloudWatch logs configured
- [ ] CloudWatch alarms for: CPU > 80%, disk > 80%, error rate > 1%
- [ ] RDS automated backups verified (7-day retention)
- [ ] PM2 log rotation configured
- [ ] Uptime monitoring configured (e.g., UptimeRobot)
