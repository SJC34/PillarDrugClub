# HIPAA Compliance Documentation
## Pharmacy Autopilot — pharmacyautopilot.com

**Last Updated:** February 2026  
**Prepared By:** Seth Collins, Pharm.D.  
**Document Type:** Technical & Administrative Safeguards Reference

---

## 1. Overview

Pharmacy Autopilot is a HIPAA-covered entity operating as a mail-order pharmacy platform. This document describes all implemented Technical and Administrative Safeguards required under 45 CFR §164.312 and §164.308 respectively.

---

## 2. Administrative Safeguards (§164.308)

### 2.1 Security Officer
- **Designated Security Officer:** Seth Collins, Pharm.D.
- **Contact:** seth@pharmacyautopilot.com
- **Responsibilities:** Risk management, policy enforcement, incident response, workforce training

### 2.2 Risk Analysis & Management
- Annual risk assessment conducted
- Vulnerability scanning on deployment
- Risk register maintained in internal documentation
- All identified risks tracked with mitigation status

### 2.3 Workforce Training
- All staff complete HIPAA training upon hire
- Annual refresher training required
- Training records maintained for 6 years
- Topics: PHI handling, breach reporting, acceptable use, password policies

### 2.4 Access Management
- Minimum necessary access enforced via role-based access control (RBAC)
- Roles: `admin`, `client`, `broker`, `company`
- Access reviewed quarterly
- Terminated employee access revoked within 24 hours

### 2.5 Incident Response Plan
- **Breach Detection:** Automated audit logging detects unauthorized PHI access
- **Notification Timeline:** 60 days per HIPAA Breach Notification Rule
- **Reporting:** HHS breach portal for breaches affecting 500+ individuals
- **Documentation:** All incidents logged with root cause and remediation

### 2.6 Business Associate Agreements (BAAs)
The following vendors process PHI and have executed BAAs:

| Vendor | Service | BAA Status |
|--------|---------|------------|
| AWS | Hosting & RDS database | Required before go-live |
| Square | Payment processing (non-PHI) | Standard business agreement |
| Resend | Transactional email | BAA required |
| Twilio | SMS notifications | BAA required |
| OpenAI | Content generation (no PHI transmitted) | Review policy |

---

## 3. Technical Safeguards (§164.312)

### 3.1 Access Control (§164.312(a)(1))
- **Unique User IDs:** Every user has a UUID primary key — no shared accounts
- **Automatic Logoff:** 30-minute session timeout enforced server-side
- **Account Lockout:** 5 failed login attempts → 30-minute lockout
- **Role-Based Access:** Admin routes require `role = 'admin'` verification on every request
- **Encryption:** AES-256-CBC for all PHI fields at rest

### 3.2 Audit Controls (§164.312(b))
- **Comprehensive Audit Log:** All PHI access events logged to `audit_logs` table
- **Events Logged:** Authentication (success/failure), PHI reads, admin actions, privilege changes, rate limit violations
- **Retention:** 6-year audit log retention
- **Device Fingerprinting:** IP address, user agent, browser/OS/device captured per event
- **Query Performance:** Indexed on `userId`, `eventType`, `timestamp`

### 3.3 Integrity Controls (§164.312(c)(1))
- HTTPS/TLS enforced on all connections (HSTS with 1-year max-age, preload)
- Data validation via Zod schemas on all API inputs
- Drizzle ORM prevents SQL injection
- CSRF protection via `sameSite: lax` cookies
- Content Security Policy (CSP) via Helmet.js

### 3.4 Transmission Security (§164.312(e)(1))
- TLS 1.2+ required for all connections
- HSTS header: `max-age=31536000; includeSubDomains; preload`
- All API endpoints served over HTTPS only
- Database connections use SSL (`ssl: require` in RDS configuration)

### 3.5 Authentication (§164.312(d))
- **Password Requirements:** 12+ characters, uppercase, lowercase, number, special character
- **Password History:** Last 5 passwords stored and blocked for reuse
- **Password Expiration:** 90-day expiration policy
- **PBKDF2-SHA512 Hashing:** 100,000 iterations for password storage
- **MFA-Ready Schema:** `mfa_enabled`, `mfa_secret` columns in place (implementation Q2 2026)
- **Session Regeneration:** New session ID issued on every login

### 3.6 PHI Field-Level Encryption
The following fields are encrypted at rest using AES-256-CBC:
- `drug_allergies`
- `user_address`
- `primary_doctor_address`
- Medical notes and prescription details

**Key Management:**
- Encryption key stored in `ENCRYPTION_KEY` environment variable
- Key must be set in production (server fails to start without it)
- Key rotation procedure: update env var, run re-encryption script

---

## 4. Physical Safeguards

### 4.1 AWS Infrastructure (Production)
- **Region:** US-East-1 (HIPAA-eligible region)
- **RDS:** Encrypted PostgreSQL instance with automated backups
- **EBS:** Encrypted volumes for all compute instances
- **VPC:** Database in private subnet, not publicly accessible
- **Security Groups:** Least-privilege port access (5432 internal only)

### 4.2 Data Backup & Recovery
- RDS automated backups: 7-day retention
- Point-in-time recovery enabled
- Manual snapshots before major deployments
- Recovery Time Objective (RTO): 4 hours
- Recovery Point Objective (RPO): 1 hour

---

## 5. Patient Rights

### 5.1 Right of Access (§164.524)
- Members can download their PHI via Account Settings
- Requests fulfilled within 30 days
- Prescription records available in member dashboard

### 5.2 Right to Amend (§164.526)
- Members may update personal information in Account Settings
- Medication list editable from member dashboard

### 5.3 Right to Accounting of Disclosures (§164.528)
- Audit log available to members for their own records
- Disclosures tracked in `audit_logs` table

### 5.4 Minimum Necessary Standard
- API endpoints return only fields needed for the specific operation
- Admin users see PHI only for specific administrative functions
- All PHI access is logged regardless of authorization status

---

## 6. Privacy Policy & Notices

- **Notice of Privacy Practices (NPP):** Available at `/privacy-policy`
- **HIPAA Consent:** Captured at registration via `hipaa_consent_at` timestamp
- **Privacy Policy Acceptance:** Captured at registration via `privacy_policy_accepted_at`

---

## 7. Breach Notification Procedures

### Step 1: Discovery (Day 0)
- Automated monitoring alerts on anomalous PHI access
- Security team notified immediately

### Step 2: Assessment (Days 1–5)
- Determine scope: number of individuals, types of PHI, cause
- 4-factor risk assessment per §164.402

### Step 3: Notification
- **Individuals:** Written notice within 60 days of discovery
- **HHS:** Via breach portal within 60 days (500+ individuals: simultaneous)
- **Media:** Required if 500+ individuals in a state affected
- **Business Associates:** Notify covered entity within 60 days

### Step 4: Remediation
- Patch vulnerability
- Update audit logs
- Revise policies if needed
- Document lessons learned

---

## 8. Compliance Contacts

| Role | Name | Contact |
|------|------|---------|
| HIPAA Security Officer | Seth Collins, Pharm.D. | seth@pharmacyautopilot.com |
| Technical Lead | — | dev@pharmacyautopilot.com |
| Privacy Officer | Seth Collins, Pharm.D. | seth@pharmacyautopilot.com |

---

*This document should be reviewed annually and updated whenever significant system changes occur.*
