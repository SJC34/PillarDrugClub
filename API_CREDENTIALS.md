# API Credentials & Setup Checklist

This document lists all required API credentials, setup steps, and configuration for the Automated Content Marketing Engine.

---

## ✅ PHASE 1: Content Generation MVP (Weeks 1-4)

### Already Have
- ✅ **OpenAI API Key** - `OPENAI_API_KEY` (already in use for blog generation)
- ✅ **Database** - PostgreSQL via Neon (already configured)
- ✅ **Stripe** - (Note: needs replacement with Corepay/National Processing for pharmacy compliance)

### Need to Obtain
No additional credentials needed for Phase 1.

---

## 🔑 PHASE 2: Mailchimp Integration (Weeks 5-7)

### Mailchimp Marketing API v3

#### Steps to Obtain:
1. **Create Mailchimp Account**
   - Go to: https://mailchimp.com/
   - Sign up for account (Free plan supports 500 contacts, Standard plan recommended for 10K)

2. **Generate API Key**
   - Navigate to: Account → Extras → API Keys
   - Click "Create A Key"
   - Copy key (format: `xxxxxxxxxxxxxxxxxxxxxxxxxxxx-us21`)
   - Store as: `MAILCHIMP_API_KEY`

3. **Get List ID**
   - Go to: Audience → Manage Audience → Settings
   - Scroll to "Audience name and defaults"
   - Copy "Audience ID" (format: `a1b2c3d4e5`)
   - Store as: `MAILCHIMP_LIST_ID`

4. **Get Server Prefix**
   - From API key, extract server prefix (e.g., `us21` from key ending in `-us21`)
   - Store as: `MAILCHIMP_SERVER_PREFIX`

#### Required Environment Variables:
```bash
MAILCHIMP_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxx-us21
MAILCHIMP_LIST_ID=a1b2c3d4e5
MAILCHIMP_SERVER_PREFIX=us21
```

#### Mailchimp Setup Tasks:
- [ ] Create main audience/list
- [ ] Set up merge fields: FNAME, LNAME, TIER, JOINED
- [ ] Create tags: new_member, free_tier, gold_tier, platinum_tier, earned_reward
- [ ] Configure automations (see below)

#### Automation Workflows to Create:

**1. Welcome Series**
- Trigger: Tag added "new_member"
- 5 emails over 14 days
- Template each email in Mailchimp UI

**2. Refill Reminder**
- Trigger: Tag added "refill_due_7days"
- Single email with CTA button
- Link to: https://pillardrugclub.com/refills

**3. Savings Report**
- Trigger: Monthly (30 days after join)
- Attach PDF (generated server-side, sent via API)

**4. Referral Reward**
- Trigger: Tag added "earned_reward"
- Include Stripe coupon code
- Congratulations message

#### API Rate Limits:
- **10 requests/second**
- Batch operations recommended for bulk syncs
- Use webhooks for real-time updates where possible

---

## 🐦 PHASE 3: Social Media APIs (Weeks 8-10)

### X/Twitter API v2 (Elevated Access Required)

#### Steps to Obtain:
1. **Apply for Developer Account**
   - Go to: https://developer.twitter.com/
   - Click "Apply for access"
   - Fill out application (describe pharmacy content automation use case)
   - Wait 1-3 business days for approval

2. **Apply for Elevated Access**
   - Navigate to: Developer Portal → Projects & Apps
   - Click "Apply for Elevated"
   - **Cost: $100/month minimum** (as of 2024)
   - Explain need for posting automation
   - Wait 1-2 business days

3. **Create App**
   - Create new app in approved project
   - Enable OAuth 2.0
   - Generate API keys

4. **Get Credentials**
   - API Key (Consumer Key)
   - API Secret (Consumer Secret)
   - Bearer Token
   - Access Token
   - Access Token Secret

#### Required Environment Variables:
```bash
TWITTER_API_KEY=xxxxxxxxxxxxxxxxxxxxx
TWITTER_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWITTER_BEARER_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWITTER_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWITTER_ACCESS_TOKEN_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### API Rate Limits:
- **50 tweets per 24 hours** (per user)
- **300 requests per 15 minutes** (read operations)
- **200 requests per 15 minutes** (write operations)
- Use scheduling to stay within limits

#### Twitter Account Requirements:
- [ ] Create @PillarDrugClub account (if not exists)
- [ ] Complete profile (bio, profile pic, header)
- [ ] Post initial introduction thread manually
- [ ] Follow relevant healthcare accounts
- [ ] Enable 2FA for security

---

### Reddit API

#### Steps to Obtain:
1. **Create Reddit App**
   - Go to: https://www.reddit.com/prefs/apps
   - Scroll to bottom, click "create another app"
   - Select "script" type
   - Name: "Pillar Drug Club Bot"
   - Redirect URI: http://localhost:8080 (not used for script apps)

2. **Get Credentials**
   - Copy "client ID" (under app name)
   - Copy "client secret"
   - Use your Reddit username and password

#### Required Environment Variables:
```bash
REDDIT_CLIENT_ID=xxxxxxxxxxxxx
REDDIT_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxx
REDDIT_USERNAME=PillarDrugClub
REDDIT_PASSWORD=your_secure_password
REDDIT_USER_AGENT=PillarDrugClub/1.0 (Pharmacy content bot)
```

#### API Rate Limits:
- **60 requests per minute**
- **1 post per 10 minutes** (anti-spam)
- Use PRAW library (Python) or Snoowrap (Node.js)

#### Reddit Account Setup:
- [ ] Create u/PillarDrugClub account
- [ ] Build karma (post helpful comments first)
- [ ] Join subreddits: r/pharmacy, r/healthcare, r/insurance, r/personalfinance
- [ ] Read and follow subreddit rules (avoid bans)
- [ ] Post manually first to establish presence

#### Subreddit Guidelines:
Most health/pharmacy subreddits have strict self-promotion rules:
- Focus on educational content
- No hard selling
- Disclose affiliation in posts
- Engage genuinely in comments
- Consider AMAs (Ask Me Anything) format

---

### YouTube Data API v3

#### Steps to Obtain:
1. **Create Google Cloud Project**
   - Go to: https://console.cloud.google.com/
   - Create new project: "Pillar Drug Club Content"

2. **Enable YouTube Data API**
   - Navigate to: APIs & Services → Library
   - Search for "YouTube Data API v3"
   - Click "Enable"

3. **Create OAuth 2.0 Credentials**
   - Go to: APIs & Services → Credentials
   - Click "Create Credentials" → OAuth client ID
   - Application type: Web application
   - Authorized redirect URIs: https://pillardrugclub.com/oauth/youtube/callback
   - Download JSON credentials file

4. **Get API Quota**
   - Default: 10,000 units/day
   - Upload video: 1,600 units each
   - **Daily limit: ~6 uploads** (request quota increase if needed)

#### Required Environment Variables:
```bash
YOUTUBE_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxx
YOUTUBE_REDIRECT_URI=https://pillardrugclub.com/oauth/youtube/callback
YOUTUBE_API_KEY=xxxxxxxxxxxxxxxxxxxxx (optional, for public data)
```

#### YouTube Channel Setup:
- [ ] Create "Pillar Drug Club" YouTube channel
- [ ] Complete channel profile (description, banner, profile pic)
- [ ] Create channel trailer
- [ ] Add channel keywords
- [ ] Link to pillardrugclub.com in description
- [ ] Enable monetization (if eligible)

#### OAuth Flow:
First-time setup requires manual OAuth authorization:
1. Run OAuth flow to get refresh token
2. Store refresh token securely
3. Use refresh token to get access tokens automatically

---

## 🎥 PHASE 3: Video Processing (Weeks 8-10)

### FFmpeg Installation

#### On Replit:
FFmpeg may already be available. Check with:
```bash
ffmpeg -version
```

If not installed, add to `.replit` config:
```toml
[nix]
channel = "stable-22_11"

[nix.pkgs]
ffmpeg = "latest"
```

#### No API Keys Required
FFmpeg is open-source, runs locally, no external API.

#### System Requirements:
- **CPU:** 2+ cores for rendering
- **Memory:** 2GB+ RAM
- **Storage:** 500MB+ for temp files

---

### Object Storage (Video Files)

#### Option A: Replit Object Storage (Recommended)
- Built-in to Replit
- No external API needed
- Access via SDK

#### Option B: Cloudflare R2 (Alternative)
If Replit storage insufficient:
1. Create Cloudflare account
2. Navigate to R2 Storage
3. Create bucket: "pillar-videos"
4. Get Access Key ID and Secret Access Key

```bash
R2_ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxxx
R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxxx
R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxx
R2_BUCKET_NAME=pillar-videos
```

---

## 🔧 PHASE 3: Background Jobs (Weeks 8-10)

### Redis (for BullMQ)

#### Option A: Upstash Redis (Recommended for Replit)
1. Go to: https://upstash.com/
2. Create account
3. Create Redis database
4. Copy connection string

```bash
REDIS_URL=rediss://default:xxxxx@xxxxx.upstash.io:6379
```

#### Option B: Self-Hosted Redis
If running Redis locally in Replit:
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=optional_password
```

---

## 📊 PHASE 4: Analytics (Weeks 11-12)

No additional API credentials required. Analytics will use existing integrations:
- Mailchimp API (campaign stats)
- X/Twitter API (tweet engagement)
- Reddit API (post metrics)
- YouTube API (video views)
- PostgreSQL (internal tracking)

---

## Complete .env Template

```bash
# ===================================
# EXISTING CREDENTIALS (Already Have)
# ===================================
DATABASE_URL=postgresql://user:pass@host/db
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxxxxxxxxxx
CUSTOM_DOMAIN=pillardrugclub.com

# Note: Replace Stripe with pharmacy-compliant processor
# STRIPE_SECRET_KEY=sk_test_xxxxx (DO NOT USE - pharmacy compliance issue)

# ===================================
# PHASE 1: Content Generation MVP
# ===================================
# No additional keys needed

# ===================================
# PHASE 2: Mailchimp Integration
# ===================================
MAILCHIMP_API_KEY=xxxxxxxxxxxxxxxxxxxxx-us21
MAILCHIMP_LIST_ID=a1b2c3d4e5
MAILCHIMP_SERVER_PREFIX=us21

# ===================================
# PHASE 3: Social Media APIs
# ===================================

# X/Twitter (Elevated Access - $100/month)
TWITTER_API_KEY=xxxxxxxxxxxxxxxxxxxxx
TWITTER_API_SECRET=xxxxxxxxxxxxxxxxxxxxx
TWITTER_BEARER_TOKEN=xxxxxxxxxxxxxxxxxxxxx
TWITTER_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxxx
TWITTER_ACCESS_TOKEN_SECRET=xxxxxxxxxxxxxxxxxxxxx

# Reddit
REDDIT_CLIENT_ID=xxxxxxxxxxxxx
REDDIT_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxx
REDDIT_USERNAME=PillarDrugClub
REDDIT_PASSWORD=xxxxxxxxxxxxxxxxxxxxx
REDDIT_USER_AGENT=PillarDrugClub/1.0

# YouTube
YOUTUBE_CLIENT_ID=xxxxx.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxx
YOUTUBE_REDIRECT_URI=https://pillardrugclub.com/oauth/youtube/callback
YOUTUBE_REFRESH_TOKEN=xxxxxxxxxxxxxxxxxxxxx

# ===================================
# PHASE 3: Infrastructure
# ===================================

# Redis (for BullMQ job queue)
REDIS_URL=rediss://default:xxxxx@xxxxx.upstash.io:6379

# Object Storage (if not using Replit built-in)
# R2_ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxxx
# R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxxx
# R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxx
# R2_BUCKET_NAME=pillar-videos

# ===================================
# Application Config
# ===================================
NODE_ENV=production
PORT=5000
SESSION_SECRET=your_session_secret_here
ENCRYPTION_KEY=your_32_byte_encryption_key_here

# Timezone for cron jobs
TZ=America/New_York
```

---

## Credential Security Checklist

- [ ] **Never commit credentials to Git**
- [ ] Store all keys in Replit Secrets
- [ ] Use different keys for dev/staging/prod
- [ ] Rotate API keys quarterly
- [ ] Enable 2FA on all service accounts
- [ ] Monitor API usage dashboards weekly
- [ ] Set up billing alerts (Twitter, Mailchimp)
- [ ] Document key rotation procedures
- [ ] Backup OAuth refresh tokens securely
- [ ] Audit access logs monthly

---

## Setup Time Estimates

| Service | Setup Time | Approval Wait Time | Cost |
|---------|-----------|-------------------|------|
| Mailchimp | 30 min | Instant | $0-299/mo |
| X/Twitter API | 1 hour | 1-3 days | $100/mo |
| Reddit API | 15 min | Instant | Free |
| YouTube API | 45 min | Instant | Free |
| Upstash Redis | 10 min | Instant | $0-10/mo |
| FFmpeg | 5 min | N/A | Free |

**Total Setup Time:** ~3 hours active work + 1-3 days waiting for Twitter approval

---

## Cost Summary

### Monthly Recurring Costs
- **X/Twitter Elevated API:** $100/month
- **Mailchimp (10K contacts):** $299/month (Standard plan)
- **OpenAI GPT-4:** ~$150/month (estimated)
- **Upstash Redis:** ~$10/month
- **Object Storage:** ~$5/month

**Total: ~$564/month at scale**

### One-Time Costs
- Development: 10-13 weeks
- Video asset creation (fonts, templates): ~$50

---

## Troubleshooting Common Issues

### Mailchimp
**Issue:** "API key invalid"
- Check server prefix matches key (e.g., -us21)
- Verify key wasn't disabled in Mailchimp settings

**Issue:** "List not found"
- Confirm List ID from Audience settings
- Ensure account has access to list

### Twitter/X
**Issue:** "Forbidden - 403"
- Elevated access may not be approved yet
- Check app permissions in developer portal
- Verify OAuth tokens haven't expired

### Reddit
**Issue:** "Rate limit exceeded"
- Wait 10 minutes between posts
- Build karma before heavy posting
- Use read operations to check before posting

### YouTube
**Issue:** "Quota exceeded"
- Default 10K units/day ≈ 6 uploads
- Request quota increase via Google form
- Consider posting less frequently or alternating days

---

## Support & Documentation Links

- **Mailchimp API Docs:** https://mailchimp.com/developer/marketing/
- **Twitter API Docs:** https://developer.twitter.com/en/docs
- **Reddit API Docs:** https://www.reddit.com/dev/api
- **YouTube API Docs:** https://developers.google.com/youtube/v3
- **FFmpeg Docs:** https://ffmpeg.org/documentation.html
- **BullMQ Docs:** https://docs.bullmq.io/

---

Next steps: Begin Phase 1 implementation while API credentials are being obtained.
