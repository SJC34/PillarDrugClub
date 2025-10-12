# Pillar Drug Club - Wholesale Prescription Pharmacy Platform

## Overview

Pillar Drug Club is a membership-based prescription pharmacy platform delivering affordable medications at wholesale prices directly to consumers. It's a full-stack web application (React/TypeScript frontend, Node.js/Express backend) designed to bypass insurance complexities and provide transparent, cost-effective medication access. The platform offers two membership tiers: Basic Plan ($15/month for 1-3 medications) and Plus Plan ($25/month for 4+ medications). The platform supports multiple user types (clients, brokers, companies, administrators) through dedicated portals, offering features like medication search, cost calculation, prescription management, and Stripe-integrated payment processing. The business vision is to revolutionize prescription access by making essential medications affordable and easily accessible, tapping into a significant market opportunity for direct-to-consumer healthcare solutions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

**UI/UX Decisions**: The frontend uses React 18 with TypeScript and Vite, employing a component-based architecture. Shadcn/ui and Tailwind CSS form the design system, inspired by modern healthcare aesthetics (e.g., Ro, Roman) with a focus on minimalism and professional typography (Plus Jakarta Sans and Inter families). The platform is mobile-first and fully responsive, ensuring optimal viewing and interaction across devices, including a touch-friendly mobile navigation overlay and adaptive layouts. The homepage features an auto-advancing Embla Carousel to engage users.

**Technical Implementations**:
- **Frontend**: Utilizes TanStack Query for server state management and caching, React Hook Form with Zod for form handling and validation.
- **Backend**: Express.js with TypeScript provides RESTful APIs. It features a storage abstraction layer, currently backed by a PostgreSQL database.
- **Database**: PostgreSQL with Drizzle ORM for type-safe operations. The schema includes comprehensive models for users, customers, medications, prescriptions, orders, and shipments, supporting complex medication data like NDC codes and pricing tiers.
- **Authentication & Authorization**: Implements dual authentication via email/password and OAuth (Google, Apple, X), using Passport.js for session management with PostgreSQL storage. A robust role-based access control system manages permissions for clients, brokers, companies, and admins.
- **Multi-Step Registration**: A 4-step onboarding process includes social authentication, user detail collection, prescription preference selection (new RX request with PDF generation/distribution or RX transfer), and Stripe membership payment integration.
- **Payment Processing**: Integrated Stripe for subscription-based membership and payment processing with two-tier pricing (Basic: $15/month for 1-3 medications, Plus: $25/month for 4+ medications). The subscription page features plan selection with race-condition-safe state management and proper Stripe Elements remounting when plans change.
- **PDF Prescription System**: Generates professional, branded PDF prescription request forms and distributes them to both patients and doctors via email and SMS, using PDFKit, Resend, and Twilio.
- **Member Dashboard**: Displays current medications, refill information, and primary care physician details, with integrated NPI database search for doctor management.
- **File Upload & Storage**: Designed for secure handling of prescription uploads and medical documents, likely utilizing cloud storage.
- **Medication Search**: CSV-based medication catalog using the SJC Pharmacy pricing file, providing search and pricing information.
- **Annual Pricing System**: Integrates with the openFDA Drug Label API to calculate annual pricing for chronic medications, identifying and excluding short-course drugs.

**System Design Choices**: The architecture emphasizes modularity, scalability, and security, particularly for sensitive healthcare data. The use of serverless PostgreSQL and a flexible storage layer contributes to scalability. Asynchronous communication for notifications ensures a responsive user experience.

## External Dependencies

- **Database Service**: Neon Database (serverless PostgreSQL).
- **Payment Gateway**: Stripe.
- **UI Components**: shadcn/ui (built on Radix UI).
- **Styling Framework**: Tailwind CSS.
- **Form Management**: React Hook Form, Zod.
- **HTTP Client**: TanStack Query.
- **Development Tools**: Vite, ESBuild.
- **Deployment Platform**: Replit.
- **Font Service**: Google Fonts (Inter family).
- **Healthcare Provider Database**: NLM Clinical Tables NPI database API.
- **Medication Data**: SJC Pharmacy pricing CSV file, openFDA Drug Label API.
- **E-Prescribing Network**: Surescripts (planned integration via certified partner like DoseSpot).
- **Healthcare Integration**: HealthWarehouse API (for medication sourcing).
- **Communication Services**: Twilio (SMS), Resend (email).