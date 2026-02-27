# AWS HIPAA Setup Checklist
## Pharmacy Autopilot — Production Infrastructure

---

## 1. AWS Business Associate Agreement (BAA)
- [ ] Sign AWS BAA through AWS Console (Account > Settings > Agreements)
- [ ] Confirm BAA is active before storing any PHI in AWS services

---

## 2. AWS Account & IAM
- [ ] Create a dedicated AWS account for production (separate from dev/test)
- [ ] Enable MFA on the root account — lock it in a vault, never use it day-to-day
- [ ] Create an admin IAM user with MFA for daily operations
- [ ] Create a least-privilege IAM role for the application (EC2 or ECS) with only the permissions it needs
- [ ] Enable AWS CloudTrail in all regions (audit log of all API calls)
- [ ] Enable AWS Config to track configuration changes
- [ ] Enable GuardDuty for threat detection

---

## 3. VPC & Network Isolation
- [ ] Create a dedicated VPC (do not use the default VPC)
- [ ] Create private subnets for RDS — database should never be publicly accessible
- [ ] Create public subnets only for the load balancer
- [ ] Configure security groups:
  - App servers: allow inbound 443 from load balancer only
  - RDS: allow inbound 5432 from app servers only, nothing else
- [ ] Enable VPC Flow Logs (captures all network traffic metadata)
- [ ] Set up a NAT Gateway if app servers need outbound internet access

---

## 4. RDS PostgreSQL (Database)
- [ ] Launch RDS PostgreSQL in a **private subnet** (no public accessibility)
- [ ] Enable encryption at rest using AWS KMS (check "Enable encryption" at creation)
- [ ] Enable SSL/TLS enforcement (set `rds.force_ssl = 1` in parameter group)
- [ ] Enable automated backups (7-day minimum, 30-day recommended for HIPAA)
- [ ] Enable Multi-AZ deployment for high availability
- [ ] Enable Enhanced Monitoring and Performance Insights
- [ ] Enable RDS deletion protection
- [ ] Set up a dedicated database user for the app (not the master user)
- [ ] Store `DATABASE_URL` in AWS Secrets Manager (not as a plain env var)

---

## 5. Compute (EC2 or ECS)
- [ ] Run application in private subnets behind an Application Load Balancer
- [ ] Use an ALB with HTTPS (port 443) only — redirect HTTP to HTTPS
- [ ] Install an SSL certificate via AWS Certificate Manager (free, auto-renews)
- [ ] Enable access logs on the ALB
- [ ] Use EC2 instance types with NVMe encryption or configure EBS encryption at rest
- [ ] Apply OS-level security patches on a regular schedule
- [ ] Use IMDSv2 on EC2 instances (prevents SSRF attacks against metadata service)

---

## 6. Secrets Management
- [ ] Store all secrets in AWS Secrets Manager (not in .env files or environment variables baked into AMIs):
  - `DATABASE_URL`
  - `ENCRYPTION_KEY` (required — app refuses to start without it in production)
  - `SESSION_SECRET`
  - `SQUARE_ACCESS_TOKEN`
  - `SQUARE_LOCATION_ID`
  - `SQUARE_PLAN_VARIATION_ID`
  - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
  - `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN`
  - `RESEND_API_KEY`
- [ ] Rotate secrets on a schedule (Secrets Manager can auto-rotate RDS credentials)
- [ ] Grant the app's IAM role read access to only the specific secrets it needs

---

## 7. Encryption
- [ ] Confirm RDS encryption at rest is enabled (KMS)
- [ ] Confirm EBS volumes are encrypted
- [ ] Confirm S3 buckets (if any) have server-side encryption enabled
- [ ] Confirm all traffic uses TLS 1.2 or higher (ALB enforces this by default)
- [ ] Verify the application's `ENCRYPTION_KEY` is a strong, unique 32-byte key
- [ ] Store the `ENCRYPTION_KEY` in Secrets Manager, not anywhere in code or git

---

## 8. Logging & Monitoring
- [ ] Send application logs to CloudWatch Logs (structured JSON preferred)
- [ ] Set log retention to 6 years for HIPAA audit trails (required)
- [ ] Set up CloudWatch Alarms for:
  - High error rates (5xx responses)
  - High CPU / memory on app servers
  - RDS storage approaching capacity
  - Failed login spikes (potential breach indicator)
- [ ] Enable AWS Security Hub for a unified security dashboard
- [ ] Set up SNS alerts to notify Seth when alarms trigger
- [ ] Confirm audit logs from the app's built-in audit system flow into CloudWatch

---

## 9. S3 (If Used for Uploads / Backups)
- [ ] Block all public access at the account level and bucket level
- [ ] Enable server-side encryption (SSE-S3 or SSE-KMS)
- [ ] Enable S3 Versioning for buckets storing PHI
- [ ] Enable S3 Object Lock on backup buckets (prevents deletion)
- [ ] Set bucket policies to deny unencrypted uploads
- [ ] Enable S3 access logging

---

## 10. Backups & Disaster Recovery
- [ ] Confirm RDS automated backups are enabled and tested
- [ ] Test a database restore — verify it actually works
- [ ] Document Recovery Time Objective (RTO) and Recovery Point Objective (RPO)
- [ ] Set up cross-region backup replication for critical data
- [ ] Keep a copy of all secrets backed up securely offline

---

## 11. Domain & DNS
- [ ] Point `pharmacyautopilot.com` to the ALB via Route 53 or your DNS provider
- [ ] Confirm HTTPS works end-to-end with a valid certificate
- [ ] Set up DNSSEC if possible
- [ ] Update Google OAuth callback URLs to use `pharmacyautopilot.com`
- [ ] Update any hardcoded `REPLIT_DOMAINS` references in the app to your domain

---

## 12. Application-Level HIPAA Checks (Pre-Launch)
- [ ] Set `NODE_ENV=production` in the deployment environment
- [ ] Set `ENCRYPTION_KEY` — app will refuse to start without it
- [ ] Confirm session timeout is 30 minutes (already coded)
- [ ] Confirm audit logging is writing to the database
- [ ] Confirm HTTPS-only cookies (`secure: true`) when behind ALB
- [ ] Run a test login, prescription request, and refill to verify end-to-end flow
- [ ] Confirm Square payment flow works with production credentials (not sandbox)

---

## 13. Team & Workforce (Administrative Safeguards)
- [ ] Document who has access to production systems and what level
- [ ] Complete HIPAA training for all team members with PHI access
- [ ] Create a written Incident Response Plan (what to do if there's a breach)
- [ ] Complete a Security Risk Assessment (required by HIPAA)
- [ ] Have all workforce members sign a confidentiality agreement

---

## 14. LegitScript (Pharmacy Certification)
- [ ] Submit LegitScript pharmacy certification application
- [ ] Provide pharmacy license documentation
- [ ] Provide pharmacist credentials (Seth Collins, Pharm.D.)
- [ ] Pass LegitScript site review
- [ ] Display LegitScript seal on the website after approval

---

## Priority Order

1. Sign AWS BAA
2. Set up VPC + private subnets + security groups
3. Launch encrypted RDS in private subnet
4. Store all secrets in Secrets Manager
5. Deploy app behind HTTPS ALB
6. Enable CloudTrail + CloudWatch logging with 6-year retention
7. Point domain to production, update OAuth callbacks
8. Run end-to-end smoke test
9. Start LegitScript application process
