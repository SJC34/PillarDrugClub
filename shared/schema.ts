import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, index, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth (required by connect-pg-simple)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table - supports both Replit OAuth and email/password auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").unique(),
  email: text("email").unique(),
  password: text("password"), // Optional - only for email/password auth
  firstName: text("first_name"),
  lastName: text("last_name"),
  dateOfBirth: text("date_of_birth"),
  profileImageUrl: text("profile_image_url"), // From Replit OAuth
  phoneNumber: text("phone_number"),
  smsConsent: text("sms_consent").default("false"),
  role: text("role", { enum: ["admin", "client", "broker", "company"] }).default("client"),
  subscriptionTier: text("subscription_tier", { enum: ["free", "gold", "platinum"] }).default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status", { enum: ["active", "canceled", "past_due", "incomplete"] }).default("incomplete"),
  isActive: text("is_active").default("true"),
  commitmentStartDate: timestamp("commitment_start_date"),
  commitmentEndDate: timestamp("commitment_end_date"),
  monthsPaid: integer("months_paid").default(0),
  monthlyRate: numeric("monthly_rate"),
  primaryDoctorId: text("primary_doctor_id"),
  primaryDoctorName: text("primary_doctor_name"),
  primaryDoctorNpi: text("primary_doctor_npi"),
  primaryDoctorPhone: text("primary_doctor_phone"),
  primaryDoctorAddress: jsonb("primary_doctor_address"),
  userAddress: jsonb("user_address"),
  drugAllergies: text("drug_allergies").array(),
  hwCustomerId: integer("hw_customer_id"), // HealthWarehouse customer ID
  hwPatientId: integer("hw_patient_id"), // HealthWarehouse patient ID
  deletedAt: timestamp("deleted_at"), // Soft delete timestamp
  deletionReason: text("deletion_reason"), // Reason for deletion/deactivation
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  accountLockedUntil: timestamp("account_locked_until"),
  lastLoginAt: timestamp("last_login_at"),
  lastLoginIp: text("last_login_ip"),
  passwordChangedAt: timestamp("password_changed_at"),
  passwordExpiresAt: timestamp("password_expires_at"),
  mfaEnabled: boolean("mfa_enabled").default(false),
  mfaSecret: text("mfa_secret"),
  privacyPolicyAcceptedAt: timestamp("privacy_policy_accepted_at"),
  hipaaConsentAt: timestamp("hipaa_consent_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema for email/password registration
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  dateOfBirth: true,
  phoneNumber: true,
  smsConsent: true,
});

// Schema for Replit OAuth upsert (from OpenID Connect)
export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;

// Medications table
export const medications = pgTable("medications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ndc: varchar("ndc").notNull(),
  name: text("name").notNull(),
  genericName: text("generic_name").notNull(),
  brandName: text("brand_name"),
  strength: text("strength").notNull(),
  dosageForm: text("dosage_form").notNull(),
  manufacturer: text("manufacturer").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  price: numeric("price").notNull(),
  wholesalePrice: numeric("wholesale_price").notNull(),
  annualPrice: numeric("annual_price"),
  dosesPerDay: numeric("doses_per_day"),
  isShortCourse: boolean("is_short_course").notNull().default(false),
  fdaMetadata: jsonb("fda_metadata"),
  inStock: boolean("in_stock").notNull().default(true),
  quantity: integer("quantity").notNull().default(0),
  requiresPrescription: boolean("requires_prescription").notNull().default(true),
  controlledSubstance: boolean("controlled_substance").notNull().default(false),
  imageUrl: text("image_url"),
  sideEffects: text("side_effects").array().default(sql`'{}'::text[]`),
  warnings: text("warnings").array().default(sql`'{}'::text[]`),
  interactions: text("interactions").array().default(sql`'{}'::text[]`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMedicationSchema = createInsertSchema(medications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMedication = z.infer<typeof insertMedicationSchema>;
export type Medication = typeof medications.$inferSelect;

// Cart items table
export const cartItems = pgTable("cart_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  medicationId: varchar("medication_id").notNull().references(() => medications.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type CartItem = typeof cartItems.$inferSelect;

// Prescriptions table
export const prescriptions = pgTable("prescriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  medicationId: varchar("medication_id").references(() => medications.id),
  medicationName: text("medication_name").notNull(),
  dosage: text("dosage").notNull(),
  quantity: integer("quantity").notNull(),
  prescriberId: text("prescriber_id"),
  prescriberName: text("prescriber_name"),
  prescriberNpi: text("prescriber_npi"),
  prescriberPhone: text("prescriber_phone"),
  prescriberFax: text("prescriber_fax"),
  prescriberAddress: text("prescriber_address"),
  daysSupply: integer("days_supply"),
  refillsRemaining: integer("refills_remaining").default(0),
  originalRefills: integer("original_refills").default(0),
  directions: text("directions"),
  writtenDate: text("written_date"),
  expirationDate: text("expiration_date"),
  status: text("status", { enum: ["pending", "approved", "rejected", "active", "expired", "transferred", "cancelled"] }).default("pending"),
  isTransfer: boolean("is_transfer").default(false),
  transferFromPharmacy: text("transfer_from_pharmacy"),
  transferFromPharmacyPhone: text("transfer_from_pharmacy_phone"),
  transferFromPharmacyAddress: text("transfer_from_pharmacy_address"),
  prescriptionNumber: text("prescription_number"),
  lastFillDate: text("last_fill_date"),
  transferReason: text("transfer_reason"),
  notes: text("notes"),
  urgency: text("urgency", { enum: ["routine", "urgent", "emergency"] }).default("routine"),
  specialInstructions: text("special_instructions"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;
export type Prescription = typeof prescriptions.$inferSelect;

// Orders table
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  orderNumber: text("order_number").notNull().unique(),
  status: text("status", { 
    enum: ["pending", "processing", "transfer_success", "transfer_failure", "dispensed", "complete", "canceled", "awaiting_verification", "ready_to_ship", "shipped", "delivered", "returned"] 
  }).default("pending"),
  items: jsonb("items").notNull(), // Array of order items
  subtotal: numeric("subtotal").notNull(),
  shippingCost: numeric("shipping_cost").notNull().default("0"),
  tax: numeric("tax").notNull().default("0"),
  total: numeric("total").notNull(),
  shippingAddress: jsonb("shipping_address").notNull(),
  paymentMethod: jsonb("payment_method"),
  notes: text("notes"),
  hwOrderId: integer("hw_order_id"), // HealthWarehouse order ID
  hwOrderData: jsonb("hw_order_data"), // Full HealthWarehouse order response
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  orderNumber: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// Shipments table
export const shipments = pgTable("shipments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  trackingNumber: text("tracking_number"),
  carrier: text("carrier"), // "UPS", "FedEx", "USPS"
  status: text("status", { 
    enum: ["preparing", "shipped", "in_transit", "out_for_delivery", "delivered", "exception", "returned"] 
  }).default("preparing"),
  shippedDate: text("shipped_date"),
  estimatedDeliveryDate: text("estimated_delivery_date"),
  actualDeliveryDate: text("actual_delivery_date"),
  trackingEvents: jsonb("tracking_events").default(sql`'[]'::jsonb`),
  hwShipmentId: integer("hw_shipment_id"), // HealthWarehouse shipment ID
  hwShipmentData: jsonb("hw_shipment_data"), // Full HealthWarehouse shipment response
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertShipmentSchema = createInsertSchema(shipments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertShipment = z.infer<typeof insertShipmentSchema>;
export type Shipment = typeof shipments.$inferSelect;

// Refill requests table
export const refillRequests = pgTable("refill_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  prescriptionId: varchar("prescription_id").notNull().references(() => prescriptions.id, { onDelete: "cascade" }),
  medicationName: text("medication_name").notNull(),
  dosage: text("dosage").notNull(),
  quantity: integer("quantity").notNull(),
  status: text("status", { 
    enum: ["pending", "approved", "rejected", "filled", "cancelled"] 
  }).default("pending"),
  priority: text("priority", { enum: ["routine", "urgent", "emergency"] }).default("routine"),
  dueDate: text("due_date"), // When refill is due based on days supply
  requestedDate: text("requested_date").notNull(),
  approvedDate: text("approved_date"),
  filledDate: text("filled_date"),
  orderId: varchar("order_id").references(() => orders.id), // Links to order when filled
  doctorName: text("doctor_name"),
  doctorPhone: text("doctor_phone"),
  pharmacyNotes: text("pharmacy_notes"),
  patientNotes: text("patient_notes"),
  autoRequested: boolean("auto_requested").default(false), // True if automatically triggered
  reminderSent: boolean("reminder_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRefillRequestSchema = createInsertSchema(refillRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertRefillRequest = z.infer<typeof insertRefillRequestSchema>;
export type RefillRequest = typeof refillRequests.$inferSelect;

// User medications table - tracks patient's current medication list
export const userMedications = pgTable("user_medications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  medicationId: varchar("medication_id").references(() => medications.id, { onDelete: "set null" }),
  prescriptionId: varchar("prescription_id").references(() => prescriptions.id, { onDelete: "set null" }),
  medicationName: text("medication_name").notNull(),
  genericName: text("generic_name"),
  strength: text("strength").notNull(),
  dosage: text("dosage").notNull(), // e.g., "1 tablet", "2.5 mg"
  frequency: text("frequency").notNull(), // e.g., "twice daily", "every 8 hours"
  route: text("route"), // e.g., "oral", "topical", "injection"
  startDate: text("start_date"),
  endDate: text("end_date"),
  prescribedBy: text("prescribed_by"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  fromPrescription: boolean("from_prescription").default(false), // Auto-added from prescription
  fdaData: jsonb("fda_data"), // Cached OpenFDA data
  lastFdaCheck: timestamp("last_fda_check"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserMedicationSchema = createInsertSchema(userMedications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserMedication = z.infer<typeof insertUserMedicationSchema>;
export type UserMedication = typeof userMedications.$inferSelect;

// Referral codes table - each user gets a unique referral code
export const referralCodes = pgTable("referral_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  code: text("code").notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertReferralCodeSchema = createInsertSchema(referralCodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertReferralCode = z.infer<typeof insertReferralCodeSchema>;
export type ReferralCode = typeof referralCodes.$inferSelect;

// Referral history table - tracks who referred whom
export const referralHistory = pgTable("referral_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: varchar("referrer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  refereeId: varchar("referee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  referralCode: text("referral_code").notNull().references(() => referralCodes.code, { onDelete: "cascade" }),
  status: text("status", { enum: ["pending", "completed", "credited"] }).default("pending"),
  referrerCreditApplied: boolean("referrer_credit_applied").default(false),
  refereeCreditApplied: boolean("referee_credit_applied").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertReferralHistorySchema = createInsertSchema(referralHistory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertReferralHistory = z.infer<typeof insertReferralHistorySchema>;
export type ReferralHistory = typeof referralHistory.$inferSelect;

// Referral credits table - tracks credits earned and redeemed
export const referralCredits = pgTable("referral_credits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  referralHistoryId: varchar("referral_history_id").references(() => referralHistory.id, { onDelete: "set null" }),
  creditType: text("credit_type", { enum: ["referrer_bonus", "referee_bonus"] }).notNull(),
  monthsFree: integer("months_free").notNull().default(1),
  status: text("status", { enum: ["pending", "applied", "redeemed", "expired"] }).default("pending"),
  stripeCouponId: text("stripe_coupon_id"),
  appliedAt: timestamp("applied_at"),
  redeemedAt: timestamp("redeemed_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertReferralCreditSchema = createInsertSchema(referralCredits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertReferralCredit = z.infer<typeof insertReferralCreditSchema>;
export type ReferralCredit = typeof referralCredits.$inferSelect;

// Email signups table - for pre-launch email collection
export const emailSignups = pgTable("email_signups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  source: text("source").default("landing_page"), // Track where signup came from
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  subscribed: boolean("subscribed").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEmailSignupSchema = createInsertSchema(emailSignups).omit({
  id: true,
  createdAt: true,
}).extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().regex(/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/, "Please enter a valid phone number"),
});

export type InsertEmailSignup = z.infer<typeof insertEmailSignupSchema>;
export type EmailSignup = typeof emailSignups.$inferSelect;

// Blog posts table - for SEO content generation
export const blogPosts = pgTable("blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(), // Full markdown/HTML content
  excerpt: text("excerpt"), // Short summary for previews
  authorId: varchar("author_id").references(() => users.id, { onDelete: "set null" }),
  authorName: text("author_name"), // Cached author name
  category: text("category", { 
    enum: ["medications", "pharmacy-news", "healthcare-savings", "insurance", "general"] 
  }).notNull().default("general"),
  tags: text("tags").array().default(sql`'{}'::text[]`),
  featuredImage: text("featured_image"),
  seoTitle: text("seo_title"), // Custom SEO title (max 60 chars)
  seoDescription: text("seo_description"), // Meta description (max 160 chars)
  seoKeywords: text("seo_keywords").array().default(sql`'{}'::text[]`),
  status: text("status", { enum: ["draft", "published", "archived"] }).default("draft"),
  publishedAt: timestamp("published_at"),
  viewCount: integer("view_count").default(0),
  aiGenerated: boolean("ai_generated").default(false), // Track AI-generated content
  generationPrompt: text("generation_prompt"), // Store the prompt used
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  slug: true, // Auto-generated from title
  authorName: true, // Auto-populated
  viewCount: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  title: z.string().min(10, "Title must be at least 10 characters").max(200, "Title too long"),
  content: z.string().min(100, "Content must be at least 100 characters"),
  excerpt: z.string().max(300, "Excerpt too long").optional(),
  seoTitle: z.string().max(60, "SEO title must be 60 characters or less").optional(),
  seoDescription: z.string().max(160, "SEO description must be 160 characters or less").optional(),
});

export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;

// HIPAA Audit Logs - Track all PHI access and administrative actions
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  actionType: text("action_type").notNull(), // login, logout, view_phi, update_phi, delete, etc.
  resourceType: text("resource_type"), // user, prescription, medication, refill, etc.
  resourceId: varchar("resource_id"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  deviceInfo: jsonb("device_info"),
  phiAccessed: boolean("phi_accessed").default(false),
  details: jsonb("details"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => [
  index("idx_audit_user").on(table.userId),
  index("idx_audit_action").on(table.actionType),
  index("idx_audit_timestamp").on(table.timestamp),
  index("idx_audit_phi").on(table.phiAccessed),
]);

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
});

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// Security Events - Track failed logins, suspicious activity, account lockouts
export const securityEvents = pgTable("security_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(), // failed_login, account_lockout, suspicious_activity, password_reset, etc.
  email: text("email"), // Track email even if user doesn't exist
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  severity: text("severity", { enum: ["low", "medium", "high", "critical"] }).default("medium"),
  resolved: boolean("resolved").default(false),
  details: jsonb("details"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => [
  index("idx_security_user").on(table.userId),
  index("idx_security_email").on(table.email),
  index("idx_security_type").on(table.eventType),
  index("idx_security_timestamp").on(table.timestamp),
]);

export const insertSecurityEventSchema = createInsertSchema(securityEvents).omit({
  id: true,
  timestamp: true,
});

export type InsertSecurityEvent = z.infer<typeof insertSecurityEventSchema>;
export type SecurityEvent = typeof securityEvents.$inferSelect;

// Password History - Prevent password reuse (HIPAA requires password history)
export const passwordHistory = pgTable("password_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_password_history_user").on(table.userId),
]);

export const insertPasswordHistorySchema = createInsertSchema(passwordHistory).omit({
  id: true,
  createdAt: true,
});

export type InsertPasswordHistory = z.infer<typeof insertPasswordHistorySchema>;
export type PasswordHistory = typeof passwordHistory.$inferSelect;

// User Sessions - Track active sessions for device management
export const userSessions = pgTable("user_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionId: varchar("session_id").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  deviceInfo: jsonb("device_info"),
  lastActivity: timestamp("last_activity").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_user_sessions_user").on(table.userId),
  index("idx_user_sessions_session").on(table.sessionId),
  index("idx_user_sessions_expires").on(table.expiresAt),
]);

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
  createdAt: true,
});

export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type UserSession = typeof userSessions.$inferSelect;
