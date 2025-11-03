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
- **SEO Optimization System**: Comprehensive SEO with dynamic meta tags, healthcare schema markup (JSON-LD), and a keyword strategy targeting competitive healthcare terms.
- **Multi-Step Registration**: A 4-step onboarding process covering social authentication, tier selection, user details, prescription preferences, and Stripe membership payment.
- **Payment Processing**: Integrated Stripe for subscription-based membership across three tiers.
- **PDF Prescription System**: Generates branded PDF prescription request forms with SureScripts pharmacy lookup information, distributed via email and SMS using PDFKit, Resend, and Twilio.
- **Account Settings & Member Dashboard**: Users can manage personal information and view a comprehensive dashboard with medication displays, PCP management, drug allergies, and subscription details.
- **Medication Ordering Workflow**: Streamlined process for requesting prescriptions with tier-based supply length enforcement.
- **Medication Search & Pricing**: CSV-based medication catalog for search and pricing, integrated with openFDA Drug Label API for annual pricing calculation.
- **Medication Refill System**: Automated refill request workflow with status tracking and admin oversight.
- **Personal Medication List**: User-managed list with OpenFDA integration for data enrichment and real-time drug-drug interaction checking.
- **Refund Policy System**: Comprehensive, transparent refund and cancellation policy with two-tier refund structure and annual commitment terms, available as web content and downloadable PDF.
- **Admin Dashboard System**: Comprehensive tools for platform oversight including Executive Dashboard, User Management (deactivate, soft delete, suspend), Financial Dashboard, Communication Center, Reports & Analytics, and Medication Pricing Management.
- **Hybrid Blog System ("The Pillar Post 🗞️")**: A dual content generation platform combining general healthcare content (TypeScript/GPT-4) with FDA-compliant medical content (Python FastAPI RAG). Features include an admin interface for content generation, compliance review workflow, and a GoodRx-style visual redesign with featured image uploads (client-side resizing, compression, base64 storage).

### System Design Choices
Emphasizes modularity, scalability, and security for sensitive healthcare data, utilizing serverless PostgreSQL and asynchronous communication.

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