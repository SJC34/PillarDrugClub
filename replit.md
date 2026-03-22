# Pillar Drug Club - Wholesale Prescription Pharmacy Platform

## Overview
Pillar Drug Club is a membership-based prescription pharmacy platform delivering affordable medications at wholesale prices directly to consumers — tablets as low as $0.01 per tablet. This full-stack web application (React/TypeScript frontend, Node.js/Express backend) bypasses insurance complexities to provide transparent, cost-effective medication access. It offers a single membership at $99/year, supporting various user types including clients, brokers, companies, and administrators. Key features include medication search, cost calculation, prescription management, and Stripe-integrated payment processing. The platform aims to make essential medications affordable and easily accessible, addressing a significant market opportunity in direct-to-consumer healthcare.

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
- **Signup Modal**: A lead capture popup that appears on first visit to the HomePage, collecting user contact information (name, email, phone) with a clear CTA ("Sign Up Now"). Uses localStorage to show only once per visitor. Replaced the previous "Coming Soon" waitlist modal with direct signup language.
- **SEO & AIO Optimization System** (November 2025, expanded March 2026): Production-ready SEO and AI-search infrastructure. Features include:
  - **Robots.txt & Sitemap**: Blocks admin routes, dynamic sitemap.xml includes 500+ medication pages and blog posts. Updated March 2026: sitemap uses `pillardrugclub.com` domain; explicit `Allow: /` rules for GPTBot, PerplexityBot, ClaudeBot, GoogleOther, Bingbot, anthropic-ai, cohere-ai to enable AI crawler indexing
  - **Schema.org Markup** (in `client/index.html`): Organization schema with `sameAs` (LinkedIn, Crunchbase), `areaServed: "US"`, `serviceType: "Pharmacy Membership"`; WebSite schema with SearchAction `potentialAction` pointing to `/medications?q=`; MedicalWebPage schema; 12-question FAQPage schema with PDC-specific wholesale pharmacy Q&A for featured snippets and AIO citations
  - **SSR Per-Page Meta Injection** (`server/vite.ts`): `PAGE_META` map + `injectPageMeta()` function replaces title, description, canonical, OG, and Twitter tags in raw HTML before sending to client — works in both dev (Vite) and prod (static serving). Ensures correct metadata in raw HTML for search bots and AIO crawlers. Covered pages: `/faq`, `/pharmacy-membership-vs-goodrx`, `/scriptco-alternative`, `/cost-calculator`, `/medications`, `/blog`, `/register`
  - **Site Verification Files**: `client/public/google-site-verification.html` and `client/public/BingSiteAuth.xml` placeholder files for Google Search Console and Bing Webmaster Tools
  - **Target Keywords**: "cheap prescriptions without insurance", "pharmacy membership", "wholesale medication prices", "GoodRx alternative", "ScriptCo alternative"
  - **Technical Implementation**: SEOHead component with unique counter-based script IDs (prevents schema collisions), SSR-compatible URL helpers, metadata persistence across multi-step flows
- **Multi-Step Registration**: A 4-step onboarding process covering social authentication, user details, prescription preferences, and Stripe payment for membership ($99/year single plan).
- **Payment Processing** (March 2026): Stripe is the sole payment processor. Uses `@stripe/react-stripe-js` on the frontend (PaymentElement with Stripe Elements) and Stripe SDK on the backend. Flow: backend creates a Subscription with `payment_behavior: default_incomplete`, returns `clientSecret` to frontend, frontend confirms payment, then calls `/api/subscription/activate` to promote user to gold tier. Termination fees use a separate PaymentIntent. Square has been fully removed. Required env vars: `STRIPE_SECRET_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_ID`.
- **Klaviyo Integration** (March 2026): Uses the Klaviyo REST API v2024-02-15 for member profile management and lifecycle event tracking. `server/klaviyo.ts` exports `syncUserToKlaviyo()` which upserts profiles by email (POST → 409 → PATCH pattern) and tracks named events. Sync hooks: registration → profile upsert + `Registered` event, subscription activation → `Subscribed` event, cancellation → `Subscription Cancelled` event. Phone number only included if `smsConsent === "true"`. All calls are fire-and-forget (non-blocking). Requires `KLAVIYO_API_KEY` env var. HubSpot has been fully removed.
- **PDF Prescription System**: Generates branded PDF prescription request forms with SureScripts pharmacy lookup information, distributed via email and SMS using PDFKit, Resend, and Twilio.
- **Account Settings & Member Dashboard**: Users can manage personal information and view a comprehensive dashboard with medication displays, PCP management, drug allergies, and subscription details.
- **Medication Ordering Workflow**: Streamlined process for requesting prescriptions with tier-based supply length enforcement.
- **Medication Search & Pricing**: CSV-based medication catalog for search and pricing, integrated with openFDA Drug Label API for annual pricing calculation.
- **Medication Refill System**: Automated refill request workflow with status tracking and admin oversight.
- **Personal Medication List**: User-managed list with OpenFDA integration for data enrichment and real-time drug-drug interaction checking.
- **Clinical Safety Tools** (Members Only - November 2025): HIPAA-compliant medication management with FDA-powered safety analysis. Features include:
  - **Medication Autocomplete**: Dual-source search supporting PDC catalog (1,857 medications) + manual entry for external pharmacies
  - **Side Effect Analyzer**: Aggregates adverse reactions across medications with likelihood scoring (high >10%, moderate 1-10%, low <1%). Groups effects by frequency with visual indicators
  - **Drug Interaction Checker**: Pairwise analysis with severity classification (major/moderate/minor). Detects contraindications and dosage adjustments
  - **OpenFDA Integration**: Free API with 7-day in-memory cache (memoize), 30-day database cache. Enriches 1,857 medications with drug labels from disk cache
  - **Tier Gating**: Clinical safety tools available to paid members (gold/platinum tier in database)
  - **Performance**: 3-second startup with skip logic (medications persist in database). Cold start (empty DB): ~10-15 minutes for FDA enrichment (acceptable for MVP, optimization planned)
- **Refund Policy System**: Comprehensive, transparent refund and cancellation policy for annual memberships, available as web content and downloadable PDF. Annual memberships are non-refundable once activated.
- **Membership Pricing** (February 2026): Single annual membership at $99/year. $10 dispensing fee per medication per fill. Up to 12-month supply. All clinical safety tools included.
- **Plan Cost Calculator** (February 2026): Interactive calculator on /cost-calculator page helps users see their total annual cost. Features include:
  - **Number of Medications Input**: Calculates dispensing costs based on $10 per medication per fill
  - **Supply Duration Selection**: 30/60/90/180/365 day options with automatic order frequency calculation
  - **Variable Shipping Cost**: User-configurable shipping cost per order
  - **Calculation Formula**: Total = $99 Membership Fee + (Dispensing × Meds × Orders/Year) + (Shipping × Orders/Year)
- **Admin Dashboard System**: Comprehensive tools for platform oversight including Executive Dashboard, User Management (deactivate, soft delete, suspend, delete, recover), Financial Dashboard, Communication Center, Reports & Analytics, and Medication Pricing Management. Admin users can toggle between Admin Dashboard and User Dashboard via the header menu for seamless role switching.
- **LegitScript Reviewer Access** (March 2026): `/reviewer-access` page with server-gated credentials for LegitScript certification review. Reviewer account (`review@pillardrugclub.com`) is auto-seeded in DbStorage with active membership, sample prescription requests, and order data. Credentials are served from `GET /api/reviewer-credentials` (development-only, returns 403 in production). Compliance documentation at `docs/LEGITSCRIPT_COMPLIANCE_OVERVIEW.md`.
- **Blog System ("The Pillar Post")**: Manual blog management system with admin interface for creating, editing, publishing, and deleting posts. Features include featured image uploads (client-side resizing, compression, base64 storage), SEO metadata fields, category/tag management, and a public-facing blog with GoodRx-style visual design.
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
- **Database Service**: Neon Database (serverless PostgreSQL) — currently. Migration to AWS RDS PostgreSQL in progress (codebase already uses standard `pg` driver for compatibility).
- **Payment Gateway**: Square (SDK v44). Replaced Stripe entirely. Uses Square Web Payments SDK for frontend card tokenization, SquareClient for backend API calls (subscriptions, customers, payments).
- **UI Components**: shadcn/ui (built on Radix UI).
- **Styling Framework**: Tailwind CSS.
- **Form Management**: React Hook Form, Zod.
- **HTTP Client**: TanStack Query.
- **Development Tools**: Vite, ESBuild.
- **Deployment Platform**: Replit.
- **Healthcare Provider Database**: NLM Clinical Tables NPI database API.
- **Medication Data**: SJC Pharmacy pricing CSV file, openFDA Drug Label API.
- **Communication Services**: Twilio (SMS), Resend (email).