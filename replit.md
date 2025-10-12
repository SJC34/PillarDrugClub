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
- **PDF Prescription System**: Generates professional, branded PDF prescription request forms with complete SureScripts pharmacy lookup information (HealthWarehouse: NCPDP 1832674, NPI 1619252160, DEA FH1427536, Florence KY 41042) and distributes them to both patients and doctors via email and SMS, using PDFKit, Resend, and Twilio. Email templates also include full pharmacy details for easy provider reference. PDFs feature a two-column layout: left column displays requested medication details (Step 1 & 2: medication name, dosage, quantity, special instructions with automatic text wrapping for long names) and prescriber information (Step 3: doctor name, phone, fax, address); right column contains a highlighted savings section titled "MAXIMIZE YOUR PATIENT'S SAVINGS" showing the Levothyroxine 25mcg example (Traditional Insurance: $120/year vs Pillar Wholesale: $7.30/year, patient saves $112.70/year) and a prescription writing example box showing "#365" and "REFILLS: 0" to guide doctors on how to write year-supply prescriptions, all with clear 9-11pt typography for easy physician reading.
- **Account Settings**: Users can manage personal information (date of birth), contact details (phone number, SMS preferences), and mailing address through a dedicated settings page (/settings). The DOB field is used for prescription requests and pharmacy records.
- **Member Dashboard**: Displays current medications, refill information, primary care physician details (with integrated NPI database search for doctor management), and drug allergies management. Users can add/edit their drug allergies, which automatically prepopulate in prescription request forms.
- **Medication Ordering Workflow**: Clicking "Order with Prescription" on medication details or "Order Rx" on medication listings redirects to the prescription transfer page with medication info as URL parameters (medicationName, dosage, quantity), automatically prepopulating both doctor fax and pharmacy transfer forms alongside user profile data (DOB, allergies).
- **Prescription Transfer Page**: Features a responsive two-column layout with step indicators (1, 2, 3) positioned on the left side and form fields on the right (collapses to inline layout on mobile). Includes a savings explanation section at the top demonstrating year supply benefits using Levothyroxine 25mcg as an example: traditional insurance model ($120/year for 30 tablets + 11 refills with $10/month copays) vs Pillar wholesale pricing ($7.30/year for 365 tablets with no refills), showing potential savings of $112.70 per year.
- **File Upload & Storage**: Designed for secure handling of prescription uploads and medical documents, likely utilizing cloud storage.
- **Medication Search**: CSV-based medication catalog using the SJC Pharmacy pricing file, providing search and pricing information.
- **Annual Pricing System**: Integrates with the openFDA Drug Label API to calculate annual pricing for chronic medications, identifying and excluding short-course drugs.
- **Medication Refill System**: Automated refill request workflow with intelligent due-date calculation based on prescription supply days. Features include:
  - **Smart Refill Detection**: Automatically identifies prescriptions due within 7 days by calculating from lastFillDate + daysSupply
  - **Priority-Based Requests**: Supports routine, urgent, and emergency priority levels for refill requests
  - **Patient & Pharmacy Notes**: Bidirectional communication between patients and pharmacy staff
  - **Status Workflow**: Complete lifecycle tracking (pending → approved → filled/rejected)
  - **Admin Oversight**: Dedicated admin portal tab for managing all refill requests
  - **Patient Portal**: Dedicated refill pages for requesting refills (/refills) and viewing refill history (/refills/history)
  - **API Security**: All endpoints enforce user authentication and authorization, ensuring users can only access their own refill data
- **Admin Dashboard System**: Comprehensive administrative tools for platform oversight and management:
  - **Executive Dashboard** (/admin/dashboard): Real-time metrics display with user counts, prescription statistics, order volume, and refill queue; recent activity feeds showing latest users, prescriptions, and orders; clickable metric cards linking to detailed pages
  - **User Management** (/admin/users): Complete user directory with search (by name/email), role-based filtering (admin/client/broker/company), and status filtering (active/suspended); detailed user profiles showing account statistics (active prescriptions, order count, total spend) and recent order history; account management actions including suspend/activate functionality with self-suspension prevention
  - **Financial Dashboard** (/admin/financial): Revenue tracking with total revenue, monthly revenue, MRR, and average order value metrics; subscription analytics showing active, cancelled, and past due subscriptions with churn rate; 30-day revenue trend chart using Recharts; recent transactions table with customer details; queries actual order data from PostgreSQL database
  - **Communication Center** (/admin/communications): Email and SMS management interface with message statistics; send messages tab for composing emails and SMS to user segments; message history table tracking sent communications with delivery status; message templates for common notifications (prescription ready, refill reminders, order shipped, welcome emails); prepared for Twilio and Resend integration
  - **Reports & Analytics** (/admin/reports): Comprehensive reporting with user growth trend chart, revenue overview bar chart, subscription distribution pie chart, and prescription status breakdown; time range selector (7 days to 1 year); export options for user data, financial data, and prescription data (CSV format); visual analytics using Recharts library
  - **Security**: All admin endpoints require authentication (401) and admin role verification (403); users cannot suspend their own accounts; orders and users queried from database with proper type conversions

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