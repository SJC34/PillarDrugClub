import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";

// Customer Schema
export const customerSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(10),
  dateOfBirth: z.string(),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().length(2),
    zipCode: z.string().min(5),
    country: z.string().default("US")
  }),
  emergencyContact: z.object({
    name: z.string().min(1),
    phone: z.string().min(10),
    relationship: z.string().min(1)
  }).optional(),
  insuranceInfo: z.object({
    provider: z.string(),
    memberId: z.string(),
    groupNumber: z.string().optional(),
    rxBin: z.string().optional(),
    rxPcn: z.string().optional()
  }).optional(),
  allergies: z.array(z.string()).default([]),
  medicalConditions: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string()
});

// Medication Schema
export const medicationSchema = z.object({
  id: z.string(),
  ndc: z.string(), // National Drug Code
  name: z.string(),
  genericName: z.string(),
  brandName: z.string().optional(),
  strength: z.string(),
  dosageForm: z.string(), // tablet, capsule, liquid, etc.
  manufacturer: z.string(),
  category: z.string(),
  description: z.string(),
  price: z.number().positive(),
  wholesalePrice: z.number().positive(),
  inStock: z.boolean().default(true),
  quantity: z.number().int().min(0),
  requiresPrescription: z.boolean().default(true),
  controlledSubstance: z.boolean().default(false),
  imageUrl: z.string().optional(),
  sideEffects: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  interactions: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string()
});

// Prescription Schema
export const prescriptionSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  medicationId: z.string(),
  prescriberId: z.string(), // Doctor ID
  prescriberName: z.string(),
  prescriberNpi: z.string(), // National Provider Identifier
  quantity: z.number().int().positive(),
  daysSupply: z.number().int().positive(),
  refillsRemaining: z.number().int().min(0),
  originalRefills: z.number().int().min(0),
  directions: z.string(), // "Take 1 tablet daily with food"
  writtenDate: z.string(),
  expirationDate: z.string(),
  status: z.enum(["active", "expired", "transferred", "cancelled"]),
  isTransfer: z.boolean().default(false),
  transferFromPharmacy: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

// Order Schema
export const orderSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  orderNumber: z.string(),
  status: z.enum([
    "pending",
    "processing", 
    "awaiting_verification",
    "ready_to_ship",
    "shipped",
    "delivered",
    "cancelled",
    "returned"
  ]),
  items: z.array(z.object({
    type: z.enum(["prescription", "otc"]),
    medicationId: z.string(),
    prescriptionId: z.string().optional(),
    quantity: z.number().int().positive(),
    price: z.number().positive(),
    totalPrice: z.number().positive()
  })),
  subtotal: z.number().positive(),
  shippingCost: z.number().min(0),
  tax: z.number().min(0),
  total: z.number().positive(),
  shippingAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().length(2),
    zipCode: z.string().min(5),
    country: z.string().default("US")
  }),
  paymentMethod: z.object({
    type: z.enum(["credit_card", "debit_card", "insurance", "cash"]),
    last4: z.string().optional(),
    brand: z.string().optional()
  }),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

// Shipment Schema
export const shipmentSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  trackingNumber: z.string(),
  carrier: z.string(), // "UPS", "FedEx", "USPS"
  status: z.enum([
    "preparing",
    "shipped",
    "in_transit", 
    "out_for_delivery",
    "delivered",
    "exception",
    "returned"
  ]),
  shippedDate: z.string().optional(),
  estimatedDeliveryDate: z.string().optional(),
  actualDeliveryDate: z.string().optional(),
  trackingEvents: z.array(z.object({
    timestamp: z.string(),
    location: z.string(),
    status: z.string(),
    description: z.string()
  })).default([]),
  createdAt: z.string(),
  updatedAt: z.string()
});

// Prescriber Schema
export const prescriberSchema = z.object({
  id: z.string(),
  npi: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  specialty: z.string(),
  phone: z.string(),
  fax: z.string().optional(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string().default("US")
  }),
  licenseNumber: z.string(),
  deaNumber: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

// Pharmacy Schema
export const pharmacySchema = z.object({
  id: z.string(),
  name: z.string(),
  chain: z.string().optional(), // CVS, Walgreens, etc.
  phone: z.string(),
  fax: z.string().optional(),
  email: z.string().email().optional(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string().default("US")
  }),
  hours: z.object({
    monday: z.string().optional(),
    tuesday: z.string().optional(),
    wednesday: z.string().optional(),
    thursday: z.string().optional(),
    friday: z.string().optional(),
    saturday: z.string().optional(),
    sunday: z.string().optional()
  }).optional(),
  services: z.array(z.string()).default([]), // ["prescription_transfer", "vaccinations", "diabetes_care"]
  ncpdpId: z.string().optional(), // National Council for Prescription Drug Programs ID
  createdAt: z.string(),
  updatedAt: z.string()
});

// Insert schemas for forms
export const insertCustomerSchema = customerSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertMedicationSchema = medicationSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// Flexible prescription insert schema for form submissions
export const insertPrescriptionSchema = z.object({
  customerId: z.string(),
  medicationName: z.string(),
  dosage: z.string(),
  quantity: z.number().int().positive(),
  prescriber: z.string().optional(), // Doctor name for fax requests
  prescriberPhone: z.string().optional(),
  prescriberFax: z.string().optional(), 
  prescriberAddress: z.string().optional(),
  patientName: z.string(),
  patientDateOfBirth: z.string(),
  urgency: z.enum(["routine", "urgent", "emergency"]).optional(),
  specialInstructions: z.string().optional(),
  // Transfer-specific fields
  isTransfer: z.boolean().default(false),
  prescriptionNumber: z.string().optional(),
  transferFromPharmacy: z.string().optional(),
  transferFromPharmacyPhone: z.string().optional(),
  transferFromPharmacyAddress: z.string().optional(),
  lastFillDate: z.string().optional(),
  refillsRemaining: z.number().int().min(0).optional(),
  transferReason: z.string().optional(),
  status: z.enum(["pending", "processing", "completed", "cancelled"]).default("pending")
});

export const insertOrderSchema = orderSchema.omit({ 
  id: true, 
  orderNumber: true,
  createdAt: true, 
  updatedAt: true 
});

export const insertShipmentSchema = shipmentSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertPrescriberSchema = prescriberSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertPharmacySchema = pharmacySchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// Types
export type Customer = z.infer<typeof customerSchema>;
export type Medication = z.infer<typeof medicationSchema>;
export type Prescription = z.infer<typeof prescriptionSchema>;
export type Order = z.infer<typeof orderSchema>;
export type Shipment = z.infer<typeof shipmentSchema>;
export type Prescriber = z.infer<typeof prescriberSchema>;
export type Pharmacy = z.infer<typeof pharmacySchema>;

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type InsertMedication = z.infer<typeof insertMedicationSchema>;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertShipment = z.infer<typeof insertShipmentSchema>;
export type InsertPrescriber = z.infer<typeof insertPrescriberSchema>;
export type InsertPharmacy = z.infer<typeof insertPharmacySchema>;

// Search and filter schemas
export const medicationSearchSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  inStockOnly: z.boolean().optional(),
  requiresPrescription: z.boolean().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20)
});

export const orderSearchSchema = z.object({
  customerId: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20)
});

export type MedicationSearch = z.infer<typeof medicationSearchSchema>;
export type OrderSearch = z.infer<typeof orderSearchSchema>;