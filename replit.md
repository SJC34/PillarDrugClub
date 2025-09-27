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

**Authentication & Authorization**: Session-based authentication system with role-based access control supporting multiple user types (clients, brokers, companies, admins). Each portal has specific permissions and feature access.

**Payment Processing**: Integrated Stripe subscription system for membership management. Supports recurring billing for membership fees and handles subscription status tracking.

**File Upload & Storage**: Designed to handle prescription uploads and document management, likely using cloud storage services for secure medical document handling.

**Responsive Design**: Mobile-first responsive design with Tailwind CSS breakpoints, ensuring accessibility across all device types.

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

**Healthcare Integration**: Designed to integrate with HealthWarehouse API for medication sourcing and inventory management.