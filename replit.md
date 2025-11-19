# Pillar Drug Club - Wholesale Prescription Pharmacy Platform

## Overview
Pillar Drug Club is a membership-based prescription pharmacy platform delivering affordable medications at wholesale prices directly to consumers. This full-stack web application (React/TypeScript frontend, Node.js/Express backend) bypasses insurance complexities to provide transparent, cost-effective medication access. It offers three membership tiers: **Foundation ($30 per order pay-per-use), Gold ($180/year), and Platinum ($300/year)**, supporting various user types including clients, brokers, companies, and administrators. Key features include medication search, cost calculation, prescription management, and Stripe-integrated payment processing. The platform aims to make essential medications affordable and easily accessible, addressing a significant market opportunity in direct-to-consumer healthcare.

## User Preferences
Preferred communication style: Simple, everyday language.
Primary admin user: Seth Collins, Pharm.D. (seth@pillardrugclub.com)

## System Architecture

### UI/UX Decisions
The frontend uses React 18 with TypeScript and Vite, built with Shadcn/ui and Tailwind CSS. The design is mobile-first, responsive, and inspired by modern healthcare aesthetics, focusing on minimalism and professional typography.

### Technical Implementations
- **Frontend**: Utilizes TanStack Query for server state management and React Hook Form with Zod for form validation.
- **Backend**: Express.js with TypeScript provides RESTful APIs, backed by a PostgreSQL database with Drizzle ORM.
- **Authentication & Authorization**: Dual authentication via email/password and Google OAuth, using Passport.js for session management and a robust role-based access control system. **Persistent Login System with Session Keep-Alive** (November 2025): Production-ready offline-first authentication with localStorage-based session persistence that survives browser restarts, graceful handling of transient server errors (5xx) and 304 "Not Modified" responses without logout, race condition fixes ensuring navigation waits for React state updates, comprehensive debug logging for production monitoring, and automatic session keep-alive (15-minute refresh interval) to prevent 30-minute HIPAA timeout during long operations. Long-running endpoints (content generation) explicitly call `req.session.touch()` to maintain session validity. 401/403 errors trigger automatic logout with redirect to login page.
- **Coming Soon Waitlist Modal**: A pre-launch waitlist collection system integrated into the HomePage for collecting user contact information with Zod validation and database persistence.
- **SEO Optimization System** (November 2025): Production-ready SEO infrastructure targeting competitive healthcare keywords to outrank Amazon Pharmacy, GoodRx, and Cost Plus Drugs. Features include:
  - **Robots.txt & Sitemap**: Blocks admin routes, dynamic sitemap.xml includes 500+ medication pages and blog posts
  - **Schema.org Markup**: Enhanced pharmacy schema with competitive keywords, AggregateRating (4.9/5), HowTo schema for featured snippets, FAQ schema, Video schema, Breadcrumb schemas. Counter-based unique script IDs prevent collisions when multiple schemas load concurrently
  - **Meta Tag Optimization**: High-intent keywords on HomePage, MedicationsPage, BlogPage, and all 4 RegisterPage steps. SSR-safe `getBaseUrl()` helper for environment-aware canonical URLs
  - **Target Keywords**: "cheap prescriptions without insurance", "prescription drug club membership", "wholesale medication prices", "diabetes meds without insurance"
  - **Technical Implementation**: SEOHead component with unique counter-based script IDs (prevents schema collisions), SSR-compatible URL helpers, metadata persistence across multi-step flows
- **Multi-Step Registration**: A 4-step onboarding process covering social authentication, tier selection, user details, prescription preferences, and Stripe membership payment.
- **Payment Processing**: Integrated Stripe for subscription-based membership across three tiers. **Peloton-Style BNPL Messaging** (November 2025): Consistent annual-first pricing display with buy-now-pay-later marketing across all touchpoints (HomePage hero, pricing cards, RegisterPage, SubscriptionPage). Annual pricing ($180 Gold, $300 Platinum) presented as primary with secondary "or as low as $15/$25 per month with flexible payment options" messaging. Avoids misleading users while maintaining Peloton-style conversion optimization. Note: Actual Stripe BNPL integration (Affirm/Klarna) requires future migration from subscription APIs to one-time PaymentIntents with BNPL payment_method_types.
- **PDF Prescription System**: Generates branded PDF prescription request forms with SureScripts pharmacy lookup information, distributed via email and SMS using PDFKit, Resend, and Twilio.
- **Account Settings & Member Dashboard**: Users can manage personal information and view a comprehensive dashboard with medication displays, PCP management, drug allergies, and subscription details.
- **Medication Ordering Workflow**: Streamlined process for requesting prescriptions with tier-based supply length enforcement and payment collection. **Supply length restrictions** (November 2025): Foundation tier ($30/order) limited to 30 and 90-day supplies only. Gold tier ($180/year) restricted to 6-month (180-day) supplies exclusively. Platinum tier ($300/year) accesses 6-month (180-day) and 1-year (360-day) supplies only. Premium tiers cannot request shorter supplies - this enforces the bulk ordering value proposition. Backend validation (server/routes.ts) includes case-insensitive tier checking, NaN guards, and numeric string validation via Zod regex. **Foundation Tier Payment** (November 2025 - MVP): Foundation tier users are notified of $30 per-order fee during prescription submission with clear invoicing messaging. Automated payment collection deferred to post-MVP; current implementation includes prominent fee notices on PrescriptionRequestPage and confirmation dialog to maintain user trust and transparency.
- **Medication Search & Pricing**: CSV-based medication catalog for search and pricing, integrated with openFDA Drug Label API for annual pricing calculation.
- **Medication Refill System**: Automated refill request workflow with status tracking and admin oversight.
- **Personal Medication List**: User-managed list with OpenFDA integration for data enrichment and real-time drug-drug interaction checking.
- **Clinical Safety Tools** (Gold/Platinum Only - November 2025): HIPAA-compliant medication management with FDA-powered safety analysis. Features include:
  - **Medication Autocomplete**: Dual-source search supporting PDC catalog (1,857 medications) + manual entry for external pharmacies
  - **Side Effect Analyzer**: Aggregates adverse reactions across medications with likelihood scoring (high >10%, moderate 1-10%, low <1%). Groups effects by frequency with visual indicators
  - **Drug Interaction Checker**: Pairwise analysis with severity classification (major/moderate/minor). Detects contraindications and dosage adjustments
  - **OpenFDA Integration**: Free API with 7-day in-memory cache (memoize), 30-day database cache. Enriches 1,857 medications with drug labels from disk cache
  - **Tier Gating**: Free members see upgrade CTAs, Gold/Platinum access full analysis features
  - **Performance**: 3-second startup with skip logic (medications persist in database). Cold start (empty DB): ~10-15 minutes for FDA enrichment (acceptable for MVP, optimization planned)
- **Refund Policy System**: Comprehensive, transparent refund and cancellation policy with two-tier refund structure and annual commitment terms, available as web content and downloadable PDF.
- **Admin Dashboard System**: Comprehensive tools for platform oversight including Executive Dashboard, User Management (deactivate, soft delete, suspend, delete, recover), Financial Dashboard, Communication Center, Reports & Analytics, and Medication Pricing Management. Admin users can toggle between Admin Dashboard and User Dashboard via the header menu for seamless role switching.
- **Hybrid Blog System ("The Pillar Post 🗞️")**: A dual content generation platform combining general healthcare content (TypeScript/GPT-4) with FDA-compliant medical content (Python FastAPI RAG). Features include an admin interface for content generation, AI-powered SEO keyword generator that analyzes blog titles to suggest 8-12 optimized keywords, compliance review workflow, and a GoodRx-style visual redesign with featured image uploads (client-side resizing, compression, base64 storage).
- **Sora AI Video Generation System** (November 2025): Dual-track video generation infrastructure for YouTube content marketing with immediate production capability and Q1 2026 API readiness. Features include:
  - **Intelligent Video Prompt Generation**: GPT-4-powered prompt engineering optimized for Sora's cinematic capabilities (camera movements, visual metaphors, emotional storytelling)
  - **Multi-Source Support**: Schema supports manual uploads, Runway Gen-3, Pika Labs, and future Sora API integration with proper source attribution
  - **Status Tracking**: Video lifecycle management (awaiting_upload, processing, ready, failed) with operator notes for manual workflow coordination
  - **Unified Content Preview**: AdminContentPreviewPage component displaying all content formats (blog markdown, X thread, Reddit post, YouTube video) in tabbed interface with react-markdown rendering
  - **Error Handling**: Graceful failure detection for prompt generation failures with status="failed" and error messaging
  - **Production-Ready Architecture**: Immediate manual video upload workflow while maintaining API integration points for Sora public launch
- **HIPAA Security Infrastructure** (November 2025): Comprehensive HIPAA-compliant security controls including:
  - **Audit Logging System**: Tracks ALL PHI access (authorized & unauthorized), authentication events, admin actions. 6-year retention with indexed queries. Device fingerprinting (IP, user agent, browser/OS/device).
  - **Field-Level Encryption**: AES-256-CBC encryption for sensitive PHI (medical info, addresses). PBKDF2-SHA512 password hashing (100k iterations). Mandatory ENCRYPTION_KEY in production (fails fast if missing).
  - **Session Security**: 30-minute automatic timeout, device tracking, session regeneration on login, secure cookies (httpOnly, secure, sameSite:lax for CSRF protection).
  - **API Security**: Rate limiting (100 req/15min general, 10 req/15min auth), Helmet.js security headers (CSP, HSTS, XSS protection), input validation.
  - **Authentication Security**: Account lockout after 5 failed attempts (30-min duration), strong password requirements (12+ chars, complexity, history tracking), password expiration (90 days), MFA-ready schema.
  - **Access Controls**: Role-based access (admin/client/broker/company), minimum necessary PHI access enforcement, audit logging of all privilege changes.
  - **Database Security**: Encrypted connections, PostgreSQL session store, secure password storage with salting.
  - **Documentation**: Comprehensive SECURITY.md covering all HIPAA Technical & Administrative Safeguards, incident response, and compliance checklist.

### System Design Choices
Emphasizes modularity, scalability, and security for sensitive healthcare data, utilizing serverless PostgreSQL and asynchronous communication. All HIPAA security controls implemented following § 164.312 Technical Safeguards and § 164.308 Administrative Safeguards requirements.

## External Dependencies
- **Database Service**: Neon Database (serverless PostgreSQL).
- **Payment Gateway**: Stripe.
- **UI Components**: shadcn/ui (built on Radix UI).
- **Styling Framework**: Tailwind CSS.
- **Form Management**: React Hook Form, Zod.
- **HTTP Client**: TanStack Query.
- **Development Tools**: Vite, ESBuild.
- **Deployment Platform**: Replit.
- **Healthcare Provider Database**: NLM Clinical Tables NPI database API.
- **Medication Data**: SJC Pharmacy pricing CSV file, openFDA Drug Label API.
- **Communication Services**: Twilio (SMS), Resend (email).
- **AI Content Generation**: OpenAI GPT-4, Python FastAPI RAG service.
- **Automated Content Marketing Engine** (In Development - 10-13 week roadmap): Comprehensive multi-channel content automation system designed to scale to 10K+ members with zero human intervention. Four-phase implementation:
  - **Phase 1 (Weeks 1-4)**: Multi-format AI content generation (blog + X thread + Reddit post + video script), content queue database, cron-based auto-publishing, 30-day content calendar
  - **Phase 2 (Weeks 5-7)**: Mailchimp API integration, member email sync, automation triggers (welcome series, savings reports, refill reminders, referral rewards)
  - **Phase 3 (Weeks 8-10)**: YouTube video pipeline (FFmpeg short-form video generation), X/Twitter auto-posting, Reddit auto-posting, background job queue (BullMQ/Redis), referral → discount automation loop
  - **Phase 4 (Weeks 11-12)**: Analytics dashboard, performance tracking, scaling optimizations for 10K members
  - **Documentation**: See `ARCHITECTURE.md` for full system design and `API_CREDENTIALS.md` for required credentials