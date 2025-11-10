# Automated Content Marketing Engine - Architecture

## System Overview

The Pillar Drug Club Content Marketing Engine is a comprehensive, fully-automated multi-channel content distribution system designed to scale to 10,000+ members with zero human intervention after initial setup.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    PILLAR DRUG CLUB PLATFORM                     │
│                  (Existing Express + React App)                  │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ REST API / Webhooks
                     │
┌────────────────────▼────────────────────────────────────────────┐
│              CONTENT AUTOMATION SERVICE                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          AI CONTENT GENERATOR (OpenAI GPT-4)             │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────┐   │  │
│  │  │  Blog   │  │X Thread │  │ Reddit  │  │  Video   │   │  │
│  │  │ Article │  │  (280c) │  │  AMA    │  │  Script  │   │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └──────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │             CONTENT QUEUE & SCHEDULER                     │  │
│  │  • PostgreSQL content_queue table                        │  │
│  │  • BullMQ job queue (Redis-backed)                       │  │
│  │  • Cron orchestrator (node-cron)                         │  │
│  │  • Status tracking: pending → processing → published     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              CHANNEL PUBLISHERS                           │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐               │  │
│  │  │   Blog   │  │    X     │  │  Reddit  │               │  │
│  │  │Publisher │  │Publisher │  │Publisher │               │  │
│  │  └──────────┘  └──────────┘  └──────────┘               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          VIDEO GENERATION PIPELINE                        │  │
│  │  • FFmpeg rendering (1080x1920 vertical)                 │  │
│  │  • Text-to-video templates                               │  │
│  │  • Background music overlays                             │  │
│  │  • Captions/subtitles generation                         │  │
│  │  • YouTube API uploader                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────┬────────────────────────────────────────┬──────┘
                  │                                        │
          ┌───────▼──────────┐                  ┌─────────▼──────────┐
          │   MAILCHIMP      │                  │  REFERRAL ENGINE   │
          │   INTEGRATION    │                  │                    │
          │ • Member sync    │                  │ • Track referrals  │
          │ • Automations    │                  │ • Mailchimp tags   │
          │ • Welcome series │                  │ • Stripe coupons   │
          │ • Refill reminders│                 │ • $10 discount     │
          └──────────────────┘                  └────────────────────┘
```

---

## Technology Stack

### Core Platform (Existing)
- **Frontend:** React 18, TypeScript, Vite, TanStack Query
- **Backend:** Node.js, Express.js, TypeScript
- **Database:** PostgreSQL (Neon serverless)
- **ORM:** Drizzle ORM
- **Auth:** Passport.js (session-based)
- **Payments:** Stripe (will need replacement with Corepay/National Processing)

### New Services (To Be Built)

#### Content Generation
- **OpenAI GPT-4** - Multi-format content generation
- **Prompt Engineering** - Custom templates for blog/X/Reddit/video scripts

#### Job Queue System
- **BullMQ** - Background job processing
- **Redis** - Queue backing store (or alternative if Redis unavailable on Replit)
- **node-cron** - Scheduled job triggers

#### Video Processing
- **FFmpeg** - Video encoding/rendering
- **Canvas/Node Canvas** - Text overlay rendering
- **Object Storage** - Video file persistence (Replit Object Storage or S3-compatible)

#### External Integrations
- **Mailchimp Marketing API v3** - Email automation
- **X/Twitter API v2** - Tweet posting (requires Elevated access)
- **Reddit API** - Post submissions
- **YouTube Data API v3** - Video uploads

---

## Database Schema Extensions

### New Tables

#### content_queue
```typescript
{
  id: string (UUID)
  created_at: timestamp
  scheduled_for: timestamp
  status: "pending" | "processing" | "published" | "failed"
  content_type: "blog" | "x_thread" | "reddit_post" | "youtube_short"
  
  // Content payloads (JSON)
  blog_content: json | null
  x_thread_content: json | null
  reddit_content: json | null
  video_script: json | null
  
  // Metadata
  topic: string
  tone: string
  keywords: string[]
  writing_style: string | null
  
  // Publishing tracking
  published_at: timestamp | null
  published_url: string | null
  error_message: string | null
  retry_count: integer
}
```

#### referrals
```typescript
{
  id: string (UUID)
  referrer_user_id: string (FK to users)
  referred_email: string
  referred_user_id: string | null (FK to users when they sign up)
  
  status: "pending" | "signed_up" | "paid" | "rewarded"
  
  // Tracking
  created_at: timestamp
  signed_up_at: timestamp | null
  rewarded_at: timestamp | null
  
  // Rewards
  referrer_reward_amount: decimal (10.00)
  stripe_coupon_id: string | null
  mailchimp_tag_applied: boolean
}
```

#### content_calendar
```typescript
{
  id: string (UUID)
  date: date
  time_slot: "8am" | "12pm" | "6pm" | "custom"
  
  topic: string
  category: string
  tone: string
  keywords: string[]
  
  content_types: string[] // ["blog", "x_thread", "youtube_video"]
  
  auto_generate: boolean
  auto_publish: boolean
  
  generated_content_id: string | null (FK to content_queue)
  status: "planned" | "generated" | "published"
}
```

#### mailchimp_sync_log
```typescript
{
  id: string (UUID)
  user_id: string (FK to users)
  mailchimp_member_id: string | null
  
  sync_status: "pending" | "synced" | "failed"
  sync_type: "new_member" | "update" | "tag_added" | "automation_trigger"
  
  synced_at: timestamp | null
  error_message: string | null
  
  // Automation tracking
  automation_triggered: string | null
  tags_applied: string[]
}
```

---

## API Endpoints (New)

### Content Generation
- `POST /api/content/generate` - Generate multi-format content from single brief
- `GET /api/content/queue` - List scheduled content
- `POST /api/content/queue/:id/publish` - Manually trigger publish
- `DELETE /api/content/queue/:id` - Cancel scheduled content

### Calendar Management
- `GET /api/content/calendar` - Get 30-day content plan
- `POST /api/content/calendar` - Add calendar entry
- `PATCH /api/content/calendar/:id` - Update calendar entry
- `POST /api/content/calendar/generate-month` - Auto-generate 30-day plan

### Mailchimp Integration
- `POST /api/mailchimp/sync-member` - Manually sync user to Mailchimp
- `POST /api/mailchimp/trigger-automation` - Trigger specific automation
- `GET /api/mailchimp/stats` - Get campaign performance stats

### Referral System
- `POST /api/referrals/create` - Create referral link
- `GET /api/referrals/:userId` - Get user's referrals
- `POST /api/referrals/apply-reward` - Apply referral discount

### Analytics
- `GET /api/analytics/content-performance` - Blog/social metrics
- `GET /api/analytics/member-growth` - Signup trends
- `GET /api/analytics/referral-stats` - Referral conversion rates

---

## Cron Schedule

All times in America/New_York timezone:

```
8:00 AM Daily:
  - Publish scheduled blog post
  - Upload YouTube video (short-form)
  - Mailchimp: Send daily savings tip

12:00 PM Daily:
  - Post X/Twitter thread
  - Mailchimp: Refill reminder check (for users with meds expiring in 7 days)

6:00 PM Daily:
  - Post X/Twitter tip
  - Post X/Twitter poll (engagement driver)

Monday & Thursday 10:00 AM:
  - Post Reddit AMA or discussion topic
  - Mailchimp: Weekly newsletter (Mondays only)

Sunday 6:00 PM:
  - Generate next week's content (7 days ahead)
  - Review queue and fill gaps
```

---

## Content Generation Flow

### 1. Unified Brief Input
```typescript
interface ContentBrief {
  topic: string;                    // "Managing diabetes without insurance"
  tone: "educational" | "friendly" | "urgent" | "inspirational";
  keywords: string[];               // ["affordable insulin", "blood sugar", "A1C"]
  targetAudience: "new_members" | "existing" | "general";
  cta: string;                      // "pillardrugclub.com/join"
  writingStyle?: string;            // "Seth Godin", "Hemingway", etc.
  
  // Output selection
  generateBlog: boolean;
  generateXThread: boolean;
  generateRedditPost: boolean;
  generateVideoScript: boolean;
  
  // Scheduling
  publishImmediately: boolean;
  scheduledFor?: Date;
}
```

### 2. AI Generation Process
```
Input Brief
    ↓
OpenAI GPT-4 (4 parallel requests)
    ↓
┌────────────┬────────────┬────────────┬────────────┐
│    Blog    │  X Thread  │   Reddit   │Video Script│
│  (800-1200)│  (10-15    │  (600-800  │ (30-60sec) │
│   words    │  tweets)   │   words)   │            │
└────────────┴────────────┴────────────┴────────────┘
    ↓
Content Queue (Database)
    ↓
Scheduled Publication via Cron
```

### 3. Multi-Format Output Examples

**Blog Post:**
- SEO-optimized title
- Meta description
- H2/H3 structure
- Internal links to medications
- CTA section
- Schema.org markup

**X/Twitter Thread:**
- Hook tweet (attention grabber)
- 8-12 value tweets
- Statistics/data tweets
- Visual callout tweets
- Reply-bait engagement tweet
- CTA tweet with link

**Reddit Post:**
- Engaging title (question format)
- Personal story opener
- Value-packed body
- Bulleted tips
- Resources section
- Soft CTA (no hard selling)

**Video Script (YouTube - Short-Form):**
- Hook (first 3 seconds)
- Problem statement
- 3 quick tips
- Visual text overlays
- CTA with URL
- Duration: 30-60 seconds

---

## Mailchimp Integration Architecture

### Member Sync Workflow
```
New User Signup
    ↓
User created in PostgreSQL
    ↓
Webhook trigger to Mailchimp service
    ↓
POST to Mailchimp API v3
    /lists/{list_id}/members
    {
      email_address: user.email,
      status: "subscribed",
      merge_fields: {
        FNAME: user.firstName,
        LNAME: user.lastName,
        TIER: user.membershipTier,
        JOINED: user.createdAt
      },
      tags: ["new_member", tier]
    }
    ↓
Log sync in mailchimp_sync_log table
    ↓
Trigger Welcome Series automation
```

### Automations to Configure in Mailchimp

1. **Welcome Series** (5 emails over 14 days)
   - Day 0: Welcome + How it Works
   - Day 2: Browse Medications
   - Day 4: How to Upload Prescription
   - Day 7: Member Success Story
   - Day 14: Referral Invitation

2. **Savings Report PDF** (Monthly)
   - Calculate total savings vs retail
   - Generate PDF report
   - Email with attachment
   - Trigger: 30 days after join date

3. **Refill Reminder** (Tag-based)
   - Check medication supply dates
   - Tag users with meds expiring in 7 days
   - Mailchimp automation: sends reminder
   - CTA: Refill now button

4. **Referral Reward** ($10 discount)
   - Trigger: Referred user completes first purchase
   - Tag referrer with "earned_reward"
   - Send congratulations email
   - Include Stripe coupon code
   - Auto-apply on next billing cycle

---

## Video Generation Pipeline

### FFmpeg Command Template
```bash
ffmpeg \
  -f lavfi -i color=c=0x1B4F72:s=1080x1920:d=60 \
  -vf "drawtext=fontfile=/path/to/font.ttf:
       text='Managing Diabetes\nWithout Insurance':
       fontcolor=white:fontsize=72:x=(w-text_w)/2:y=300" \
  -c:v libx264 -pix_fmt yuv420p \
  output.mp4
```

### Video Template Structure
```
[0-3s]   Hook Text (large, centered)
[3-8s]   Problem Statement
[8-20s]  Tip 1 with icon
[20-32s] Tip 2 with icon
[32-44s] Tip 3 with icon
[44-55s] CTA: "Join Pillar Drug Club"
[55-60s] URL: pillardrugclub.com
```

### Assets Needed
- Font files (branded typography)
- Logo PNG (transparent background)
- Background videos or gradients
- Icon set for tip overlays
- Background music track (royalty-free)

---

## Referral Loop Flow

```
User A shares referral link
    ↓
New user B clicks link (referral_code in URL)
    ↓
B signs up (referral tracked in DB)
    ↓
B completes first purchase
    ↓
Webhook: referral status → "rewarded"
    ↓
┌─────────────────┬─────────────────────┐
│  Mailchimp      │     Stripe          │
│  Tag User A:    │  Create coupon:     │
│  "earned_reward"│  PILLAR10           │
│                 │  $10 off next bill  │
└─────────────────┴─────────────────────┘
    ↓
Email sent to User A (Mailchimp automation)
    ↓
User A's next billing: auto-apply coupon
```

---

## Scaling Considerations (10K Members)

### Performance Targets
- Content generation: < 30 seconds per multi-format brief
- Blog auto-publish: < 5 seconds
- Mailchimp sync: < 2 seconds per member
- Video generation: < 2 minutes per 60-second short
- Queue processing: 100+ jobs/hour capacity

### Infrastructure Requirements
- **Database:** Connection pooling (max 20 connections)
- **Redis:** 512MB minimum for job queue
- **Object Storage:** 10GB for video files (30-day retention)
- **CPU:** 2+ cores for FFmpeg rendering
- **Memory:** 2GB+ for video processing

### Monitoring & Alerts
- Queue depth > 100 jobs → Alert
- Failed jobs > 5% → Alert
- Mailchimp sync failures → Daily digest
- Blog auto-publish failures → Immediate alert
- Video upload failures → Retry 3x, then alert

---

## Security & Compliance

### API Key Management
- All keys stored in Replit Secrets (never in code)
- Rotate keys quarterly
- Separate dev/staging/prod keys
- Audit log for all external API calls

### HIPAA Compliance
- No PHI in Mailchimp (only email, name, tier)
- Audit logging for all member data access
- Field-level encryption for sensitive data
- 30-minute session timeout (already implemented)

### Rate Limiting
- X/Twitter: 50 tweets/day (API limit)
- Reddit: 1 post/10 minutes (anti-spam)
- YouTube: 50 uploads/day (API quota)
- Mailchimp: 10 req/sec (API limit)

---

## Deployment Strategy

### Phase 1: Local Development (Week 1-4)
- Build content generation engine
- Set up local Redis/BullMQ
- Test multi-format output
- Build queue UI

### Phase 2: Staging (Week 5-7)
- Deploy to Replit staging environment
- Configure Mailchimp test list
- Set up test social accounts
- End-to-end testing

### Phase 3: Production Rollout (Week 8-10)
- Migrate production API keys
- Deploy cron jobs
- Enable auto-publishing (blog only first)
- Monitor for 1 week

### Phase 4: Full Automation (Week 11-12)
- Enable social auto-posting
- Activate all Mailchimp automations
- Launch referral program
- Go fully hands-off

---

## Maintenance & Operations

### Daily Checks (Automated)
- ✅ Cron jobs executed successfully
- ✅ Queue processed all pending items
- ✅ No failed Mailchimp syncs
- ✅ Video uploads completed

### Weekly Reviews (Manual)
- Review content performance (engagement, clicks)
- Check referral conversions
- Mailchimp campaign analytics
- Adjust content topics based on performance

### Monthly Tasks
- Generate new 30-day content calendar
- Review and update writing prompts
- Refresh video templates
- API credential rotation (quarterly)

---

## Cost Estimates

### API Costs (Monthly at 10K members)
- **OpenAI GPT-4:** ~$150 (120 content pieces/month)
- **X/Twitter API:** $100 (Elevated access minimum)
- **Mailchimp:** $0-$299 (10K contacts on Standard plan)
- **YouTube API:** Free (within quota)
- **Reddit API:** Free
- **Redis/BullMQ:** $0 (self-hosted) or $15-30 (managed)
- **Object Storage:** $5-10 (video files)

**Total:** ~$270-$589/month

### Development Costs (One-Time)
- **Phase 1:** 3-4 weeks
- **Phase 2:** 2-3 weeks
- **Phase 3:** 3-4 weeks
- **Phase 4:** 2 weeks

**Total Timeline:** 10-13 weeks

---

## Success Metrics

### Content Performance
- Blog views: 1000+/month
- X engagement rate: 2-5%
- Reddit upvotes: 50+ per post
- YouTube views: 500+ per short

### Member Growth
- Organic signups: 20%+ from content
- Referral conversion: 10%+
- Email open rate: 25-35%
- Mailchimp click rate: 5-10%

### Automation Health
- Cron success rate: 99.5%+
- Queue processing time: < 5min average
- API error rate: < 1%
- Zero failed auto-publishes

---

This architecture is designed to be:
- ✅ **Fully automated** (zero-touch after setup)
- ✅ **Scalable** (10K+ members)
- ✅ **Observable** (comprehensive monitoring)
- ✅ **Maintainable** (clear separation of concerns)
- ✅ **Cost-effective** (~$500/month at scale)

Next steps: See `API_CREDENTIALS.md` for required credentials and setup instructions.
