# Pillar Drug Club - Platform Workflow Documentation

**Version:** 1.0  
**Last Updated:** November 2025  
**Owner:** HEWA (Pillar Drug Club)

---

## Table of Contents

1. [Overview](#overview)
2. [User Journey Workflows](#user-journey-workflows)
3. [Prescription Fulfillment Process](#prescription-fulfillment-process)
4. [Membership Management](#membership-management)
5. [Content Generation Workflows](#content-generation-workflows)
6. [Administrative Operations](#administrative-operations)
7. [Technical Integration Workflows](#technical-integration-workflows)
8. [Data Flow & Integration Map](#data-flow--integration-map)
9. [Compliance & Security](#compliance--security)
10. [Appendix: API Reference](#appendix-api-reference)

---

## Overview

### Platform Purpose
Pillar Drug Club is a membership-based prescription pharmacy platform that delivers affordable medications at wholesale prices directly to consumers, bypassing insurance complexities.

### Core Value Proposition
- **Transparent Pricing**: As low as 1¢ per tablet
- **Three Membership Tiers**: Free ($0), Gold ($15/month), Platinum ($25/month)
- **Supply Length Options**: 90-day (Free), 6-month (Gold/Platinum), 1-year (Gold/Platinum)
- **No Insurance Required**: Direct-to-consumer wholesale pricing

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (Neon serverless)
- **Payments**: Stripe
- **Communications**: Twilio (SMS), Resend (Email)
- **AI**: OpenAI GPT-4 (blog content), Python FastAPI RAG (medical content)

---

## User Journey Workflows

### 1. Visitor Discovery → Lead Capture

**Actors**: Prospective user, Marketing system  
**Entry Points**: Homepage, Google search, social media

#### Flow:
```
1. User visits pillardrugclub.com
   └─> Homepage loads with hero section "As Low As 1¢ Per Tablet"
   
2. Coming Soon Waitlist Modal appears (first-time visitors only)
   ├─> localStorage check: has user seen modal?
   ├─> If NO: Display modal with signup form
   └─> If YES: Skip modal
   
3. User explores features
   ├─> Browse medication catalog
   ├─> Use cost calculator
   └─> Read "The Pillar Post" blog content
   
4. Waitlist signup (optional)
   ├─> User fills: name, email, phone
   ├─> Frontend validates with Zod schema
   ├─> POST /api/email-signup
   ├─> Backend checks for duplicate email
   ├─> Store in email_signups table
   ├─> Success toast + auto-close modal (1.5s)
   └─> localStorage: mark modal as seen
```

**UI Touchpoints**:
- `HomePage.tsx` - Hero, benefits, FAQ
- `MedicationSearchPage.tsx` - Catalog browsing
- `CostCalculatorPage.tsx` - Price comparisons
- `BlogPage.tsx` - Healthcare content

**API Endpoints**:
- `POST /api/email-signup` - Waitlist capture

**Data Created**:
- `email_signups` record with UTM tracking

---

### 2. User Registration & Onboarding

**Actors**: New user, Registration system, Stripe  
**Trigger**: User clicks "Sign Up" or "Get Started"

#### Registration Flow:

##### Step 1: Complete Registration Form
```
User fills out comprehensive registration form:
├─> Required fields (all collected upfront):
│   ├─> Email
│   ├─> Password (minimum 8 characters)
│   ├─> Confirm password
│   ├─> First name
│   ├─> Last name
│   ├─> Date of birth
│   ├─> Phone number
│   └─> SMS consent checkbox
│
├─> Frontend validation (Zod schema matches insertUserSchema)
├─> Submit: POST /api/auth/register
│   ├─> Backend validates all fields
│   ├─> Hash password with bcrypt
│   ├─> Create users table record:
│   │   ├─> id (auto-generated UUID)
│   │   ├─> email, password, firstName, lastName
│   │   ├─> dateOfBirth, phoneNumber, smsConsent
│   │   ├─> role = "client" (default)
│   │   ├─> subscriptionTier = "free" (default)
│   │   ├─> subscriptionStatus = "incomplete"
│   │   └─> createdAt = NOW()
│   │
│   └─> Create session with: {id, email, firstName, lastName, role}
│
└─> Return success → User is logged in

Alternative: Google OAuth (Replit Auth OIDC)
├─> User clicks "Sign in with Google"
├─> Redirect to /api/auth/google
├─> OIDC handshake
├─> Upsert users record (id, email, firstName, lastName, profileImageUrl)
├─> Create session
└─> Redirect to dashboard or tier selection
```

##### Step 2: Membership Tier Selection
```
Display tier comparison:
├─> Free Tier ($0/month)
│   ├─> $30 dispensing/shipping per order
│   ├─> Max 90-day supplies only
│   └─> No payment required
│
├─> Gold Plan ($15/month)
│   ├─> 1-3 medications
│   ├─> Access to 6-month & 1-year supplies
│   └─> Requires Stripe subscription
│
└─> Platinum Plan ($25/month)
    ├─> 4+ medications
    ├─> Access to 6-month & 1-year supplies
    └─> Requires Stripe subscription

User selects tier → Store in session/state
```

##### Step 3: Additional Profile Setup (Optional)
```
After initial registration, user can optionally add:
├─> Mailing address
│   └─> PATCH /api/users/:userId with userAddress JSON
│
├─> Primary Care Physician
│   ├─> Search NPI database
│   ├─> PATCH /api/users/:userId with:
│   │   ├─> primaryDoctorName
│   │   ├─> primaryDoctorNpi
│   │   ├─> primaryDoctorPhone
│   │   └─> primaryDoctorAddress
│   │
└─> Drug allergies
    └─> PATCH /api/users/:userId with drugAllergies array

Note: These can be filled during first prescription request
```

##### Step 4: Payment Processing (Gold/Platinum only)
```
If tier = Free:
└─> Skip payment → Complete registration

If tier = Gold or Platinum:
├─> Display Stripe Checkout
├─> User enters card details
├─> Frontend: POST /api/create-subscription
├─> Backend: Stripe.customers.create()
├─> Backend: Stripe.subscriptions.create()
├─> Store subscription_id, customer_id in users table
├─> Set subscription_status = "active"
└─> Webhook confirmation (async)
```

##### Step 5: Finalization
```
Complete onboarding:
├─> If subscription created successfully:
│   ├─> User record updated with Stripe IDs
│   ├─> subscriptionStatus = "active"
│   └─> subscriptionTier = selected tier
│
├─> Send welcome email (Resend)
├─> Optional: Send welcome SMS (Twilio) if smsConsent = true
├─> Clear registration state
└─> Redirect to /dashboard
```

**API Endpoints**:
- `POST /api/auth/register` - Create user account (all data upfront)
- `POST /api/auth/login` - Email/password login
- `GET /api/auth/google` - OAuth initiation
- `POST /api/create-subscription` - Stripe subscription
- `PATCH /api/users/:userId` - Update profile after registration

**Data Created**:
- `users` table record (contains all user data, no separate profiles table)
- `sessions` table record
- Stripe customer & subscription (if paid tier)
- Welcome email log

---

### 3. Free Tier Member Journey

**Actors**: Free tier user, Prescription system, HealthWarehouse  
**Context**: User with $0/month membership, $30 per order fee

#### Typical Flow:
```
1. Login → Dashboard
   ├─> View current medications (if any)
   ├─> See subscription status: "Free Tier"
   └─> Upgrade prompt visible
   
2. Browse Medications
   ├─> Navigate to /medications
   ├─> Search medication catalog (CSV-based)
   ├─> View pricing (90-day max)
   └─> "Calculate Annual Cost" shows restricted to 90-day

3. Request Prescription
   ├─> Click "Request Prescription"
   ├─> Fill prescription request form:
   │   ├─> Medication name (autocomplete from catalog)
   │   ├─> Dosage, quantity
   │   ├─> Supply length: **LOCKED to 90-day max**
   │   ├─> Prescriber information (NPI search)
   │   └─> Upload existing prescription (optional)
   │
   ├─> POST /api/prescriptions
   ├─> Backend validates: tier = "free" → max daysSupply = 90
   ├─> Create prescriptions table record (status = "pending")
   ├─> Generate PDF: POST /api/prescriptions/generate-pdf
   ├─> Send to prescriber via email (Resend)
   ├─> Send to user via SMS: POST /api/prescription-requests/:id/text
   └─> Status updated as prescriber responds

4. Prescriber Responds
   ├─> Doctor sends prescription to HealthWarehouse
   ├─> Admin manually updates status → "prescription_received"
   └─> User notification sent

5. Order Processing
   ├─> Admin creates order record
   ├─> Calculate total: medication cost + $30 fee
   ├─> Send payment link to user
   ├─> User pays via Stripe
   ├─> Order fulfillment begins
   └─> Shipment tracking provided

6. Refill Management
   ├─> 30 days before supply runs out
   ├─> System shows "Refill Available" badge
   ├─> User clicks "Request Refill"
   ├─> POST /api/refill-requests
   ├─> Auto-populate medication details
   ├─> Same workflow as step 3
   └─> Status tracking in dashboard
```

**UI Touchpoints**:
- `DashboardPage.tsx` - Overview, quick actions
- `MedicationSearchPage.tsx` - Browse catalog
- `PrescriptionRequestPage.tsx` - New prescription
- `PersonalMedicationsPage.tsx` - Current meds

**Tier Restrictions**:
- Max supply: 90 days
- Per-order fee: $30
- Cannot access 6-month or 1-year options

---

### 4. Paid Tier Member Journey (Gold/Platinum)

**Actors**: Paid member, Subscription system, Stripe  
**Context**: User with active $15 or $25/month subscription

#### Enhanced Flow:
```
1. Login → Dashboard
   ├─> View subscription status: "Gold" or "Platinum"
   ├─> See next billing date
   ├─> No upgrade prompts
   └─> Full feature access

2. Browse Medications
   ├─> Search medication catalog
   ├─> View pricing for ALL supply lengths:
   │   ├─> 90-day supply
   │   ├─> 6-month supply (180-day)
   │   └─> 1-year supply (360-day)
   └─> Annual cost calculator shows full savings

3. Request Prescription (Enhanced)
   ├─> Fill prescription request form
   ├─> Supply length dropdown: **ALL options available**
   │   ├─> 90-day
   │   ├─> 6-month (recommended)
   │   └─> 1-year (maximum savings)
   │
   ├─> POST /api/prescriptions
   ├─> Backend validates: tier = "gold"/"platinum" → allow daysSupply up to 360
   ├─> Generate PDF with year-supply recommendations
   └─> Same prescriber outreach workflow (email + SMS)

4. Order Processing (No Per-Order Fee)
   ├─> Prescription received
   ├─> Calculate total: medication cost only (no $30 fee)
   ├─> Payment processed via stored Stripe payment method
   ├─> Auto-pay option available
   └─> Faster fulfillment

5. Subscription Management
   ├─> View billing history
   ├─> Update payment method (via Stripe customer portal)
   ├─> Cancel subscription: POST /api/subscription/cancel
   │   ├─> Check termination fee: GET /api/subscription/termination-fee/:userId
   │   ├─> If fee applies: POST /api/subscription/cancel-with-fee
   │   └─> Commitment reminder: 12-month minimum
   │
   └─> View status: GET /api/subscription-status/:userId

6. Advanced Features
   ├─> Personal medication list: GET/POST /api/users/:userId/medications
   ├─> Medication interaction checking (OpenFDA integration)
   ├─> Drug allergy tracking (stored in users.drugAllergies)
   ├─> Primary care physician management
   └─> Refill requests: POST /api/refill-requests
```

**Subscription Events** (Stripe webhooks):
- `subscription.created` - Initial signup
- `subscription.updated` - Tier/payment method change
- `invoice.payment_succeeded` - Successful renewal
- `invoice.payment_failed` - Payment retry logic
- `subscription.deleted` - Cancellation complete

**API Endpoints**:
- `POST /api/create-subscription` - Create subscription
- `POST /api/subscription/cancel` - Cancel (no fee)
- `POST /api/subscription/cancel-with-fee` - Cancel with termination fee
- `GET /api/subscription-status/:userId` - Current status
- `GET /api/subscription/termination-fee/:userId` - Calculate fee

---

### 5. Admin User Journey

**Actors**: Platform administrator  
**Access**: Role-based (role = "admin")

#### Admin Portal Flow:
```
1. Login → Admin Check
   ├─> Session includes {role: "admin"}
   ├─> Frontend checks: user?.role === "admin"
   ├─> If TRUE: Show admin navigation
   └─> If FALSE: Hide admin routes (403 on access)

2. Admin Dashboard (/admin)
   ├─> Executive metrics:
   │   ├─> Total users, active subscriptions
   │   ├─> Monthly recurring revenue (MRR)
   │   ├─> Pending prescriptions count
   │   └─> Recent activity feed
   │
   └─> Quick actions:
       ├─> Create blog post
       ├─> View pending prescriptions
       ├─> User management
       └─> Financial dashboard

3. User Management (/admin/users)
   ├─> Search & filter users
   ├─> View user profiles
   ├─> Actions:
   │   ├─> Deactivate account (soft disable)
   │   ├─> Reactivate account
   │   ├─> Soft delete (30-day recovery)
   │   ├─> Recover deleted account
   │   └─> View audit log
   │
   ├─> Each action:
   │   ├─> Requires reason input
   │   ├─> PATCH /api/admin/users/:id
   │   ├─> Update status field
   │   ├─> Log action in audit_logs table
   │   └─> Optional notification to user
   │
   └─> Self-protection: Cannot modify own admin account

4. Blog Management (/admin/blog)
   ├─> Generate content (covered in Section 5)
   ├─> Edit existing posts
   ├─> Manage featured images
   └─> Publish/unpublish posts

5. Financial Dashboard (/admin/financial)
   ├─> Revenue charts (Recharts)
   ├─> Subscription breakdown by tier
   ├─> Refund requests
   ├─> Transaction history (Stripe webhook data)
   └─> Export CSV reports

6. Medication Pricing (/admin/medications)
   ├─> Upload new pricing CSV
   ├─> Bulk update prices
   ├─> Sync with HealthWarehouse catalog
   └─> Validation & error handling

7. Communications (/admin/communications)
   ├─> Send broadcast emails
   ├─> Send broadcast SMS
   ├─> Message templates
   └─> Delivery tracking
```

**Admin API Endpoints**:
- `GET /api/admin/users` - User directory
- `PATCH /api/admin/users/:id` - User actions
- `POST /api/admin/broadcast-email` - Email blast
- `POST /api/admin/broadcast-sms` - SMS blast
- `POST /api/admin/medications/upload` - Pricing update

**Security**:
- All admin routes check `req.user?.role === "admin"`
- Audit logging for all actions
- Cannot self-modify admin accounts
- Rate limiting on bulk operations

---

## Prescription Fulfillment Process

### End-to-End Workflow

**Actors**: Patient, Prescriber, Admin, HealthWarehouse, Payment system  
**Trigger**: User submits prescription request

#### Detailed Flow:

##### Phase 1: Patient Intake
```
Step 1: User initiates request
├─> Navigate to /prescriptions/new
├─> Form fields:
│   ├─> Medication name (autocomplete from catalog)
│   ├─> Dosage (e.g., "10mg")
│   ├─> Quantity per dose
│   ├─> Supply length dropdown:
│   │   ├─> Free tier: 90-day only
│   │   └─> Gold/Platinum: 90-day, 6-month, 1-year
│   │
│   ├─> Prescriber information:
│   │   ├─> Search by NPI number or name
│   │   ├─> API call: NLM Clinical Tables NPI database
│   │   ├─> Select from results
│   │   └─> Store: name, NPI, phone, fax, address
│   │
│   ├─> Medical justification (textarea)
│   ├─> Current medication status (dropdown)
│   └─> Upload existing prescription (optional)
│       ├─> File type: PDF, JPG, PNG
│       ├─> Max size: 10MB
│       └─> Store as base64 in database
│
├─> Frontend validation (Zod schema)
├─> Submit: POST /api/prescription-requests
└─> Backend processing begins...
```

##### Phase 2: Medication Verification
```
Step 2: Backend validates request
├─> Check user tier:
│   ├─> tier = "free" → supply length max 90 days
│   ├─> tier = "gold"/"platinum" → allow all
│   └─> Reject if violation
│
├─> Verify medication in catalog:
│   ├─> Query medications table
│   ├─> Match by name (fuzzy search)
│   ├─> Retrieve pricing data
│   └─> If not found: flag for manual review
│
├─> Calculate costs:
│   ├─> Base medication cost (from CSV)
│   ├─> Supply length multiplier
│   ├─> Add dispensing fee (Free tier only)
│   └─> Store estimated_cost
│
└─> Optional: HealthWarehouse API check
    ├─> Verify medication availability
    ├─> Confirm pricing accuracy
    └─> Get stock status
```

##### Phase 3: Prescriber Outreach
```
Step 3: Generate & distribute prescription form
├─> PDF Generation (PDFKit):
│   ├─> Template: Branded Pillar Drug Club letterhead
│   ├─> Patient information
│   ├─> Medication details with recommended supply
│   ├─> Pharmacy information:
│   │   ├─> HealthWarehouse details
│   │   ├─> SureScripts ID
│   │   ├─> Phone: 1-800-748-7001
│   │   └─> Fax number
│   │
│   ├─> Clear instructions for prescriber:
│   │   └─> "Please prescribe [medication] for [supply length]"
│   │
│   └─> Save PDF buffer in memory
│
├─> Email Distribution (Resend):
│   ├─> To: Prescriber email (from NPI data)
│   ├─> CC: User email
│   ├─> Subject: "Prescription Request for [Patient Name]"
│   ├─> Body: Professional template with context
│   ├─> Attachment: PDF prescription form
│   ├─> Track: email_id for delivery status
│   └─> Log: emails_sent table
│
├─> SMS Distribution (Twilio):
│   ├─> To: User phone number
│   ├─> Message: "Your prescription request has been sent to Dr. [Name]. 
│   │           Track status: pillardrugclub.com/dashboard"
│   ├─> Include: Direct link to prescription status
│   └─> Log: sms_sent table
│
└─> Update prescription request:
    ├─> status = "pending_prescriber_approval"
    ├─> sent_to_prescriber_at = NOW()
    └─> Notification sent to user dashboard
```

##### Phase 4: Prescription Receipt & Verification
```
Step 4: Prescriber responds
├─> Doctor sends prescription to HealthWarehouse:
│   ├─> Via SureScripts (electronic)
│   ├─> Via fax
│   └─> Via direct upload
│
├─> HealthWarehouse notifies Pillar Drug Club
│   └─> Manual check or API webhook (future)
│
├─> Admin reviews in Admin Portal:
│   ├─> Navigate to /admin/prescriptions
│   ├─> See pending prescriptions list
│   ├─> Click to review details
│   ├─> Verify prescription matches request
│   ├─> Check for any flags or issues
│   └─> Update status
│
└─> Admin action:
    ├─> PATCH /api/admin/prescription-requests/:id
    ├─> Set status = "prescription_received"
    ├─> Add admin notes if needed
    ├─> Trigger notification to user:
    │   ├─> Email: "Your prescription has been received!"
    │   └─> SMS: "Prescription approved. Next: payment"
    └─> Move to order creation phase
```

##### Phase 5: Order Creation & Payment
```
Step 5: Create order record
├─> Admin creates order:
│   ├─> POST /api/admin/orders
│   ├─> Link to prescription_request_id
│   ├─> Calculate final cost:
│   │   ├─> Medication cost × supply quantity
│   │   ├─> Add dispensing fee (Free tier: $30)
│   │   └─> Total amount
│   │
│   └─> Order status = "pending_payment"
│
├─> Payment processing:
│   ├─> If tier = Free:
│   │   ├─> Generate Stripe payment link
│   │   ├─> Email link to user
│   │   ├─> User pays one-time fee
│   │   └─> Webhook: payment_intent.succeeded
│   │
│   └─> If tier = Gold/Platinum:
│       ├─> Use stored payment method
│       ├─> Auto-charge subscription card
│       ├─> Stripe invoice generated
│       └─> Webhook: invoice.paid
│
└─> Payment confirmation:
    ├─> Update order status = "paid"
    ├─> Notify user: "Payment received!"
    └─> Forward to HealthWarehouse for fulfillment
```

##### Phase 6: Fulfillment & Shipment
```
Step 6: HealthWarehouse processes order
├─> Pillar Drug Club sends order to HealthWarehouse:
│   ├─> API call (or manual for now)
│   ├─> Include: patient info, prescription, shipping address
│   └─> Receive: HealthWarehouse order ID
│
├─> HealthWarehouse fulfills:
│   ├─> Pull medication from inventory
│   ├─> Package according to regulations
│   ├─> Generate shipping label
│   ├─> Ship via USPS/UPS/FedEx
│   └─> Provide tracking number
│
├─> Update order record:
│   ├─> PATCH /api/admin/orders/:id
│   ├─> status = "shipped"
│   ├─> tracking_number = "[...]"
│   ├─> shipped_at = NOW()
│   └─> estimated_delivery_date = [calculated]
│
└─> Notify user:
    ├─> Email: "Your order has shipped!"
    ├─> SMS: "Track your package: [link]"
    └─> Dashboard: Show tracking widget
```

##### Phase 7: Delivery & Completion
```
Step 7: Package delivery
├─> Carrier delivers medication
├─> User receives package
├─> Optional: Delivery confirmation scan
│
├─> Update order record:
│   ├─> status = "delivered"
│   ├─> delivered_at = NOW()
│   └─> completion logged
│
├─> Post-delivery communication:
│   ├─> Email: "How was your experience?"
│   ├─> Request review/feedback
│   └─> Offer refill reminder setup
│
└─> Refill tracking initiated:
    ├─> Calculate next refill date:
    │   └─> delivered_at + supply_length_days - 30
    ├─> Set reminder flag
    └─> Auto-suggest refill when appropriate
```

#### Error Handling & Edge Cases

```
Prescription Denied:
├─> Prescriber refuses to write prescription
├─> Admin marks: status = "denied"
├─> Reason captured in notes
├─> User notified with explanation
└─> Suggest alternatives or telemedicine

Payment Failed:
├─> Stripe webhook: payment_intent.failed
├─> Order status = "payment_failed"
├─> Retry logic (3 attempts)
├─> Email user with payment issue
└─> If unresolved: hold order, notify admin

Medication Out of Stock:
├─> HealthWarehouse reports unavailable
├─> Admin updates order: status = "on_hold"
├─> Notify user of delay
├─> Offer alternatives or backorder
└─> Auto-fulfill when restocked

Address Issues:
├─> Carrier returns to sender
├─> Update status = "delivery_failed"
├─> Contact user to verify address
├─> Reship at no extra cost
└─> Log incident for review
```

**API Endpoints**:
- `POST /api/prescription-requests` - Submit request
- `GET /api/prescription-requests/:id` - Check status
- `PATCH /api/admin/prescription-requests/:id` - Admin updates
- `POST /api/admin/orders` - Create order
- `PATCH /api/admin/orders/:id` - Update order status

**Data Flow**:
```
prescription_requests → orders → shipments → deliveries
        ↓                   ↓           ↓
   emails_sent        payments    tracking_updates
   sms_sent          invoices     delivery_confirmations
```

---

## Membership Management

### Subscription Lifecycle

**Actors**: User, Stripe, Backend system  
**Integrations**: Stripe API, Webhook handlers

#### 1. Subscription Creation

```
User selects tier (Gold or Platinum):
├─> Frontend: RegistrationPage.tsx
├─> User enters card details in Stripe Elements
├─> Click "Subscribe & Continue"
│
├─> POST /api/create-subscription
│   ├─> Request body:
│   │   └─> {userId, tier, paymentMethodId}
│   │
│   ├─> Backend creates Stripe customer:
│   │   ├─> Stripe.customers.create({
│   │   │     email: user.email,
│   │   │     name: user.firstName + user.lastName,
│   │   │     metadata: {userId: user.id}
│   │   │   })
│   │   └─> Store customerId in users table
│   │
│   ├─> Attach payment method:
│   │   └─> Stripe.paymentMethods.attach(paymentMethodId, {customer: customerId})
│   │
│   ├─> Create subscription:
│   │   ├─> Determine priceId:
│   │   │   ├─> tier = "gold" → price_gold_monthly
│   │   │   └─> tier = "platinum" → price_platinum_monthly
│   │   │
│   │   ├─> Stripe.subscriptions.create({
│   │   │     customer: customerId,
│   │   │     items: [{price: priceId}],
│   │   │     default_payment_method: paymentMethodId,
│   │   │     metadata: {userId: user.id, tier: tier}
│   │   │   })
│   │   │
│   │   └─> Store subscriptionId in users table
│   │
│   └─> Update user record:
│       ├─> subscription_id = subscriptionId
│       ├─> customer_id = customerId
│       ├─> subscription_status = "active"
│       ├─> subscription_tier = tier
│       └─> subscription_start_date = NOW()
│
└─> Return success to frontend → Complete registration
```

**Stripe Webhook Confirmation** (async):
```
webhook: subscription.created
├─> Verify webhook signature
├─> Extract subscription data
├─> Find user by metadata.userId
├─> Confirm subscription_id matches
├─> Log event in audit table
└─> Send welcome email (Resend)
```

---

#### 2. Subscription Renewal (Monthly)

```
Stripe automatic billing (monthly):
├─> 30 days after subscription_start_date
├─> Stripe attempts to charge payment method
│
├─> SUCCESS: invoice.payment_succeeded webhook
│   ├─> Backend receives webhook
│   ├─> Verify signature
│   ├─> Extract: subscriptionId, amountPaid, periodEnd
│   ├─> Update user record:
│   │   ├─> subscription_status = "active"
│   │   ├─> last_payment_date = NOW()
│   │   └─> next_billing_date = periodEnd
│   │
│   ├─> Log transaction:
│   │   └─> INSERT INTO transactions (userId, type="subscription_renewal", amount, stripeInvoiceId)
│   │
│   └─> Send receipt email (Resend)
│
└─> FAILURE: invoice.payment_failed webhook
    ├─> Backend receives webhook
    ├─> Update user record:
    │   ├─> subscription_status = "past_due"
    │   └─> payment_retry_count += 1
    │
    ├─> Stripe retry logic (3 attempts over 7 days)
    ├─> Send payment failure email
    ├─> Notify user to update card
    │
    └─> If all retries fail:
        ├─> subscription.deleted webhook
        ├─> subscription_status = "canceled"
        ├─> Send cancellation notice
        └─> Restrict access to paid features
```

---

#### 3. Tier Upgrade (Gold → Platinum)

```
User clicks "Upgrade to Platinum":
├─> Frontend: DashboardPage.tsx
├─> Show confirmation modal with pricing difference
├─> User confirms upgrade
│
├─> POST /api/upgrade-subscription
│   ├─> Request: {userId, newTier: "platinum"}
│   ├─> Validate: current tier = "gold"
│   │
│   ├─> Stripe subscription update:
│   │   ├─> Stripe.subscriptions.retrieve(subscriptionId)
│   │   ├─> Stripe.subscriptions.update(subscriptionId, {
│   │   │     items: [{
│   │   │       id: currentItemId,
│   │   │       price: price_platinum_monthly
│   │   │     }],
│   │   │     proration_behavior: "always_invoice",
│   │   │     billing_cycle_anchor: "unchanged"
│   │   │   })
│   │   │
│   │   └─> Stripe generates prorated invoice immediately
│   │
│   ├─> Update user record:
│   │   ├─> subscription_tier = "platinum"
│   │   └─> tier_changed_at = NOW()
│   │
│   └─> Return success → Update UI
│
└─> Stripe webhook: subscription.updated
    ├─> Confirm tier change
    ├─> Log event
    └─> Send confirmation email: "You're now Platinum!"
```

**Proration Example**:
```
User upgrades 15 days into Gold billing cycle:
├─> Gold: $15/month → $0.50/day
├─> Platinum: $25/month → $0.83/day
├─> Days remaining: 15
├─> Credit for unused Gold: 15 × $0.50 = $7.50
├─> Charge for new Platinum: 15 × $0.83 = $12.45
└─> Immediate charge: $12.45 - $7.50 = $4.95
```

---

#### 4. Tier Downgrade (Platinum → Gold)

```
User clicks "Downgrade to Gold":
├─> Frontend: Show warning about feature loss
├─> User confirms downgrade
│
├─> POST /api/downgrade-subscription
│   ├─> Request: {userId, newTier: "gold"}
│   ├─> Validate: current tier = "platinum"
│   │
│   ├─> Stripe subscription schedule:
│   │   ├─> Stripe.subscriptions.update(subscriptionId, {
│   │   │     items: [{
│   │   │       id: currentItemId,
│   │   │       price: price_gold_monthly
│   │   │     }],
│   │   │     proration_behavior: "none",
│   │   │     billing_cycle_anchor: "unchanged"
│   │   │   })
│   │   │
│   │   └─> Change effective at END of current billing period
│   │
│   ├─> Update user record:
│   │   ├─> pending_tier_change = "gold"
│   │   ├─> tier_change_effective_date = next_billing_date
│   │   └─> Keep subscription_tier = "platinum" (until effective date)
│   │
│   └─> Return success with effective date
│
└─> On next_billing_date:
    ├─> Stripe webhook: invoice.payment_succeeded (for Gold amount)
    ├─> Backend updates:
    │   ├─> subscription_tier = "gold"
    │   ├─> pending_tier_change = NULL
    │   └─> tier_changed_at = NOW()
    │
    └─> Send email: "You're now on Gold plan"
```

**No Proration on Downgrade**:
- User keeps Platinum benefits until end of billing cycle
- Next invoice is at Gold rate ($15 instead of $25)
- No refund for partial month

---

#### 5. Subscription Cancellation

```
User clicks "Cancel Subscription":
├─> Frontend: Show refund policy and consequences
├─> Display commitment terms:
│   ├─> If < 12 months: Early termination fee applies
│   │   ├─> Gold: $180 - (months_completed × $15)
│   │   └─> Platinum: $300 - (months_completed × $25)
│   │
│   └─> If ≥ 12 months: Cancel anytime, no fee
│
├─> User confirms cancellation
│
├─> POST /api/cancel-subscription
│   ├─> Request: {userId, cancellationReason}
│   ├─> Calculate if within commitment period
│   │
│   ├─> If early termination fee applies:
│   │   ├─> Calculate fee amount
│   │   ├─> Create Stripe invoice for fee
│   │   ├─> Charge payment method
│   │   └─> Wait for payment confirmation
│   │
│   ├─> Stripe.subscriptions.update(subscriptionId, {
│   │     cancel_at_period_end: true
│   │   })
│   │
│   ├─> Update user record:
│   │   ├─> subscription_status = "canceling"
│   │   ├─> cancellation_requested_at = NOW()
│   │   ├─> cancellation_effective_date = next_billing_date
│   │   └─> cancellation_reason = reason
│   │
│   └─> Return success with effective date
│
└─> On cancellation_effective_date:
    ├─> Stripe webhook: subscription.deleted
    ├─> Update user:
    │   ├─> subscription_status = "canceled"
    │   ├─> subscription_tier = "free"
    │   ├─> subscription_id = NULL
    │   └─> downgraded_to_free_at = NOW()
    │
    ├─> Restrict features to Free tier
    ├─> Send cancellation confirmation email
    └─> Optionally: Schedule win-back campaign
```

**Post-Cancellation**:
- User automatically moves to Free tier
- Retains access to existing prescriptions
- New prescriptions limited to 90-day max
- $30 per-order fee applies going forward

---

#### 6. Account Reactivation

```
Canceled user wants to reactivate:
├─> Frontend: "Upgrade" button visible in dashboard
├─> User selects tier (Gold or Platinum)
├─> Enter payment details (if card expired)
│
├─> POST /api/reactivate-subscription
│   ├─> Similar flow to initial subscription creation
│   ├─> Use existing customer_id if available
│   ├─> Create new subscription
│   ├─> Reset commitment start date
│   └─> Restore paid tier access
│
└─> Welcome back email + special offer (optional)
```

---

#### 7. Payment Method Updates

```
User needs to update card:
├─> Navigate to /account/billing
├─> Click "Update Payment Method"
├─> Enter new card in Stripe Elements
│
├─> POST /api/update-payment-method
│   ├─> Request: {userId, newPaymentMethodId}
│   │
│   ├─> Attach new payment method:
│   │   └─> Stripe.paymentMethods.attach(newPaymentMethodId, {customer: customerId})
│   │
│   ├─> Set as default:
│   │   └─> Stripe.customers.update(customerId, {
│   │         invoice_settings: {default_payment_method: newPaymentMethodId}
│   │       })
│   │
│   ├─> Detach old method (optional):
│   │   └─> Stripe.paymentMethods.detach(oldPaymentMethodId)
│   │
│   └─> Return success
│
└─> Confirmation: "Payment method updated"
```

---

### Membership State Machine

```
States:
├─> pending: Initial registration, not yet completed
├─> active: Subscription active, in good standing
├─> past_due: Payment failed, in retry period
├─> canceling: Cancellation requested, effective at period end
├─> canceled: Subscription ended
└─> suspended: Admin action (non-payment, violation)

Transitions:
pending → active: Payment successful
active → past_due: Invoice payment failed
past_due → active: Retry payment successful
past_due → canceled: All retries failed
active → canceling: User requests cancellation
canceling → canceled: Cancellation effective date reached
canceling → active: User reverses cancellation
canceled → active: User reactivates
active → suspended: Admin action
suspended → active: Admin restores
```

---

## Content Generation Workflows

### 1. General AI Blog Generation (TypeScript/GPT-4)

**Actors**: Admin user, OpenAI API  
**Use Case**: General healthcare content, pharmacy news, savings tips

#### Flow:

```
Step 1: Admin initiates generation
├─> Navigate to /admin/blog
├─> Click "Generate New Post" (data-testid="button-view-generate")
├─> View switches to generation form
│
└─> Select "General AI (Healthcare Content)"

Step 2: Configure generation parameters
├─> Form inputs:
│   ├─> Topic (text): "Cost Savings on Diabetes Medications"
│   ├─> Category (select):
│   │   ├─> healthcare-savings
│   │   ├─> pharmacy-news
│   │   ├─> medication-guides
│   │   ├─> wellness
│   │   └─> industry-insights
│   │
│   ├─> Tone (select):
│   │   ├─> professional
│   │   ├─> conversational
│   │   ├─> educational
│   │   └─> empathetic
│   │
│   ├─> Target Length (select):
│   │   ├─> short (400-600 words)
│   │   ├─> medium (800-1200 words)
│   │   └─> long (1500-2000 words)
│   │
│   ├─> Keywords (comma-separated): "diabetes, insulin, cost savings"
│   └─> Additional instructions (textarea, optional)
│
└─> Click "Generate Content" (data-testid="button-generate")

Step 3: Backend processing
├─> POST /api/blog/generate
│   ├─> Validate admin role
│   ├─> Validate inputs with Zod
│   │
│   ├─> Build OpenAI prompt:
│   │   ├─> System context: "You are a healthcare content writer..."
│   │   ├─> Incorporate topic, tone, length
│   │   ├─> SEO requirements
│   │   └─> Brand voice guidelines
│   │
│   ├─> OpenAI API call:
│   │   ├─> Model: gpt-4-turbo
│   │   ├─> Temperature: 0.7
│   │   ├─> Max tokens: calculated from target length
│   │   └─> Response format: JSON
│   │
│   ├─> Parse response:
│   │   ├─> title (string)
│   │   ├─> excerpt (string, 150-200 chars)
│   │   ├─> content (string, markdown)
│   │   ├─> seoTitle (string, max 60 chars)
│   │   ├─> seoDescription (string, max 160 chars)
│   │   ├─> seoKeywords (array)
│   │   └─> suggestedTags (array)
│   │
│   └─> Return generated content to frontend
│
└─> Frontend: Display "Content Generated!" toast

Step 4: Review & Edit
├─> Frontend switches to edit view
├─> Show "Review & Edit" button (data-testid="button-review-edit")
├─> Click to open edit form
│
├─> Editable fields pre-populated:
│   ├─> Title (input)
│   ├─> Excerpt (textarea)
│   ├─> Content (rich textarea, markdown)
│   ├─> Category (select)
│   ├─> Tags (multi-select)
│   ├─> SEO Title (input)
│   ├─> SEO Description (textarea)
│   ├─> SEO Keywords (comma-separated)
│   │
│   └─> Featured Image (Optional):
│       ├─> Upload zone (drag-and-drop)
│       ├─> File input (data-testid="input-image-upload")
│       ├─> Auto-resize to 1200x630px
│       ├─> Smart compression to <200KB
│       ├─> Live preview
│       └─> Remove button
│
├─> Admin makes edits as needed
└─> Click "Publish" (data-testid="button-publish")

Step 5: Publication
├─> POST /api/blog/posts
│   ├─> Validate all fields
│   ├─> Generate URL slug from title
│   ├─> Create blog_posts record:
│   │   ├─> id (auto-generated)
│   │   ├─> title, slug, content, excerpt
│   │   ├─> category, tags (array)
│   │   ├─> seoTitle, seoDescription, seoKeywords
│   │   ├─> featuredImage (base64, nullable)
│   │   ├─> author_id (admin user id)
│   │   ├─> status = "published"
│   │   ├─> published_at = NOW()
│   │   └─> created_at = NOW()
│   │
│   └─> Return: {id, slug}
│
├─> Frontend: Success toast "Post published!"
├─> Redirect to /blog or post detail page
└─> Post now visible on public blog
```

**Error Handling**:
```
OpenAI API quota exceeded:
├─> Catch error in backend
├─> Return 429 status
├─> Frontend shows error toast:
│   └─> "AI generation unavailable. Please try again later."
└─> Admin can manually write content instead

Content moderation flags:
├─> OpenAI flags inappropriate content
├─> Backend reviews moderation scores
├─> If flagged: Reject generation
└─> Admin notification with reason
```

---

### 2. Medical RAG Blog Generation (Python FastAPI)

**Actors**: Admin user, Python RAG service, OpenAI embeddings, FAISS vector store  
**Use Case**: FDA-compliant medical content about specific medications

#### Architecture Overview:
```
Node.js Backend (port 5000) ←→ Python FastAPI Service (port 8001)
         ↓                              ↓
    PostgreSQL                    FAISS Vector Store
  (blog_posts,                   (document_chunks,
   medical_blog_posts)            FDA source documents)
```

#### Flow:

##### Phase 1: Job Creation
```
Step 1: Admin initiates medical content generation
├─> Navigate to /admin/blog
├─> Click "Generate New Post"
├─> Select "Medical RAG (FDA-Compliant Content)"
│
├─> Form inputs:
│   ├─> Medication Name: "Metformin"
│   ├─> Indication (optional): "Type 2 Diabetes"
│   ├─> Target Audience:
│   │   ├─> patients
│   │   ├─> healthcare-providers
│   │   └─> general-public
│   │
│   └─> Content Focus (checkboxes):
│       ├─> Safety Information
│       ├─> Usage Instructions
│       ├─> Side Effects
│       ├─> Drug Interactions
│       └─> Clinical Studies
│
└─> Click "Generate Medical Content"

Step 2: Backend creates generation job
├─> POST /api/blog/generate-medical
│   ├─> Validate admin role
│   ├─> Validate medication name
│   │
│   ├─> Create job record:
│   │   └─> INSERT INTO medical_generation_jobs (
│   │         medication_name,
│   │         parameters,
│   │         status = "pending",
│   │         created_by_admin_id
│   │       )
│   │
│   ├─> Forward to Python service:
│   │   └─> POST http://localhost:8001/api/rag/generate
│   │       ├─> Headers: {"Authorization": "Bearer [token]"}
│   │       ├─> Body: {medication, indication, audience, focus}
│   │       └─> Async: Don't wait for response
│   │
│   └─> Return job_id to frontend
│
└─> Frontend: Start polling for job status
```

##### Phase 2: Python RAG Processing
```
Step 3: Python service processes request
├─> Receive generation request
├─> Create async background task
├─> Update job status = "processing"
│
├─> Vector Store Retrieval:
│   ├─> Generate query embedding:
│   │   └─> OpenAI: text-embedding-3-small
│   │       Input: medication name + indication
│   │
│   ├─> FAISS similarity search:
│   │   ├─> k = 20 (retrieve top 20 chunks)
│   │   ├─> Filter by source whitelist:
│   │   │   ├─> FDA.gov (SPL documents)
│   │   │   ├─> CDC.gov
│   │   │   ├─> NIH.gov
│   │   │   └─> DailyMed.nlm.nih.gov
│   │   │
│   │   └─> Filter by required sections:
│   │       ├─> BOXED_WARNING (if exists)
│   │       ├─> CONTRAINDICATIONS
│   │       ├─> WARNINGS_AND_PRECAUTIONS
│   │       ├─> ADVERSE_REACTIONS
│   │       └─> DRUG_INTERACTIONS
│   │
│   └─> Retrieve document chunks with metadata
│
├─> Content Generation:
│   ├─> Build RAG prompt:
│   │   ├─> System: "You are an FDA-compliant medical writer..."
│   │   ├─> Context: Retrieved chunks (numbered [1][2][3]...)
│   │   ├─> Instructions:
│   │   │   ├─> Use only provided sources
│   │   │   ├─> Include numbered citations
│   │   │   ├─> Balance benefits and risks
│   │   │   ├─> Include all safety warnings
│   │   │   └─> US-approved uses only
│   │   │
│   │   └─> Query: Generate article about [medication]
│   │
│   ├─> OpenAI API call:
│   │   ├─> Model: gpt-4-turbo
│   │   ├─> Temperature: 0.3 (more deterministic)
│   │   └─> Max tokens: 3000
│   │
│   └─> Parse response:
│       ├─> title
│       ├─> content (with [1][2][3] citations)
│       ├─> excerpt
│       └─> safety_summary
│
└─> Compliance Validation:
    ├─> Check citation count (min 3-5 required)
    ├─> Verify US-only approval status
    ├─> Detect off-label usage mentions
    ├─> Validate required sections present:
    │   ├─> Warnings
    │   ├─> Side effects
    │   └─> Contraindications
    │
    ├─> Generate compliance report:
    │   ├─> citation_count
    │   ├─> us_approved: true/false
    │   ├─> off_label_detected: true/false
    │   ├─> required_sections_present: true/false
    │   └─> safety_warnings_included: true/false
    │
    └─> Update job status = "completed"
```

##### Phase 3: Admin Review & Approval
```
Step 4: Frontend polling detects completion
├─> GET /api/blog/medical-jobs/:jobId (every 2 seconds)
├─> Status changes from "processing" to "completed"
├─> Frontend fetches full results
│
└─> Display Compliance Review UI:
    ├─> Generated Content Preview (read-only)
    ├─> Compliance Policy Report:
    │   ├─> ✅ Citations: 7 sources referenced
    │   ├─> ✅ US-Approved: Verified
    │   ├─> ✅ Required Sections: All present
    │   ├─> ⚠️  Off-Label: Potential mention detected
    │   └─> ✅ Safety Warnings: Included
    │
    └─> Admin Checklist (required checkboxes):
        ├─> ☐ I have reviewed all cited sources
        ├─> ☐ Medical information is accurate
        ├─> ☐ No promotional language present
        ├─> ☐ Fair balance (benefits + risks) maintained
        ├─> ☐ Disclaimer included
        └─> ☐ Ready for publication

Step 5: Admin approval decision
├─> Option 1: Approve
│   ├─> All checkboxes must be checked
│   ├─> Click "Approve & Edit"
│   ├─> POST /api/blog/medical-jobs/:jobId/approve
│   ├─> Transfer to edit view (same as General AI)
│   └─> Admin can make final edits before publish
│
├─> Option 2: Reject
│   ├─> Click "Reject"
│   ├─> Enter rejection reason
│   ├─> POST /api/blog/medical-jobs/:jobId/reject
│   ├─> Update job status = "rejected"
│   └─> Option to regenerate with different parameters
│
└─> Option 3: Request Revision
    ├─> Click "Request Changes"
    ├─> Specify what needs revision
    ├─> Trigger new generation with feedback
    └─> New job created with parent_job_id reference
```

##### Phase 4: Publication
```
Step 6: Publish approved medical content
├─> Admin completes edits (if any)
├─> Adds featured image (optional)
├─> Click "Publish"
│
├─> POST /api/blog/medical-posts
│   ├─> Create medical_blog_posts record:
│   │   ├─> All standard blog fields
│   │   ├─> Plus medical-specific:
│   │   │   ├─> medication_name
│   │   │   ├─> indication
│   │   │   ├─> citations (JSON array of sources)
│   │   │   ├─> compliance_report (JSON)
│   │   │   ├─> approved_by_admin_id
│   │   │   ├─> approved_at
│   │   │   └─> disclaimer_text
│   │   │
│   │   └─> status = "published"
│   │
│   ├─> Store citation references in separate table
│   └─> Return post slug
│
└─> Post published to /blog with special medical post badge
```

**Public Display**:
```
User views medical blog post at /blog/:slug:
├─> Display post content with inline citations [1][2][3]
├─> Footer: Citations section
│   ├─> [1] FDA - Metformin Label (https://...)
│   ├─> [2] DailyMed - Metformin (https://...)
│   └─> [3] CDC - Diabetes Management (https://...)
│
├─> Disclaimer box (prominent):
│   └─> "This content is for informational purposes only 
│        and is not a substitute for professional medical advice.
│        Always consult your healthcare provider."
│
├─> Schema.org markup:
│   └─> <script type="application/ld+json">
│       {
│         "@type": "MedicalWebPage",
│         "about": "Metformin",
│         "medicalAudience": "Patient",
│         "lastReviewed": "2025-11-03"
│       }
│
└─> Special badge: "FDA-Compliant Medical Content"
```

---

### Content Workflow Comparison

| Feature | General AI | Medical RAG |
|---------|-----------|-------------|
| **Generation Speed** | ~10-30 seconds | ~60-120 seconds |
| **Review Required** | Optional (quick publish) | Mandatory (compliance checklist) |
| **Sources** | GPT-4 knowledge | FDA/CDC documents only |
| **Citations** | None | Numbered citations required |
| **Use Cases** | News, tips, guides | Medication information |
| **Approval Flow** | 1-step (edit → publish) | 3-step (review → approve → edit → publish) |

---

## Administrative Operations

### 1. User Management

**Location**: `/admin/users`  
**Access**: Admin role required

#### User Directory & Search
```
Admin views user directory:
├─> GET /api/admin/users?page=1&limit=50
│   ├─> Returns paginated user list
│   ├─> Default sort: created_at DESC
│   └─> Includes: id, name, email, tier, status, created_at
│
├─> Search functionality:
│   ├─> Filter by name (fuzzy search)
│   ├─> Filter by email
│   ├─> Filter by tier (free/gold/platinum)
│   ├─> Filter by status (active/canceled/suspended)
│   └─> Filter by date range
│
└─> Display in table:
    ├─> User avatar
    ├─> Name + email
    ├─> Membership tier badge
    ├─> Status indicator
    ├─> Join date
    └─> Actions dropdown
```

#### User Profile View
```
Admin clicks on user:
├─> Navigate to /admin/users/:userId
├─> GET /api/admin/users/:userId/profile
│
├─> Display comprehensive profile:
│   ├─> Personal Information:
│   │   ├─> Name, email, phone
│   │   ├─> Date of birth
│   │   └─> Mailing address
│   │
│   ├─> Subscription Details:
│   │   ├─> Current tier
│   │   ├─> Subscription status
│   │   ├─> Start date, next billing date
│   │   ├─> Payment method (last 4 digits)
│   │   └─> Lifetime value (total paid)
│   │
│   ├─> Prescription History:
│   │   ├─> List of all prescription requests
│   │   ├─> Status of each
│   │   └─> Date submitted
│   │
│   ├─> Order History:
│   │   ├─> All orders placed
│   │   ├─> Amounts, dates
│   │   └─> Fulfillment status
│   │
│   └─> Activity Log:
│       ├─> Recent logins
│       ├─> Support tickets
│       └─> System interactions
│
└─> Action buttons for account management
```

#### Account Actions

##### Deactivate Account
```
Purpose: Temporarily disable account (user can reactivate)

Admin clicks "Deactivate":
├─> Show confirmation dialog:
│   ├─> Reason input (required)
│   ├─> Additional notes (optional)
│   └─> Confirm button
│
├─> POST /api/admin/users/:userId/deactivate
│   ├─> Request body: {reason: string}
│   ├─> Validate admin role
│   ├─> Check: cannot deactivate own account
│   ├─> Update users record:
│   │   ├─> isActive = "false"
│   │   ├─> deletionReason = reason
│   │   └─> updatedAt = NOW()
│   │
│   ├─> Backend logs action internally
│   │   (Note: audit_logs table not yet implemented)
│   │
│   ├─> Optional: Notify user via email
│   └─> Return success
│
└─> UI updates:
    ├─> User status badge changes to "Deactivated"
    ├─> Success toast: "Account deactivated"
    └─> Account cannot login until reactivated

Effects:
├─> User cannot login
├─> Active subscriptions remain (but no benefits)
├─> No new prescriptions can be submitted
└─> User can contact support to reactivate
```

##### Reactivate Account
```
Purpose: Restore previously deactivated account

Admin clicks "Reactivate":
├─> Show confirmation dialog
├─> POST /api/admin/users/:userId/reactivate
│   ├─> Update user record:
│   │   ├─> status = "active"
│   │   ├─> reactivated_at = NOW()
│   │   └─> reactivated_by_admin_id = current_admin.id
│   │
│   ├─> Log action in audit_logs
│   ├─> Send reactivation email
│   └─> Return success
│
└─> User can now login and use platform normally
```

##### Soft Delete Account
```
Purpose: Mark for deletion with 30-day recovery window

Admin clicks "Delete Account":
├─> Show warning dialog:
│   ├─> "This will mark the account for permanent deletion in 30 days"
│   ├─> Reason input (required)
│   └─> Confirmation required
│
├─> POST /api/admin/users/:userId/delete
│   ├─> Request body: {reason: string}
│   ├─> Validate admin role
│   ├─> Check: cannot delete own account
│   ├─> Update users record:
│   │   ├─> deletedAt = NOW()
│   │   ├─> deletionReason = reason
│   │   ├─> isActive = "false"
│   │   └─> updatedAt = NOW()
│   │
│   ├─> If has active subscription:
│   │   ├─> Cancel via Stripe
│   │   └─> Update subscription fields
│   │
│   └─> Return success
│
Note: Permanent deletion job (after 30 days) not yet implemented
│
└─> Effects:
    ├─> User cannot login
    ├─> Account hidden from normal user lists
    ├─> Data retained for 30 days (compliance)
    ├─> After 30 days: Permanent deletion job runs
    └─> Can be recovered within 30-day window

Recovery window:
├─> Admin can view deleted accounts (filter)
├─> "Recover" button available if < 30 days
└─> After 30 days: Permanent deletion (irreversible)
```

##### Recover Deleted Account
```
Purpose: Restore account within 30-day window

Admin filters for deleted accounts:
├─> Shows accounts with status = "deleted"
├─> Display days remaining until permanent deletion
│
├─> Admin clicks "Recover":
│   ├─> POST /api/admin/users/:userId/recover
│   ├─> Validate: deleted_at + 30 days > NOW()
│   ├─> Update user record:
│   │   ├─> status = "active"
│   │   ├─> deleted_at = NULL
│   │   ├─> permanent_deletion_date = NULL
│   │   ├─> recovered_at = NOW()
│   │   └─> recovered_by_admin_id = current_admin.id
│   │
│   ├─> Restore subscription (if canceled within recovery period)
│   ├─> Log recovery action
│   ├─> Notify user: "Your account has been restored"
│   └─> Return success
│
└─> User can login and resume normal usage
```

##### Suspend Account (Legacy)
```
Similar to deactivate, but typically for compliance/legal reasons:
├─> More severe than deactivation
├─> Requires manager approval
├─> Longer notes/documentation required
└─> Same technical implementation as deactivate
```

#### Self-Protection Rules
```
All user management actions include:
├─> Check: target_user_id ≠ current_admin_id
│   └─> If equal: Return 403 "Cannot modify your own account"
│
├─> Check: target_user.role = "admin"
│   └─> If modifying another admin: Require super_admin role
│
└─> All actions logged with:
    ├─> Who (admin_id)
    ├─> What (action type)
    ├─> When (timestamp)
    ├─> Why (reason)
    └─> Target (user_id)
```

---

### 2. Financial Dashboard

**Location**: `/admin/financial`  
**Access**: Admin role required

```
Dashboard displays:
├─> Key Metrics (Top Cards):
│   ├─> Monthly Recurring Revenue (MRR)
│   │   └─> Sum of active subscriptions
│   │
│   ├─> Total Revenue (Current Month)
│   │   └─> MRR + one-time payments
│   │
│   ├─> Active Subscriptions Count
│   │   ├─> Gold: X
│   │   └─> Platinum: Y
│   │
│   └─> Churn Rate
│       └─> Cancellations ÷ Total subscribers
│
├─> Revenue Chart (Recharts):
│   ├─> Line chart: MRR over time (last 12 months)
│   ├─> Bar chart: Revenue by tier
│   └─> Interactive date range selector
│
├─> Subscription Breakdown:
│   ├─> Tier Distribution (Pie chart):
│   │   ├─> Free: X%
│   │   ├─> Gold: Y%
│   │   └─> Platinum: Z%
│   │
│   └─> Status Distribution:
│       ├─> Active: X
│       ├─> Canceled: Y
│       ├─> Past Due: Z
│       └─> Suspended: W
│
├─> Transaction History Table:
│   ├─> Recent transactions (paginated)
│   ├─> Columns: Date, User, Type, Amount, Status
│   ├─> Filters: Date range, type, status
│   └─> Export to CSV button
│
└─> Refund Management:
    ├─> Pending refund requests
    ├─> Admin can approve/deny
    ├─> Process refund via Stripe
    └─> Log refund in transactions table

API Endpoints:
├─> GET /api/admin/financial/metrics
├─> GET /api/admin/financial/revenue-chart
├─> GET /api/admin/financial/transactions
└─> POST /api/admin/financial/refund
```

---

### 3. Medication Pricing Management

**Location**: `/admin/medications/pricing`  
**Access**: Admin role required

#### Bulk Upload Workflow
```
Admin uploads new pricing CSV:
├─> Click "Upload Pricing File"
├─> Select CSV file (max 50MB)
├─> Frontend validates:
│   ├─> File type: .csv only
│   ├─> Size check
│   └─> Preview first 10 rows
│
├─> POST /api/admin/medications/upload
│   ├─> Multer handles file upload
│   ├─> Parse CSV:
│   │   ├─> Expected columns:
│   │   │   ├─> medication_name
│   │   │   ├─> dosage
│   │   │   ├─> price_90day
│   │   │   ├─> price_180day
│   │   │   ├─> price_360day
│   │   │   └─> category (optional)
│   │   │
│   │   └─> Validation per row:
│   │       ├─> Required fields present
│   │       ├─> Prices are valid numbers
│   │       └─> Medication name not empty
│   │
│   ├─> Process results:
│   │   ├─> Valid rows: Insert/update in medications table
│   │   ├─> Invalid rows: Collect errors
│   │   └─> Generate report:
│   │       ├─> Total rows: 1000
│   │       ├─> Successful: 985
│   │       ├─> Failed: 15
│   │       └─> Error details (downloadable)
│   │
│   └─> Return report to frontend
│
└─> Display results:
    ├─> Success toast if > 95% success rate
    ├─> Warning if 80-95% success rate
    ├─> Error if < 80% success rate
    └─> Download error report for failed rows
```

#### Individual Price Edits
```
Admin edits single medication:
├─> Search for medication
├─> Click "Edit" on result
├─> Update form:
│   ├─> Medication name (readonly)
│   ├─> Dosage
│   ├─> 90-day price
│   ├─> 6-month price
│   └─> 1-year price
│
├─> PATCH /api/admin/medications/:id
├─> Update record
├─> Log price change in audit_logs
└─> Success notification
```

---

### 4. Communications Center

**Location**: `/admin/communications`  
**Access**: Admin role required

#### Broadcast Email
```
Admin sends mass email:
├─> Select recipients:
│   ├─> All users
│   ├─> By tier (Free/Gold/Platinum)
│   ├─> By status (Active/Canceled)
│   └─> Custom segment (upload CSV)
│
├─> Compose email:
│   ├─> Template selector (or blank)
│   ├─> Subject line
│   ├─> Body (rich text editor)
│   ├─> Personalization tags: {{firstName}}, {{tier}}
│   └─> Preview mode
│
├─> Schedule or send immediately
│
├─> POST /api/admin/broadcast-email
│   ├─> Validate recipients
│   ├─> Process in batches (100 at a time)
│   ├─> For each user:
│   │   ├─> Personalize content
│   │   ├─> Resend.emails.send()
│   │   ├─> Log in emails_sent table
│   │   └─> Track delivery status
│   │
│   └─> Return summary:
│       ├─> Queued: X
│       ├─> Sent: Y
│       ├─> Failed: Z
│       └─> Failed emails list
│
└─> Monitor delivery in real-time dashboard
```

#### Broadcast SMS (Similar flow via Twilio)

---

## Technical Integration Workflows

### 1. Stripe Payment Processing

#### Subscription Payment Flow
```
1. Frontend Checkout:
   ├─> User in registration or upgrade flow
   ├─> Stripe Elements loads
   ├─> User enters card details
   ├─> Frontend: createPaymentMethod()
   ├─> Receive paymentMethodId
   └─> POST to backend with paymentMethodId

2. Backend Subscription Creation:
   ├─> Create Stripe customer
   ├─> Attach payment method
   ├─> Create subscription
   ├─> Store IDs in database
   └─> Return success (subscription active immediately)

3. Webhook Confirmation (async):
   ├─> POST /api/webhooks/stripe
   ├─> Event: subscription.created
   ├─> Verify signature:
   │   └─> Stripe.webhooks.constructEvent(body, signature, secret)
   │
   ├─> Find user by metadata.userId or customer_id
   ├─> Confirm subscription_id matches
   ├─> Log event
   └─> Send welcome email

4. Monthly Renewal:
   ├─> Stripe auto-charges (30 days after start)
   ├─> Webhook: invoice.payment_succeeded
   ├─> Update user: last_payment_date, next_billing_date
   ├─> Log transaction
   └─> Send receipt email

5. Payment Failure:
   ├─> Webhook: invoice.payment_failed
   ├─> Update status: past_due
   ├─> Increment retry_count
   ├─> Send payment failure email
   ├─> Stripe retries 3 times over 7 days
   └─> If all fail: subscription.deleted webhook

6. Webhook Security:
   ├─> Verify Stripe signature on every webhook
   ├─> Idempotency: Check if event already processed
   ├─> Error handling: Return 200 even if processing fails
   └─> Async processing: Queue jobs, don't block webhook
```

**Webhook Events Handled**:
- `customer.created`
- `customer.updated`
- `customer.deleted`
- `payment_method.attached`
- `subscription.created`
- `subscription.updated`
- `subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `invoice.finalized`
- `charge.succeeded`
- `charge.failed`
- `charge.refunded`

---

### 2. PDF Generation & Distribution

**Technology**: PDFKit (Node.js)  
**Use Cases**: Prescription forms, refund policies, invoices

#### Prescription PDF Workflow
```
1. Generate PDF:
   ├─> Import PDFKit
   ├─> Create new PDFDocument
   ├─> Add Pillar Drug Club branding:
   │   ├─> Logo (base64 embedded)
   │   ├─> Company header
   │   └─> Footer with contact info
   │
   ├─> Add content sections:
   │   ├─> Patient Information
   │   ├─> Prescriber Information
   │   ├─> Medication Details
   │   ├─> Pharmacy Information (HealthWarehouse)
   │   └─> Instructions
   │
   ├─> Finalize document
   └─> Output to buffer (not file system)

2. Distribute via Email:
   ├─> Resend.emails.send({
   │     from: "prescriptions@pillardrugclub.com",
   │     to: prescriber.email,
   │     cc: user.email,
   │     subject: "Prescription Request for [Patient]",
   │     html: emailTemplate,
   │     attachments: [{
   │       filename: "prescription-request.pdf",
   │       content: pdfBuffer
   │     }]
   │   })
   │
   ├─> Log email sent
   └─> Track delivery status

3. Distribute via SMS:
   ├─> Upload PDF to temporary storage (or CDN)
   ├─> Generate short URL
   ├─> Twilio.messages.create({
   │     to: user.phone,
   │     from: twilioNumber,
   │     body: "Your prescription request: [short_url]"
   │   })
   │
   └─> Log SMS sent

4. Cleanup (if using temp storage):
   └─> Delete PDF after 7 days or successful delivery
```

---

### 3. Email & SMS Notifications

#### Email Service (Resend)
```
Configuration:
├─> API Key: process.env.RESEND_API_KEY
├─> From domain: pillardrugclub.com
├─> Templates stored in: server/email-templates/

Send Email:
├─> Import Resend client
├─> Select template (or compose)
├─> Personalize with user data
├─> Call Resend.emails.send()
├─> Log in emails_sent table:
│   ├─> recipient_email
│   ├─> template_id
│   ├─> sent_at
│   ├─> resend_message_id
│   └─> status (pending/sent/failed)
│
└─> Track delivery via Resend webhooks

Email Types:
├─> Transactional:
│   ├─> Welcome emails
│   ├─> Password resets
│   ├─> Subscription confirmations
│   ├─> Order confirmations
│   └─> Prescription status updates
│
└─> Marketing:
    ├─> Newsletter
    ├─> Feature announcements
    └─> Special offers (with unsubscribe)
```

#### SMS Service (Twilio)
```
Configuration:
├─> Account SID: process.env.TWILIO_ACCOUNT_SID
├─> Auth Token: process.env.TWILIO_AUTH_TOKEN
├─> From number: process.env.TWILIO_PHONE_NUMBER

Send SMS:
├─> Import Twilio client
├─> Validate phone number format
├─> Check user SMS opt-in status
├─> Call client.messages.create()
├─> Log in sms_sent table:
│   ├─> recipient_phone
│   ├─> message_body
│   ├─> sent_at
│   ├─> twilio_message_sid
│   └─> status
│
└─> Track delivery via Twilio status callbacks

SMS Types:
├─> Prescription notifications
├─> Order tracking updates
├─> Payment reminders
├─> Verification codes
└─> Important alerts only (not marketing)

Rate Limiting:
├─> Max 10 SMS per user per day
├─> Deduplication: Don't send same message twice
└─> Respect opt-out requests
```

---

### 4. HIPAA Compliance & Security

#### Data Protection
```
Encryption at Rest:
├─> Database: PostgreSQL with encryption enabled
├─> Sensitive fields additionally encrypted:
│   ├─> SSN (if collected)
│   ├─> Medical history
│   └─> Payment information (tokenized via Stripe)

Encryption in Transit:
├─> HTTPS/TLS for all connections
├─> Stripe: PCI-compliant payment handling
└─> API requests: JWT or session-based auth

Access Control:
├─> Role-based permissions (RBAC)
├─> Admin actions require authentication
├─> Audit logging for all sensitive operations
└─> Session management:
    ├─> Secure cookies
    ├─> HTTP-only flags
    └─> 30-minute timeout for inactivity
```

#### Audit Logging
```
All sensitive actions logged:
├─> User data access
├─> Prescription submissions
├─> Admin modifications
├─> Payment transactions
└─> Data exports

Log Structure:
├─> audit_logs table:
│   ├─> id
│   ├─> action_type
│   ├─> performed_by_user_id
│   ├─> target_user_id (if applicable)
│   ├─> resource_type
│   ├─> resource_id
│   ├─> ip_address
│   ├─> user_agent
│   ├─> reason (for admin actions)
│   └─> timestamp

Retention:
└─> Logs kept for 7 years (HIPAA requirement)
```

---

## Data Flow & Integration Map

### High-Level Architecture
```
                                    ┌─────────────────┐
                                    │   Frontend      │
                                    │  React/Vite     │
                                    │  (Port 5000)    │
                                    └────────┬────────┘
                                             │
                      ┌──────────────────────┴──────────────────────┐
                      │                                              │
              ┌───────▼─────────┐                         ┌─────────▼────────┐
              │  Node.js/Express│                         │  Python FastAPI  │
              │   Backend API   │                         │   RAG Service    │
              │   (Port 5000)   │◄────────────────────────┤  (Port 8001)     │
              └───────┬─────────┘                         └─────────┬────────┘
                      │                                              │
        ┌─────────────┼─────────────┬───────────────┐               │
        │             │             │               │               │
  ┌─────▼─────┐ ┌────▼────┐  ┌────▼─────┐   ┌────▼────┐     ┌────▼─────┐
  │PostgreSQL │ │ Stripe  │  │  Resend  │   │ Twilio  │     │  FAISS   │
  │ Database  │ │   API   │  │(Email)   │   │  (SMS)  │     │  Vector  │
  │           │ │         │  │          │   │         │     │  Store   │
  └───────────┘ └─────────┘  └──────────┘   └─────────┘     └──────────┘
                      │
              ┌───────▼───────┐
              │ HealthWarehouse│
              │   API (Future) │
              └────────────────┘
```

### Integration Points

#### 1. Frontend ↔ Backend
```
Protocol: HTTP/HTTPS
Authentication: Session-based (Passport.js)
Data Format: JSON

Request Flow:
├─> Frontend makes API call
├─> Express middleware checks session
├─> Route handler processes request
├─> Response sent back to frontend
└─> TanStack Query caches response

Common Endpoints:
├─> Auth: /api/auth/login, /api/auth/register, /api/auth/logout
├─> Users: /api/users/:userId
├─> Prescriptions: /api/prescriptions, /api/refill-requests
├─> Blog: /api/blog/posts
└─> Admin: /api/admin/*
```

#### 2. Backend ↔ PostgreSQL
```
ORM: Drizzle ORM
Connection: Neon serverless PostgreSQL
Pool: Connection pooling enabled

Query Flow:
├─> Backend uses Drizzle query builder
├─> ORM translates to SQL
├─> Execute against database
├─> Results mapped to TypeScript types
└─> Return to backend logic

Migrations:
└─> npm run db:push (direct schema sync)
```

#### 3. Backend ↔ Stripe
```
Library: stripe (Node.js SDK)
Authentication: API secret key

Integration Points:
├─> Customer creation
├─> Subscription management
├─> Payment processing
├─> Webhook handling (POST /api/webhooks/stripe)
└─> Refund processing

Security:
├─> Secret key stored in env vars
├─> Webhook signature verification
└─> Never expose secret to frontend
```

#### 4. Backend ↔ Resend
```
Library: resend (Node.js SDK)
Authentication: API key

Email Flow:
├─> Backend constructs email
├─> Resend.emails.send()
├─> Resend delivers email
├─> Status webhook (optional)
└─> Log delivery in database

Templates:
└─> HTML templates in server/email-templates/
```

#### 5. Backend ↔ Twilio
```
Library: twilio (Node.js SDK)
Authentication: Account SID + Auth Token

SMS Flow:
├─> Backend validates phone number
├─> client.messages.create()
├─> Twilio sends SMS
├─> Status callback (webhook)
└─> Log in database

Rate Limiting:
└─> Max 10 SMS/user/day
```

#### 6. Backend ↔ Python RAG Service
```
Protocol: HTTP (internal network)
URL: http://localhost:8001
Authentication: Bearer token

Medical Content Generation:
├─> Node backend receives request
├─> POST to Python service: /api/rag/generate
├─> Python processes asynchronously
├─> Node polls for status
├─> Results returned when complete
└─> Admin reviews in Node frontend

Data Exchange:
└─> JSON payloads for requests/responses
```

#### 7. Python RAG ↔ FAISS Vector Store
```
Library: faiss-cpu (Python)
Storage: In-memory vector index

Retrieval Flow:
├─> Query embedding generated (OpenAI)
├─> FAISS similarity search (k=20)
├─> Filter by metadata
├─> Return ranked chunks
└─> Use in RAG prompt

Indexing:
├─> FDA documents chunked (400-900 tokens)
├─> Embeddings generated
├─> Stored in FAISS index
└─> Persisted to disk for reloading
```

---

## Compliance & Security

### HIPAA Compliance Checklist

#### Protected Health Information (PHI)
```
PHI Collected:
├─> Patient name, date of birth
├─> Mailing address, phone, email
├─> Medical conditions, prescriptions
├─> Primary care physician information
└─> Drug allergies

Safeguards:
├─> Encryption at rest (database)
├─> Encryption in transit (HTTPS/TLS)
├─> Access controls (RBAC)
├─> Audit logging (7-year retention)
└─> Business Associate Agreements (BAAs):
    ├─> Neon (database hosting)
    ├─> Stripe (payment processing)
    ├─> Resend (email delivery)
    ├─> Twilio (SMS delivery)
    └─> HealthWarehouse (pharmacy partner)
```

#### Security Measures
```
Technical Safeguards:
├─> Unique user authentication
├─> Automatic session logout (30 min)
├─> Encrypted password storage (bcrypt)
├─> Role-based access control
└─> Audit trails for all PHI access

Administrative Safeguards:
├─> Security officer designated
├─> Regular risk assessments
├─> Employee training (annual)
├─> Incident response plan
└─> Vendor management (BAAs)

Physical Safeguards:
├─> Cloud infrastructure (SOC 2 compliant)
├─> Multi-factor authentication for admins
└─> Backup and disaster recovery
```

### Data Retention Policy
```
User Data:
├─> Active accounts: Indefinite
├─> Deleted accounts: 30-day grace period
└─> Post-deletion: Anonymize for analytics

Transaction Data:
├─> Financial records: 7 years (IRS requirement)
├─> Prescription records: 7 years (HIPAA requirement)
└─> Audit logs: 7 years

Backups:
├─> Daily incremental backups
├─> Weekly full backups
├─> 90-day backup retention
└─> Encrypted backups in separate region
```

---

## Appendix: API Reference

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Create new user account | No |
| POST | `/api/auth/login` | Email/password login | No |
| GET | `/api/auth/google` | Initiate Google OAuth | No |
| GET | `/api/auth/google/callback` | OAuth callback | No |
| POST | `/api/auth/logout` | End session | Yes |
| GET | `/api/auth/user` | Get current user | Yes |
| GET | `/api/auth/config` | Get auth configuration | No |

### User Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| PATCH | `/api/users/:userId` | Update user profile | Yes (self) |
| GET | `/api/users/:userId/prescriptions` | User's prescriptions | Yes (self) |
| GET | `/api/users/:userId/orders` | User's orders | Yes (self) |
| GET | `/api/users/:userId/medications` | User's personal med list | Yes (self) |
| POST | `/api/users/:userId/medications` | Add to personal med list | Yes (self) |
| DELETE | `/api/users/:userId/medications/:medicationId` | Remove from med list | Yes (self) |
| GET | `/api/users/:userId/refill-requests` | User's refill requests | Yes (self) |
| GET | `/api/users/:userId/prescriptions-needing-refill` | Prescriptions due for refill | Yes (self) |
| GET | `/api/users/:userId/referral-code` | Get user's referral code | Yes (self) |
| GET | `/api/users/:userId/referral-stats` | Referral statistics | Yes (self) |
| GET | `/api/users/:userId/referral-history` | Referral history | Yes (self) |
| GET | `/api/users/:userId/referral-credits` | Referral credits balance | Yes (self) |

### Prescription Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/prescriptions` | Submit new prescription request | Yes |
| GET | `/api/prescriptions/:id` | Get prescription details | Yes |
| GET | `/api/users/:userId/prescriptions` | List user's prescriptions | Yes (self) |
| POST | `/api/prescriptions/generate-pdf` | Generate prescription PDF | Yes |
| GET | `/api/prescription-requests/user/:userId` | Get user's prescription requests | Yes |
| GET | `/api/prescription-requests/:id/pdf` | Get prescription PDF | Yes |
| POST | `/api/prescription-requests/:id/text` | Send prescription via SMS | Yes |
| POST | `/api/refill-requests` | Request prescription refill | Yes |
| GET | `/api/admin/prescription-requests` | Admin: View all requests | Yes (admin) |

### Subscription Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/create-subscription` | Create subscription | Yes |
| POST | `/api/subscription/cancel` | Cancel subscription (no fee) | Yes |
| POST | `/api/subscription/cancel-with-fee` | Cancel with termination fee | Yes |
| GET | `/api/subscription-status/:userId` | Current subscription status | Yes |
| GET | `/api/subscription/termination-fee/:userId` | Calculate termination fee | Yes |
| POST | `/api/subscription/termination-fee/create-payment-intent` | Create payment intent for fee | Yes |

### Blog Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/blog/posts` | List all posts (paginated) | No |
| GET | `/api/blog/posts/published` | List published posts only | No |
| GET | `/api/blog/posts/:slug` | Get single post by slug | No |
| POST | `/api/blog/generate` | Generate content (General AI) | Yes (admin) |
| POST | `/api/blog/posts` | Create/publish post | Yes (admin) |
| PATCH | `/api/blog/posts/:id` | Update post | Yes (admin) |
| DELETE | `/api/blog/posts/:id` | Delete post | Yes (admin) |
| POST | `/api/blog/seo-metadata` | Generate SEO metadata | Yes (admin) |

Note: Medical RAG generation endpoints not yet implemented (Python service planned)

### Admin Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/admin/users` | User directory (paginated) | Yes (admin) |
| GET | `/api/admin/users/:userId` | User profile details | Yes (admin) |
| PATCH | `/api/admin/users/:userId` | Update user | Yes (admin) |
| POST | `/api/admin/users/:userId/deactivate` | Deactivate user account | Yes (admin) |
| POST | `/api/admin/users/:userId/reactivate` | Reactivate user account | Yes (admin) |
| POST | `/api/admin/users/:userId/delete` | Soft delete user | Yes (admin) |
| POST | `/api/admin/users/:userId/recover` | Recover deleted user | Yes (admin) |
| POST | `/api/admin/users/:userId/suspend` | Suspend user account | Yes (admin) |
| GET | `/api/admin/dashboard-metrics` | Dashboard metrics | Yes (admin) |
| GET | `/api/admin/financial-metrics` | Financial metrics | Yes (admin) |
| POST | `/api/admin/medications/upload-prices` | Upload pricing CSV | Yes (admin) |
| GET | `/api/admin/refill-requests` | View all refill requests | Yes (admin) |
| PATCH | `/api/refill-requests/:id` | Update refill request | Yes (admin) |
| GET | `/api/admin/referrals` | View referral activity | Yes (admin) |

### Medication & Search Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/medications/search` | Search medication catalog | No |
| GET | `/api/medications/:id` | Get medication details | No |
| POST | `/api/medications` | Add new medication | Yes (admin) |
| GET | `/api/pharmacies/search` | Search pharmacies | No |

### Order & Cart Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/users/:userId/cart` | Get user's cart | Yes (self) |
| POST | `/api/cart` | Add item to cart | Yes |
| DELETE | `/api/cart/item/:id` | Remove cart item | Yes |
| DELETE | `/api/cart/user/:userId` | Clear user's cart | Yes (self) |
| POST | `/api/orders` | Create new order | Yes |
| GET | `/api/users/:userId/orders` | Get user's orders | Yes (self) |
| GET | `/api/orders/:id` | Get order details | Yes |
| GET | `/api/orders/search` | Search orders | Yes (admin) |

### Referral Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/referrals/validate` | Validate referral code | Yes |
| POST | `/api/referrals/apply` | Apply referral code | Yes |

### Other Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/email-signup` | Waitlist signup | No |
| GET | `/api/refund-policy-pdf` | Get refund policy PDF | No |
| POST | `/api/test/sms` | Test SMS sending | Yes (admin) |
| POST | `/api/test/email` | Test email sending | Yes (admin) |

### Webhook Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/webhooks/stripe` | Stripe webhook events | Stripe signature |

Note: Resend and Twilio webhook endpoints not yet implemented

---

## Conclusion

This workflow documentation provides a comprehensive view of Pillar Drug Club's operational processes, from user registration through prescription fulfillment to administrative oversight. Use this document for:

- **Onboarding**: New team members can understand the complete platform
- **Development**: Engineers can see integration points and data flows  
- **Compliance**: Auditors can verify HIPAA and regulatory adherence
- **Stakeholders**: Business leaders can understand operational mechanics
- **Support**: Customer service can troubleshoot user issues

For questions or updates to this documentation, contact: HEWA

---

**Document History:**
- v1.0 (November 2025): Initial comprehensive workflow documentation
