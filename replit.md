# Pillar Drug Club - Wholesale Prescription Pharmacy Platform

## Overview

Pillar Drug Club is a membership-based prescription pharmacy platform delivering affordable medications at wholesale prices directly to consumers. This full-stack web application (React/TypeScript frontend, Node.js/Express backend) bypasses insurance complexities to provide transparent, cost-effective medication access. It offers three membership tiers: **Free Tier** ($0/month with $30 dispensing/shipping fee per order, max 90-day supplies), **Gold Plan** ($15/month for 1-3 medications with access to 6-month and 1-year supplies), and **Platinum Plan** ($25/month for 4+ medications with access to 6-month and 1-year supplies). The platform supports multiple user types (clients, brokers, companies, administrators) with features like medication search, cost calculation, prescription management, and Stripe-integrated payment processing. The business aims to revolutionize prescription access by making essential medications affordable and easily accessible, addressing a significant market opportunity in direct-to-consumer healthcare.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

**UI/UX Decisions**: The frontend uses React 18 with TypeScript and Vite, built with Shadcn/ui and Tailwind CSS. The design is mobile-first, responsive, and inspired by modern healthcare aesthetics, focusing on minimalism and professional typography (Plus Jakarta Sans, Inter).

**Technical Implementations**:
- **Frontend**: Utilizes TanStack Query for server state management and caching, and React Hook Form with Zod for form validation.
- **Backend**: Express.js with TypeScript provides RESTful APIs, backed by a PostgreSQL database with Drizzle ORM.
- **Authentication & Authorization**: Dual authentication via email/password and Google OAuth (Replit Auth OIDC), using Passport.js for session management and a robust role-based access control system.
    - **Session Management Fix (Nov 2025)**: Fixed critical bug where user `role` was not being stored in session during email/password login and registration. Now properly includes `{ id, email, firstName, lastName, role }` in session object, enabling role-based access control for admin features like blog generation.
- **Coming Soon Waitlist Modal**: Pre-launch waitlist collection system integrated into HomePage featuring:
    - **Modal Popup**: Auto-displays on first visit with localStorage persistence to prevent re-showing to returning visitors
    - **Exit Control**: Explicit close button (X icon) in top-right corner for easy dismissal
    - **Contact Collection**: Secure signup form collecting name, email, and phone number with Zod validation, duplicate detection, and database persistence
    - **Database Schema**: Dedicated email_signups table with name, email, phone fields plus UTM tracking support for marketing analytics
    - **Public API Endpoint**: POST /api/email-signup with comprehensive error handling, phone format validation, and duplicate email prevention
    - **Responsive Design**: Mobile-first modal with gradient backgrounds, icon-enhanced inputs, and modern UI animations
    - **Auto-close**: Modal automatically closes 1.5 seconds after successful signup
    - **Standalone Page**: Original coming soon page still available at /coming-soon for direct access
- **SEO Optimization System**: Comprehensive search engine optimization designed to compete with Mark Cuban Cost Plus Drug Company and Scriptco featuring:
    - **Dynamic Meta Tags**: SEOHead component with page-specific title, description, keywords, and Open Graph/Twitter Card integration
    - **Healthcare Schema Markup**: Production-ready JSON-LD structured data including Pharmacy, MedicalWebPage, FAQPage, and Organization schemas (verified data only, no fabricated ratings/phones)
    - **Keyword Strategy**: Target competitive keywords ("wholesale pricing", "1 cent per tablet", "no insurance needed", "bypass PBMs", "cost plus drugs alternative") while highlighting unique value propositions
    - **Homepage Content**: Keyword-rich hero section with "As Low As 1¢ Per Tablet" messaging, benefits section emphasizing transparency, FAQ section with schema markup
    - **Technical SEO**: robots.txt with sitemap reference, sitemap.xml with priority pages, canonical URLs, mobile-friendly meta viewport
    - **Post-Deploy Validation**: Requires Google Rich Results Test and Search Console monitoring for indexing verification
- **Multi-Step Registration**: A 4-step onboarding process includes social authentication, tier selection, user detail collection, prescription preference selection, and Stripe membership payment (skipped for Free Tier).
- **Payment Processing**: Integrated Stripe for subscription-based membership with three-tier pricing (Free, Gold $15/month, Platinum $25/month). Free tier users bypass payment and can upgrade anytime.
- **PDF Prescription System**: Generates branded PDF prescription request forms with SureScripts pharmacy lookup information and distributes them via email and SMS using PDFKit, Resend, and Twilio. PDFs are structured to guide doctors on writing 6 or 12-month supply prescriptions.
- **Account Settings**: Users can manage personal information, contact details, and mailing addresses.
- **Member Dashboard**: Comprehensive user dashboard with quick action cards, current medication display, primary care physician management (with NPI search), drug allergies management, and subscription tier display with upgrade options for Free Tier users.
- **Medication Ordering Workflow**: Streamlined process for requesting prescriptions with tier-based supply length enforcement (Free Tier: max 90-day supplies; Gold/Platinum: access to 6-month and 1-year supplies).
- **Prescription Request Page**: Features a responsive two-column layout with step indicators, focusing on requesting new year-supply wholesale medications with automatic supply length restrictions based on user's subscription tier.
- **Medication Search**: CSV-based medication catalog providing search and pricing information.
- **Annual Pricing System**: Integrates with the openFDA Drug Label API to calculate annual pricing for chronic medications.
- **Medication Refill System**: Automated refill request workflow with smart refill detection, priority levels, patient/pharmacy notes, status tracking, and admin oversight.
- **Personal Medication List**: User-managed list with OpenFDA integration for data enrichment (warnings, interactions, side effects) and real-time drug-drug interaction checking.
- **Refund Policy System**: Comprehensive refund and cancellation policy documentation featuring:
    - **Two-tier refund structure**: Pre-prescription grace period (7 days full refund) and post-prescription non-refundable policy
    - **Annual commitment terms**: 12-month membership requirement for Gold and Platinum tiers with early termination fees ($180 Gold, $300 Platinum); Free Tier has no commitment
    - **PDF generation**: Professional branded refund policy PDFs with complete legal disclosure
    - **Web accessibility**: Dedicated /refund-policy page with HTML version and downloadable PDF
    - **Checkout integration**: Policy links integrated in subscription flow and footer for transparency
    - **Regulatory compliance**: Aligned with pharmacy regulations, FTC ROSCA, California Automatic Renewal Law
- **Admin Dashboard System**: Comprehensive tools for platform oversight including:
    - **Executive Dashboard**: Real-time metrics, recent activity feeds, and quick access to admin features.
    - **User Management**: User directory with search, filtering, detailed profiles, and comprehensive account management actions:
        - **Deactivate/Reactivate**: Temporarily disable or re-enable user accounts with optional reason tracking
        - **Soft Delete/Recovery**: Delete user accounts with 30-day recovery window and reason documentation
        - **Suspend/Activate**: Legacy account suspension functionality
        - All actions include audit logging and prevent admin self-modification
    - **Financial Dashboard**: Revenue tracking, subscription analytics, and transaction history.
    - **Communication Center**: Email and SMS management with message templates.
    - **Reports & Analytics**: Comprehensive reporting with charts and export options.
    - **Medication Pricing Management**: Bulk medication price updates via CSV upload with robust validation.
    - **Referral Monitoring**: Oversight for the member referral program with fraud detection and analytics.
    - **Hybrid Blog System ("The Pillar Post 🗞️")**: Dual content generation platform combining general healthcare content (TypeScript/GPT-4) with FDA-compliant medical content (Python FastAPI RAG):
        - **Architecture**: Two-service system with Node.js backend (port 5000) for general content and Python FastAPI service (port 8001) for medical RAG
        - **General AI Blog** (TypeScript/GPT-4):
            - Topic, category, tone, keywords, and target length customization
            - SEO optimization: auto-generates seoTitle (max 60 chars), seoDescription (max 160 chars), seoKeywords
            - Instant generation for pharmacy news, healthcare savings, general wellness topics
        - **Medical RAG Blog** (Python FastAPI):
            - **Vector Store**: FAISS-based RAG with OpenAI text-embedding-3-small embeddings
            - **FDA Source Ingestion**: Whitelisted US sources (FDA.gov, CDC.gov, NIH.gov), SPL section parsing, 400-900 token chunks
            - **Retrieval**: k=20 similarity search with freshness filters, required section validation (BOXED_WARNING, CONTRAINDICATIONS, etc.)
            - **Content Generation**: FDA-compliant prompts, numbered citations [1][2][3], safety sections, fair balance (benefits + risks)
            - **Compliance Guardrails**: Off-label detection, US-only validation, minimum 3-5 citations, disclaimer enforcement
            - **Review Workflow**: Async job processing → compliance policy report → manual admin checklist → approval → publishing
        - **Admin Interface**: /admin/blog with dual blog type selector, job polling for RAG generation, compliance review UI with required checkboxes
        - **Database Schema**: blog_posts (general), medical_blog_posts (RAG with compliance metadata), document_chunks (vector store)
        - **Public Pages**: /blog index with search/filtering, /blog/:slug with complete SEO, schema.org MedicalWebPage markup for medical posts
        - **Security**: Admin-only generation/editing, public read-only access, proper CORS for FastAPI service
        - **GoodRx-Style Redesign (Nov 2025)**: Complete visual overhaul to match professional blog aesthetics of GoodRx.com/health:
            - **Hero Section**: Large "The Answers You Need." heading with "From pharmacists and healthcare experts you can trust" subtitle
            - **Article Cards**: shadcn Card components with featured images (when available) or gradient fallbacks, maintaining design system consistency
            - **Professional Bylines**: "Written by [Author]" and "Updated on [Date]" formatting throughout all blog views
            - **Homepage Carousel**: Auto-rotating 6-post carousel with category badges, read time, publication dates, and author attribution
            - **Metadata Display**: Complete article information including category, date, read time estimates, and view counts
            - **Navigation Updates**: "PILLAR POST" link added to main navigation menu; prescriptions/orders moved to dashboard-only access
            - **Typography Improvements**: Enhanced readability with better spacing, larger titles, and clearer content hierarchy
            - **Responsive Design**: Mobile-first cards with proper aspect ratios, touch-friendly interactions, and adaptive layouts
        - **Bug Fixes (Nov 2025)**:
            - **Pagination Response Handling**: Fixed AdminBlogPage to properly handle paginated API response `{posts: [], total: 0}` instead of expecting raw array, preventing "posts.map is not a function" runtime error
            - **Admin Role Authentication**: Fixed session management to include user role, enabling proper admin access control for blog generation endpoints
- **System Design Choices**: Emphasizes modularity, scalability, and security for sensitive healthcare data, utilizing serverless PostgreSQL and asynchronous communication.

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
- **AI Content Generation**: OpenAI GPT-4 for general blog content (TypeScript backend), Python FastAPI RAG service for FDA-compliant medical content.