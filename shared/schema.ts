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
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status", { enum: ["active", "canceled", "past_due", "incomplete"] }).default("incomplete"),
  isActive: text("is_active").default("true"),
  primaryDoctorId: text("primary_doctor_id"),
  primaryDoctorName: text("primary_doctor_name"),
  primaryDoctorNpi: text("primary_doctor_npi"),
  primaryDoctorPhone: text("primary_doctor_phone"),
  primaryDoctorAddress: jsonb("primary_doctor_address"),
  userAddress: jsonb("user_address"),
  drugAllergies: text("drug_allergies").array(),
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
