# Pillar Drug Club - Wholesale Prescription Pharmacy Platform

## Overview

Pillar Drug Club is a membership-based prescription pharmacy platform that provides medications at wholesale prices directly to consumers. The system operates as a full-stack web application built with React/TypeScript frontend and Node.js/Express backend, designed to eliminate insurance hassles and provide transparent, affordable medication access through direct-to-consumer delivery.

The platform serves multiple user types through dedicated portals: clients seeking affordable medications, brokers managing client relationships, companies providing employee benefits, and administrators overseeing the entire system. Core functionality includes medication search and pricing, cost calculation tools, prescription management, and integrated payment processing through Stripe subscriptions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

**Frontend Architecture**: Built with React 18 and TypeScript using Vite as the build tool. The client-side application follows a component-based architecture with shadcn/ui for the design system and Tailwind CSS for styling. The UI implements a modern healthcare design approach inspired by companies like Ro and Roman, emphasizing medical credibility through minimal design and professional typography.

**State Management**: Uses TanStack Query (React Query) for server state management and caching, with local state handled through React hooks. Form management is handled by React Hook Form with Zod validation schemas.

**Backend Architecture**: Express.js server with TypeScript providing RESTful API endpoints. The architecture uses a storage abstraction layer that can work with different database implementations, currently configured for PostgreSQL through Neon Database serverless.

**Database Design**: PostgreSQL database using Drizzle ORM for type-safe database operations. The schema includes comprehensive models for users, customers, medications, prescriptions, orders, and shipments. The system supports complex medication data including NDC codes, pricing tiers, and inventory management.

**Authentication & Authorization**: Dual authentication system supporting both email/password and direct OAuth social login (Google, Apple, X/Twitter). Session-based authentication uses Passport.js with PostgreSQL session storage (connect-pg-simple) for persistent sessions with 1-week TTL. Both email/password login (`POST /api/auth/login`) and registration (`POST /api/auth/register`) properly establish sessions using `req.login()`, ensuring users remain authenticated across requests. The `useAuth` hook on the frontend queries `/api/auth/user` to check authentication status. Role-based access control supports multiple user types (clients, brokers, companies, admins) with specific permissions per portal. OAuth implementation uses separate Passport strategies for each provider with email fallback handling for returning users when providers don't re-send email addresses (common with Apple after first authorization and Twitter). Logout endpoint (`POST /api/auth/logout`) properly destroys sessions.

**Multi-Step Registration Flow**: Comprehensive 4-step registration process designed for seamless onboarding. Step 1 presents social authentication (Google, Apple, X) as primary sign-up method alongside traditional email/password option. Step 2 collects additional user details including first name, last name, email (if not from social auth), phone number with TCPA-compliant SMS consent checkbox, and password (if using email/password route). Step 3 offers prescription preference selection with three options: "Request New RX from Doctor" (integrates DoctorSearch with NPI database lookup and distributes professional PDF prescription request forms), "Transfer RX from Current Pharmacy" (integrates PharmacySearch with NPI database lookup), or "Skip for Now" to add prescriptions later. When requesting a new prescription, the system generates a professional PDF form modeled after Cost Plus Drugs design and distributes it to both patient and doctor: patient receives PDF via email with instructions to forward to doctor or upload to secure portal, plus SMS reminder; doctor receives PDF via email with electronic submission instructions, plus SMS notification. Step 4 handles Stripe subscription payment ($10/month membership) with graceful fallback to dashboard redirect if payment configuration is unavailable. Backend endpoints include PATCH /api/users/:userId for updating user details after social authentication, POST /api/prescriptions/transfer for saving prescription transfer requests, and POST /api/prescriptions/generate-pdf for prescription requests with automated PDF generation and multi-recipient distribution. The flow properly normalizes SMS consent to string "true"/"false" for database storage and maintains state across steps using react-hook-form and localStorage.

**Payment Processing**: Integrated Stripe subscription system for membership management. Supports recurring billing for membership fees and handles subscription status tracking.

**PDF Prescription Request System**: Professional PDF form generation and multi-recipient distribution system with full brand integration. PDFs are designed with the website's teal color palette (#2BABA2 primary, #0A736D secondary, #1C2F2E foreground, #E5F5F4 light backgrounds, #5A7A78 muted text) matching the Plus Jakarta Sans aesthetic. Form includes patient information with email for provider matching, medication details, prescriber information, and highlighted Step 4 instructions for electronic submission via Surescripts eRx Network, plus privacy disclaimers and PHI notices. Distribution workflow: (1) Patient receives PDF via email with forwarding instructions and SMS reminder to send form to doctor or upload to secure portal, (2) Doctor receives PDF via email with electronic submission instructions and SMS notification. All notifications use Promise.allSettled() for reliable async processing with comprehensive error logging. PDF generation uses PDFKit library, emails with base64-encoded attachments are sent via Resend integration, and SMS notifications are sent via Twilio integration. Member Dashboard displays prescription requests with download and text-to-phone options (GET /api/prescription-requests/user/:userId, GET /api/prescription-requests/:id/pdf, POST /api/prescription-requests/:id/text).

**Member Dashboard Features**: Comprehensive dashboard displaying user's prescription and medication information with real-time updates. Dashboard includes Current Medications section showing active prescriptions with medication names, dosages, refill information, and status badges (empty state when no medications on file). Primary Care Physician section displays doctor's information including name, NPI number, phone, and address with ability to change doctors through integrated NPI database search (empty state when no doctor on file). Backend API endpoints: GET /api/users/:userId/medications returns active medication list, GET /api/users/:userId/primary-doctor retrieves current primary physician data, PUT /api/users/:userId/primary-doctor updates user's primary care physician with validation. Database schema extended with primaryDoctorId, primaryDoctorName, primaryDoctorNpi, primaryDoctorPhone, and primaryDoctorAddress (JSONB) fields in users table. React Query implementation uses single-string query keys matching exact API paths for proper cache invalidation and data synchronization.

**File Upload & Storage**: Designed to handle prescription uploads and document management, likely using cloud storage services for secure medical document handling.

**Responsive Design**: Comprehensive mobile-first responsive design implementation completed across the entire application. Features include mobile navigation overlay with touch-friendly targets, responsive grids that stack on mobile (grid-cols-1 sm:grid-cols-2 md:grid-cols-3), adaptive typography scaling, mobile-optimized input heights and form layouts, and progressive enhancement from mobile to desktop breakpoints. All major pages (HomePage, RegisterPage, CostCalculatorPage, PrescriptionTransferPage) have been optimized for mobile devices with proper spacing, readable text, and intuitive navigation patterns. Successfully tested across multiple viewport sizes (375px to 1200px+) with automated responsive testing confirming functionality.

**Homepage Carousel**: The homepage features an auto-advancing carousel built with Embla Carousel showcasing three slides: (1) pharmacy line image demonstrating the problem of waiting in pharmacy lines, (2) "Avoid This" video with text overlay, and (3) "Join Pillar!" video with clickable call-to-action. Text overlays use reduced font sizing (text-2xl md:text-3xl) for better mobile spacing and visual balance. Carousel auto-advances every 5 seconds (25% slower than standard speed for better engagement), with navigation arrows visible on desktop. The implementation uses embla-carousel-autoplay plugin with pause-on-hover functionality for improved user experience.

## External Dependencies

**Database Service**: Neon Database serverless PostgreSQL for primary data storage with connection pooling and automatic scaling.

**Payment Gateway**: Stripe for subscription management, payment processing, and billing automation. Configured for recurring membership fees and one-time payments.

**UI Components**: shadcn/ui component library built on Radix UI primitives, providing accessible and customizable interface elements.

**Styling Framework**: Tailwind CSS for utility-first styling with custom design tokens matching healthcare industry standards.

**Form Management**: React Hook Form with Hookform Resolvers for form validation and Zod schemas for type-safe data validation.

**HTTP Client**: TanStack Query for API calls, caching, and server state synchronization with built-in error handling and retry mechanisms.

**Development Tools**: Vite for fast development builds, ESBuild for production bundling, and TypeScript for type safety across the entire application.

**Deployment Platform**: Configured for Replit deployment with specialized plugins for development and debugging.

**Font Service**: Google Fonts (Inter family) for consistent typography across the platform.

**Geographic Services**: Likely integrates with geolocation APIs for doctor finder and delivery address validation features.

**Healthcare Provider Database**: Integrates with the NLM (National Library of Medicine) Clinical Tables NPI database API for real-time search of doctors and pharmacies. The system searches both individual providers and organizations, auto-populating prescription transfer forms with verified names, addresses, and taxonomy information. Address data is parsed from the national database format into structured street, city, state, and ZIP components.

**E-Prescribing Network**: Configured to integrate with Surescripts, the nation's largest health information network connecting 1.6M+ healthcare providers and 99% of U.S. pharmacies. Integration planned through certified partner (DoseSpot recommended at $525/month for up to 500 prescriptions). Provides electronic prescription routing (NewRx), medication history access, pharmacy communication (RxChange), and prescription fill confirmations (RxFill). Requires Surescripts Business Associate Agreement (BAA), HIPAA compliance documentation, and DEA third-party audit for controlled substances (EPCS).

**Healthcare Integration**: Designed to integrate with HealthWarehouse API for medication sourcing and inventory management.

**Communication Services**: Twilio integration for SMS notifications and Resend integration for transactional email delivery. Used primarily for automated doctor notifications during prescription request workflow, sending both email and SMS alerts when patients request new prescriptions. The notification system operates asynchronously using Promise.allSettled() to prevent blocking the main request flow and ensures graceful error handling.