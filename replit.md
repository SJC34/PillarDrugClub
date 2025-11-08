# Pillar Drug Club - Wholesale Prescription Pharmacy Platform

## Overview
Pillar Drug Club is a membership-based prescription pharmacy platform delivering affordable medications at wholesale prices directly to consumers. This full-stack web application (React/TypeScript frontend, Node.js/Express backend) bypasses insurance complexities to provide transparent, cost-effective medication access. It offers three membership tiers: Free, Gold, and Platinum, supporting various user types including clients, brokers, companies, and administrators. Key features include medication search, cost calculation, prescription management, and Stripe-integrated payment processing. The platform aims to make essential medications affordable and easily accessible, addressing a significant market opportunity in direct-to-consumer healthcare.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The frontend uses React 18 with TypeScript and Vite, built with Shadcn/ui and Tailwind CSS. The design is mobile-first, responsive, and inspired by modern healthcare aesthetics, focusing on minimalism and professional typography.

### Technical Implementations
- **Frontend**: Utilizes TanStack Query for server state management and React Hook Form with Zod for form validation.
- **Backend**: Express.js with TypeScript provides RESTful APIs, backed by a PostgreSQL database with Drizzle ORM.
- **Authentication & Authorization**: Dual authentication via email/password and Google OAuth, using Passport.js for session management and a robust role-based access control system. Session management now properly includes user role for admin features.
- **Coming Soon Waitlist Modal**: A pre-launch waitlist collection system integrated into the HomePage for collecting user contact information with Zod validation and database persistence.
- **SEO Optimization System** (November 2025): Production-ready SEO infrastructure targeting competitive healthcare keywords to outrank Amazon Pharmacy, GoodRx, and Cost Plus Drugs. Features include:
  - **Robots.txt & Sitemap**: Blocks admin routes, dynamic sitemap.xml includes 500+ medication pages and blog posts
  - **Schema.org Markup**: Enhanced pharmacy schema with competitive keywords, AggregateRating (4.9/5), HowTo schema for featured snippets, FAQ schema, Video schema, Breadcrumb schemas. Counter-based unique script IDs prevent collisions when multiple schemas load concurrently
  - **Meta Tag Optimization**: High-intent keywords on HomePage, MedicationsPage, BlogPage, and all 4 RegisterPage steps. SSR-safe `getBaseUrl()` helper for environment-aware canonical URLs
  - **Target Keywords**: "cheap prescriptions without insurance", "prescription drug club membership", "wholesale medication prices", "diabetes meds without insurance"
  - **Technical Implementation**: SEOHead component with unique counter-based script IDs (prevents schema collisions), SSR-compatible URL helpers, metadata persistence across multi-step flows
- **Multi-Step Registration**: A 4-step onboarding process covering social authentication, tier selection, user details, prescription preferences, and Stripe membership payment.
- **Payment Processing**: Integrated Stripe for subscription-based membership across three tiers.
- **PDF Prescription System**: Generates branded PDF prescription request forms with SureScripts pharmacy lookup information, distributed via email and SMS using PDFKit, Resend, and Twilio.
- **Account Settings & Member Dashboard**: Users can manage personal information and view a comprehensive dashboard with medication displays, PCP management, drug allergies, and subscription details.
- **Medication Ordering Workflow**: Streamlined process for requesting prescriptions with tier-based supply length enforcement.
- **Medication Search & Pricing**: CSV-based medication catalog for search and pricing, integrated with openFDA Drug Label API for annual pricing calculation.
- **Medication Refill System**: Automated refill request workflow with status tracking and admin oversight.
- **Personal Medication List**: User-managed list with OpenFDA integration for data enrichment and real-time drug-drug interaction checking.
- **Refund Policy System**: Comprehensive, transparent refund and cancellation policy with two-tier refund structure and annual commitment terms, available as web content and downloadable PDF.
- **Admin Dashboard System**: Comprehensive tools for platform oversight including Executive Dashboard, User Management (deactivate, soft delete, suspend, delete, recover), Financial Dashboard, Communication Center, Reports & Analytics, and Medication Pricing Management. Admin users can toggle between Admin Dashboard and User Dashboard via the header menu for seamless role switching.
- **Hybrid Blog System ("The Pillar Post 🗞️")**: A dual content generation platform combining general healthcare content (TypeScript/GPT-4) with FDA-compliant medical content (Python FastAPI RAG). Features include an admin interface for content generation, AI-powered SEO keyword generator that analyzes blog titles to suggest 8-12 optimized keywords, compliance review workflow, and a GoodRx-style visual redesign with featured image uploads (client-side resizing, compression, base64 storage).
- **HIPAA Security Infrastructure** (November 2025): Comprehensive HIPAA-compliant security controls including:
  - **Audit Logging System**: Tracks ALL PHI access (authorized & unauthorized), authentication events, admin actions. 6-year retention with indexed queries. Device fingerprinting (IP, user agent, browser/OS/device).
  - **Field-Level Encryption**: AES-256-CBC encryption for sensitive PHI (medical info, addresses). PBKDF2-SHA512 password hashing (100k iterations). Mandatory ENCRYPTION_KEY in production (fails fast if missing).
  - **Session Security**: 30-minute automatic timeout, device tracking, session regeneration on login, secure cookies (httpOnly, secure, sameSite:lax for CSRF protection).
  - **API Security**: Rate limiting (100 req/15min general, 5 req/15min auth), Helmet.js security headers (CSP, HSTS, XSS protection), input validation.
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