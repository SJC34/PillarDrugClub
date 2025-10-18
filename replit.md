# Pillar Drug Club - Wholesale Prescription Pharmacy Platform

## Overview

Pillar Drug Club is a membership-based prescription pharmacy platform delivering affordable medications at wholesale prices directly to consumers. This full-stack web application (React/TypeScript frontend, Node.js/Express backend) bypasses insurance complexities to provide transparent, cost-effective medication access. It offers two membership tiers: Foundation Plan ($15/month for 1-3 medications) and Keystone Plan ($25/month for 4+ medications). The platform supports multiple user types (clients, brokers, companies, administrators) with features like medication search, cost calculation, prescription management, and Stripe-integrated payment processing. The business aims to revolutionize prescription access by making essential medications affordable and easily accessible, addressing a significant market opportunity in direct-to-consumer healthcare.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

**UI/UX Decisions**: The frontend uses React 18 with TypeScript and Vite, built with Shadcn/ui and Tailwind CSS. The design is mobile-first, responsive, and inspired by modern healthcare aesthetics, focusing on minimalism and professional typography (Plus Jakarta Sans, Inter).

**Technical Implementations**:
- **Frontend**: Utilizes TanStack Query for server state management and caching, and React Hook Form with Zod for form validation.
- **Backend**: Express.js with TypeScript provides RESTful APIs, backed by a PostgreSQL database with Drizzle ORM.
- **Authentication & Authorization**: Dual authentication via email/password and Google OAuth (Replit Auth OIDC), using Passport.js for session management and a robust role-based access control system.
- **Multi-Step Registration**: A 4-step onboarding process includes social authentication, user detail collection, prescription preference selection, and Stripe membership payment.
- **Payment Processing**: Integrated Stripe for subscription-based membership with two-tier pricing.
- **PDF Prescription System**: Generates branded PDF prescription request forms with SureScripts pharmacy lookup information and distributes them via email and SMS using PDFKit, Resend, and Twilio. PDFs are structured to guide doctors on writing 6 or 12-month supply prescriptions.
- **Account Settings**: Users can manage personal information, contact details, and mailing addresses.
- **Member Dashboard**: Comprehensive user dashboard with quick action cards, current medication display, primary care physician management (with NPI search), and drug allergies management.
- **Medication Ordering Workflow**: Streamlined process for requesting prescriptions, prepopulating forms with user and medication data.
- **Prescription Request Page**: Features a responsive two-column layout with step indicators, focusing on requesting new year-supply wholesale medications and demonstrating savings.
- **Medication Search**: CSV-based medication catalog providing search and pricing information.
- **Annual Pricing System**: Integrates with the openFDA Drug Label API to calculate annual pricing for chronic medications.
- **Medication Refill System**: Automated refill request workflow with smart refill detection, priority levels, patient/pharmacy notes, status tracking, and admin oversight.
- **Personal Medication List**: User-managed list with OpenFDA integration for data enrichment (warnings, interactions, side effects) and real-time drug-drug interaction checking.
- **Admin Dashboard System**: Comprehensive tools for platform oversight including:
    - **Executive Dashboard**: Real-time metrics, recent activity feeds, and quick access to admin features.
    - **User Management**: User directory with search, filtering, detailed profiles, and account actions.
    - **Financial Dashboard**: Revenue tracking, subscription analytics, and transaction history.
    - **Communication Center**: Email and SMS management with message templates.
    - **Reports & Analytics**: Comprehensive reporting with charts and export options.
    - **Medication Pricing Management**: Bulk medication price updates via CSV upload with robust validation.
    - **Referral Monitoring**: Oversight for the member referral program with fraud detection and analytics.
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