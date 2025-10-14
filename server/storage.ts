import { type User, type InsertUser, type UpsertUser, users, medications as medicationsTable, type Medication as DBMedication, type InsertMedication as DBInsertMedication, orders as ordersTable, prescriptions as prescriptionsTable } from "@shared/schema";
import { 
  type Customer, type InsertCustomer,
  type Medication, type InsertMedication, type MedicationSearch,
  type Prescription, type InsertPrescription,
  type Order, type InsertOrder, type OrderSearch,
  type Shipment, type InsertShipment,
  type Prescriber, type InsertPrescriber,
  type Pharmacy, type InsertPharmacy,
  type PrescriptionRequest, type InsertPrescriptionRequest
} from "@shared/pharmacy-schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>; // For Replit OAuth
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  updateUserStripeInfo(id: string, stripeCustomerId: string, stripeSubscriptionId: string | null): Promise<User | undefined>;
  updateSubscriptionStatus(id: string, status: "active" | "canceled" | "past_due" | "incomplete"): Promise<User | undefined>;
  updateUserPrimaryDoctor(id: string, doctor: { doctorId?: string; doctorName: string; doctorNpi?: string; doctorPhone?: string; doctorAddress?: any }): Promise<User | undefined>;
  updateUserAllergies(id: string, allergies: string[]): Promise<User | undefined>;
  getAllUsers(filters?: { search?: string; role?: string; status?: string; page?: number; limit?: number }): Promise<{ users: User[]; total: number }>;

  // Cart
  getCartItems(userId: string): Promise<any[]>;
  addToCart(userId: string, medicationId: string, quantity: number): Promise<any>;
  updateCartItem(id: string, quantity: number): Promise<any | undefined>;
  removeFromCart(id: string): Promise<boolean>;
  clearCart(userId: string): Promise<void>;

  // Customers
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;

  // Medications
  getMedication(id: string): Promise<Medication | undefined>;
  getMedicationByNdc(ndc: string): Promise<Medication | undefined>;
  searchMedications(params: MedicationSearch): Promise<{ medications: Medication[]; total: number }>;
  createMedication(medication: InsertMedication): Promise<Medication>;
  updateMedication(id: string, medication: Partial<InsertMedication>): Promise<Medication | undefined>;

  // Prescriptions
  getPrescription(id: string): Promise<Prescription | undefined>;
  getUserPrescriptions(userId: string): Promise<any[]>;
  getCustomerPrescriptions(customerId: string): Promise<Prescription[]>;
  // createPrescription and updatePrescription removed - use PrescriptionRequest instead

  // Orders
  getOrder(id: string): Promise<Order | undefined>;
  getOrderByNumber(orderNumber: string): Promise<Order | undefined>;
  getUserOrders(userId: string): Promise<Order[]>;
  getAllOrders(): Promise<Order[]>;
  searchOrders(params: OrderSearch): Promise<{ orders: Order[]; total: number }>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined>;

  // Shipments
  getShipment(id: string): Promise<Shipment | undefined>;
  getShipmentByOrderId(orderId: string): Promise<Shipment | undefined>;
  getShipmentByTrackingNumber(trackingNumber: string): Promise<Shipment | undefined>;
  createShipment(shipment: InsertShipment): Promise<Shipment>;
  updateShipment(id: string, shipment: Partial<InsertShipment>): Promise<Shipment | undefined>;

  // Prescribers
  getPrescriber(id: string): Promise<Prescriber | undefined>;
  getPrescriberByNpi(npi: string): Promise<Prescriber | undefined>;
  createPrescriber(prescriber: InsertPrescriber): Promise<Prescriber>;

  // Pharmacies
  getPharmacy(id: string): Promise<Pharmacy | undefined>;
  getPharmacyByName(name: string): Promise<Pharmacy | undefined>;
  searchPharmacies(query: string): Promise<Pharmacy[]>;
  createPharmacy(pharmacy: InsertPharmacy): Promise<Pharmacy>;

  // Prescription Requests
  getPrescriptionRequest(id: string): Promise<PrescriptionRequest | undefined>;
  getAllPrescriptionRequests(): Promise<PrescriptionRequest[]>;
  getUserPrescriptionRequests(userId: string): Promise<PrescriptionRequest[]>;
  createPrescriptionRequest(request: InsertPrescriptionRequest): Promise<PrescriptionRequest>;
  updatePrescriptionRequest(id: string, request: Partial<InsertPrescriptionRequest>): Promise<PrescriptionRequest | undefined>;

  // Refill Requests
  getRefillRequest(id: string): Promise<any | undefined>;
  getUserRefillRequests(userId: string): Promise<any[]>;
  getAllRefillRequests(): Promise<any[]>;
  createRefillRequest(request: any): Promise<any>;
  updateRefillRequest(id: string, request: any): Promise<any | undefined>;
  getPrescriptionsNeedingRefill(userId: string): Promise<any[]>; // Get prescriptions that need refilling soon

  // Dashboard Metrics
  getDashboardMetrics(): Promise<{
    userMetrics: {
      totalUsers: number;
      newUsersThisWeek: number;
      activeUsers: number;
      usersByTier: { basic: number; plus: number };
    };
    prescriptionMetrics: {
      totalActivePrescriptions: number;
      prescriptionsNeedingRefill: number;
      pendingPrescriptionRequests: number;
      prescriptionsByStatus: { [key: string]: number };
    };
    orderMetrics: {
      totalOrders: number;
      ordersThisMonth: number;
      ordersByStatus: { [key: string]: number };
      revenueEstimate: string;
    };
    refillMetrics: {
      totalRefillRequests: number;
      pendingRefills: number;
      urgentRefills: number;
      refillsApprovedToday: number;
    };
    recentActivity: {
      recentPrescriptionRequests: Array<{ id: string; patientName: string; medicationName: string; urgency: string; requestDate: string }>;
      recentRefillRequests: Array<{ id: string; patientName: string; medicationName: string; priority: string; requestedDate: string }>;
      recentOrders: Array<{ id: string; orderNumber: string; status: string; total: string; createdAt: string }>;
    };
  }>;
}

export class MemStorage implements IStorage {
  protected users: Map<string, User>;
  protected customers: Map<string, Customer>;
  protected medications: Map<string, Medication>;
  protected prescriptions: Map<string, Prescription>;
  protected orders: Map<string, Order>;
  protected shipments: Map<string, Shipment>;
  protected prescribers: Map<string, Prescriber>;
  protected pharmacies: Map<string, Pharmacy>;
  protected prescriptionRequests: Map<string, PrescriptionRequest>;
  protected refillRequests: Map<string, any>;
  protected cartItems: Map<string, any>;
  protected orderCounter: number;

  constructor() {
    this.users = new Map();
    this.customers = new Map();
    this.medications = new Map();
    this.prescriptions = new Map();
    this.orders = new Map();
    this.shipments = new Map();
    this.prescribers = new Map();
    this.pharmacies = new Map();
    this.prescriptionRequests = new Map();
    this.refillRequests = new Map();
    this.cartItems = new Map();
    this.orderCounter = 1000;
    // Removed auto-import to prevent blocking server startup for health checks
    // Data will be seeded and imported after server is listening
  }

  async initializeData(): Promise<void> {
    // Initialize data after server is listening to avoid blocking health checks
    await this.seedMockData();
    await this.importDataOnStartup();
  }

  private async seedMockData() {
    // Add some sample medications (will be supplemented with imported data)
    const sampleMedications: Medication[] = [
      {
        id: "med-1",
        ndc: "0093-0058-01",
        name: "Lisinopril",
        genericName: "Lisinopril",
        brandName: "Prinivil",
        strength: "10mg",
        dosageForm: "Tablet",
        manufacturer: "Teva Pharmaceuticals",
        category: "ACE Inhibitors",
        description: "Used to treat high blood pressure and heart failure",
        price: 25.99,
        wholesalePrice: 8.99,
        isShortCourse: false,
        inStock: true,
        quantity: 1000,
        requiresPrescription: true,
        controlledSubstance: false,
        sideEffects: ["Dizziness", "Cough", "Headache"],
        warnings: ["Do not use if pregnant", "May cause low blood pressure"],
        interactions: ["NSAIDs", "Diuretics"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "med-2",
        ndc: "0093-2165-01",
        name: "Metformin",
        genericName: "Metformin HCl",
        brandName: "Glucophage",
        strength: "500mg",
        dosageForm: "Tablet",
        manufacturer: "Teva Pharmaceuticals",
        category: "Diabetes Medications",
        description: "Used to treat type 2 diabetes",
        price: 15.50,
        wholesalePrice: 4.99,
        isShortCourse: false,
        inStock: true,
        quantity: 800,
        requiresPrescription: true,
        controlledSubstance: false,
        sideEffects: ["Nausea", "Diarrhea", "Stomach upset"],
        warnings: ["Do not use with kidney disease", "Risk of lactic acidosis"],
        interactions: ["Alcohol", "Contrast dyes"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "med-3",
        ndc: "0093-7663-56",
        name: "Atorvastatin",
        genericName: "Atorvastatin Calcium",
        brandName: "Lipitor",
        strength: "20mg",
        dosageForm: "Tablet",
        manufacturer: "Pfizer",
        category: "Statins",
        description: "Used to lower cholesterol and reduce risk of heart disease",
        price: 32.99,
        wholesalePrice: 11.99,
        isShortCourse: false,
        inStock: true,
        quantity: 600,
        requiresPrescription: true,
        controlledSubstance: false,
        sideEffects: ["Muscle pain", "Headache", "Nausea"],
        warnings: ["Risk of muscle damage", "Liver function monitoring required"],
        interactions: ["Grapefruit juice", "Warfarin"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "med-4",
        ndc: "0093-7386-56",
        name: "Sertraline",
        genericName: "Sertraline HCl",
        brandName: "Zoloft",
        strength: "50mg",
        dosageForm: "Tablet",
        manufacturer: "Pfizer",
        category: "Antidepressants",
        description: "Used to treat depression and anxiety disorders",
        price: 24.50,
        wholesalePrice: 8.99,
        isShortCourse: false,
        inStock: true,
        quantity: 500,
        requiresPrescription: true,
        controlledSubstance: false,
        sideEffects: ["Nausea", "Dizziness", "Insomnia"],
        warnings: ["Suicidal thoughts in young adults", "Withdrawal symptoms"],
        interactions: ["MAOIs", "Blood thinners"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    sampleMedications.forEach(med => this.medications.set(med.id, med));

    // Create admin user with hashed password
    const adminId = randomUUID();
    const now = new Date();
    const hashedAdminPassword = await bcrypt.hash("Spaceworm#25", 10);
    const adminUser: User = {
      id: adminId,
      username: "seth@pillardrugclub.com",
      email: "seth@pillardrugclub.com",
      password: hashedAdminPassword,
      firstName: "Seth",
      lastName: "Admin",
      dateOfBirth: null,
      phoneNumber: null,
      smsConsent: "false",
      role: "admin",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionStatus: "active",
      isActive: "true",
      profileImageUrl: null,
      drugAllergies: null,
      primaryDoctorId: null,
      primaryDoctorName: null,
      primaryDoctorNpi: null,
      primaryDoctorPhone: null,
      primaryDoctorAddress: null,
      userAddress: null,
      createdAt: now,
      updatedAt: now
    };
    this.users.set(adminId, adminUser);
    console.log('✅ Admin user created: seth@pillardrugclub.com');

    // Create SJC Pharmacy test user with hashed password
    const sjcId = randomUUID();
    const hashedSjcPassword = await bcrypt.hash("password123", 10);
    const sjcUser: User = {
      id: sjcId,
      username: "sjcpharmacy@gmail.com",
      email: "sjcpharmacy@gmail.com",
      password: hashedSjcPassword,
      firstName: "SJC",
      lastName: "Pharmacy",
      dateOfBirth: "04/21/1992",
      phoneNumber: "4238393523",
      smsConsent: "false",
      role: "client",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionStatus: "active",
      isActive: "true",
      profileImageUrl: null,
      drugAllergies: null,
      primaryDoctorId: null,
      primaryDoctorName: null,
      primaryDoctorNpi: null,
      primaryDoctorPhone: null,
      primaryDoctorAddress: null,
      userAddress: null,
      createdAt: now,
      updatedAt: now
    };
    this.users.set(sjcId, sjcUser);
    console.log('✅ SJC Pharmacy test user created: sjcpharmacy@gmail.com');
  }

  async loadImportedMedications() {
    try {
      // Import medications from pharmacy CSV
      const { importMedicationsFromCSV } = await import('../scripts/import-pharmacy-csv');
      const medications = await importMedicationsFromCSV();
      
      // Add medications to storage
      for (const med of medications) {
        this.medications.set(med.id, med);
      }
      
      console.log(`✅ Loaded medications from pharmacy CSV: ${this.medications.size} total`);
    } catch (error) {
      console.log('⚠️  Could not load pharmacy CSV medications:', error);
      console.log('Using sample medications only');
    }
  }

  // Getter for medication count (for health checks)
  get medicationCount(): number {
    return this.medications.size;
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date();
    const user: User = { 
      id,
      username: insertUser.email ?? null, // Use email as username for simplicity
      email: insertUser.email ?? null,
      password: insertUser.password ?? null, // In production, this should be hashed
      firstName: insertUser.firstName ?? null,
      lastName: insertUser.lastName ?? null,
      profileImageUrl: null,
      phoneNumber: insertUser.phoneNumber ?? null,
      smsConsent: insertUser.smsConsent ?? "false",
      role: "client",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionStatus: "incomplete",
      isActive: "true",
      drugAllergies: null,
      primaryDoctorId: null,
      primaryDoctorName: null,
      primaryDoctorNpi: null,
      primaryDoctorPhone: null,
      primaryDoctorAddress: null,
      userAddress: null,
      dateOfBirth: insertUser.dateOfBirth ?? null,
      createdAt: now,
      updatedAt: now
    };
    this.users.set(id, user);
    return user;
  }

  async upsertUser(upsertData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(upsertData.id ?? "");
    const now = new Date();
    
    if (existingUser) {
      // Update existing user
      const updated: User = {
        ...existingUser,
        email: upsertData.email || existingUser.email,
        firstName: upsertData.firstName || existingUser.firstName,
        lastName: upsertData.lastName || existingUser.lastName,
        profileImageUrl: upsertData.profileImageUrl || existingUser.profileImageUrl,
        updatedAt: now
      };
      this.users.set(upsertData.id ?? "", updated);
      return updated;
    } else {
      // Create new user from OAuth
      const newUser: User = {
        id: upsertData.id ?? randomUUID(),
        username: upsertData.email ?? null,
        email: upsertData.email ?? null,
        password: null, // OAuth users don't have passwords
        firstName: upsertData.firstName ?? null,
        lastName: upsertData.lastName ?? null,
        profileImageUrl: upsertData.profileImageUrl ?? null,
        dateOfBirth: null,
        phoneNumber: null,
        smsConsent: "false",
        role: "client",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionStatus: "incomplete",
        isActive: "true",
        drugAllergies: null,
        primaryDoctorId: null,
        primaryDoctorName: null,
        primaryDoctorNpi: null,
        primaryDoctorPhone: null,
        primaryDoctorAddress: null,
        userAddress: null,
        createdAt: now,
        updatedAt: now
      };
      this.users.set(upsertData.id ?? "", newUser);
      return newUser;
    }
  }

  async updateUserStripeInfo(id: string, stripeCustomerId: string, stripeSubscriptionId: string | null): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = {
      ...user,
      stripeCustomerId,
      stripeSubscriptionId,
      // Only set status to active if we have a subscription ID
      subscriptionStatus: stripeSubscriptionId ? "incomplete" as const : user.subscriptionStatus,
      updatedAt: new Date()
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateSubscriptionStatus(id: string, status: "active" | "canceled" | "past_due" | "incomplete"): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = {
      ...user,
      subscriptionStatus: status,
      updatedAt: new Date()
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    
    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date()
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserPrimaryDoctor(
    id: string, 
    doctor: { 
      doctorId?: string; 
      doctorName: string; 
      doctorNpi?: string; 
      doctorPhone?: string; 
      doctorAddress?: any 
    }
  ): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = {
      ...user,
      primaryDoctorId: doctor.doctorId || null,
      primaryDoctorName: doctor.doctorName,
      primaryDoctorNpi: doctor.doctorNpi || null,
      primaryDoctorPhone: doctor.doctorPhone || null,
      primaryDoctorAddress: doctor.doctorAddress || null,
      updatedAt: new Date()
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserAllergies(id: string, allergies: string[]): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = {
      ...user,
      drugAllergies: allergies,
      updatedAt: new Date()
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(filters?: { search?: string; role?: string; status?: string; page?: number; limit?: number }): Promise<{ users: User[]; total: number }> {
    let users = Array.from(this.users.values());
    
    // Apply search filter (search in name and email)
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      users = users.filter(user => 
        (user.firstName?.toLowerCase().includes(searchLower)) ||
        (user.lastName?.toLowerCase().includes(searchLower)) ||
        (user.email?.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply role filter
    if (filters?.role) {
      users = users.filter(user => user.role === filters.role);
    }
    
    // Apply status filter (subscription status)
    if (filters?.status) {
      users = users.filter(user => user.subscriptionStatus === filters.status);
    }
    
    const total = users.length;
    
    // Apply pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    users = users.slice(startIndex, endIndex);
    
    return { users, total };
  }

  // Cart methods
  async getCartItems(userId: string): Promise<any[]> {
    return Array.from(this.cartItems.values()).filter(
      (item) => item.userId === userId
    );
  }

  async addToCart(userId: string, medicationId: string, quantity: number): Promise<any> {
    // Check if item already exists in cart
    const existing = Array.from(this.cartItems.values()).find(
      (item) => item.userId === userId && item.medicationId === medicationId
    );

    if (existing) {
      // Update quantity
      const updated = { ...existing, quantity: existing.quantity + quantity, updatedAt: new Date() };
      this.cartItems.set(existing.id, updated);
      return updated;
    }

    // Create new cart item
    const id = randomUUID();
    const now = new Date();
    const cartItem = {
      id,
      userId,
      medicationId,
      quantity,
      createdAt: now,
      updatedAt: now
    };
    this.cartItems.set(id, cartItem);
    return cartItem;
  }

  async updateCartItem(id: string, quantity: number): Promise<any | undefined> {
    const item = this.cartItems.get(id);
    if (!item) return undefined;

    const updated = { ...item, quantity, updatedAt: new Date() };
    this.cartItems.set(id, updated);
    return updated;
  }

  async removeFromCart(id: string): Promise<boolean> {
    return this.cartItems.delete(id);
  }

  async clearCart(userId: string): Promise<void> {
    const items = await this.getCartItems(userId);
    items.forEach(item => this.cartItems.delete(item.id));
  }

  // Customer methods
  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    return Array.from(this.customers.values()).find(
      (customer) => customer.email === email,
    );
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const customer: Customer = { 
      ...insertCustomer, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.customers.set(id, customer);
    return customer;
  }

  async updateCustomer(id: string, updateData: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const customer = this.customers.get(id);
    if (!customer) return undefined;
    
    const updated: Customer = {
      ...customer,
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    this.customers.set(id, updated);
    return updated;
  }

  // Medication methods
  async getMedication(id: string): Promise<Medication | undefined> {
    return this.medications.get(id);
  }

  async getMedicationByNdc(ndc: string): Promise<Medication | undefined> {
    return Array.from(this.medications.values()).find(
      (medication) => medication.ndc === ndc,
    );
  }

  async searchMedications(params: MedicationSearch): Promise<{ medications: Medication[]; total: number }> {
    let medications = Array.from(this.medications.values());

    // Apply filters
    if (params.query) {
      const query = params.query.toLowerCase();
      medications = medications.filter(med => 
        med.name.toLowerCase().includes(query) ||
        med.genericName.toLowerCase().includes(query) ||
        med.brandName?.toLowerCase().includes(query) ||
        med.category.toLowerCase().includes(query)
      );
    }

    if (params.category) {
      medications = medications.filter(med => med.category === params.category);
    }

    if (params.minPrice !== undefined) {
      medications = medications.filter(med => med.price >= params.minPrice!);
    }

    if (params.maxPrice !== undefined) {
      medications = medications.filter(med => med.price <= params.maxPrice!);
    }

    if (params.inStockOnly) {
      medications = medications.filter(med => med.inStock && med.quantity > 0);
    }

    if (params.requiresPrescription !== undefined) {
      medications = medications.filter(med => med.requiresPrescription === params.requiresPrescription);
    }

    const total = medications.length;
    const offset = (params.page - 1) * params.limit;
    const paginatedMedications = medications.slice(offset, offset + params.limit);

    return { medications: paginatedMedications, total };
  }

  async createMedication(insertMedication: InsertMedication): Promise<Medication> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const medication: Medication = { 
      ...insertMedication, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.medications.set(id, medication);
    return medication;
  }

  async updateMedication(id: string, updateData: Partial<InsertMedication>): Promise<Medication | undefined> {
    const medication = this.medications.get(id);
    if (!medication) return undefined;
    
    const updated: Medication = {
      ...medication,
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    this.medications.set(id, updated);
    return updated;
  }

  // Prescription methods
  async getPrescription(id: string): Promise<Prescription | undefined> {
    return this.prescriptions.get(id);
  }

  async getUserPrescriptions(userId: string): Promise<any[]> {
    // Filter prescriptions from pharmacy-schema by matching customerId
    // Note: In DB implementation, this would query the prescriptions table from shared/schema.ts by userId
    return Array.from(this.prescriptions.values()).filter(
      (prescription) => prescription.customerId === userId
    );
  }

  async getCustomerPrescriptions(customerId: string): Promise<Prescription[]> {
    return Array.from(this.prescriptions.values()).filter(
      (prescription) => prescription.customerId === customerId,
    );
  }

  // createPrescription and updatePrescription methods removed
  // The prescription transfer flow now uses PrescriptionRequest instead

  // Order methods
  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    return Array.from(this.orders.values()).find(
      (order) => order.orderNumber === orderNumber,
    );
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter((order) => order.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values())
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async searchOrders(params: OrderSearch): Promise<{ orders: Order[]; total: number }> {
    let orders = Array.from(this.orders.values());

    // Apply filters
    if (params.customerId) {
      orders = orders.filter(order => order.customerId === params.customerId);
    }

    if (params.status) {
      orders = orders.filter(order => order.status === params.status);
    }

    if (params.startDate) {
      orders = orders.filter(order => order.createdAt >= params.startDate!);
    }

    if (params.endDate) {
      orders = orders.filter(order => order.createdAt <= params.endDate!);
    }

    // Sort by most recent first
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = orders.length;
    const offset = (params.page - 1) * params.limit;
    const paginatedOrders = orders.slice(offset, offset + params.limit);

    return { orders: paginatedOrders, total };
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const orderNumber = `PD${String(this.orderCounter++).padStart(6, '0')}`;
    const now = new Date().toISOString();
    const order: Order = { 
      ...insertOrder, 
      id,
      orderNumber,
      createdAt: now, 
      updatedAt: now 
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrder(id: string, updateData: Partial<InsertOrder>): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updated: Order = {
      ...order,
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    this.orders.set(id, updated);
    return updated;
  }

  // Shipment methods
  async getShipment(id: string): Promise<Shipment | undefined> {
    return this.shipments.get(id);
  }

  async getShipmentByOrderId(orderId: string): Promise<Shipment | undefined> {
    return Array.from(this.shipments.values()).find(
      (shipment) => shipment.orderId === orderId,
    );
  }

  async getShipmentByTrackingNumber(trackingNumber: string): Promise<Shipment | undefined> {
    return Array.from(this.shipments.values()).find(
      (shipment) => shipment.trackingNumber === trackingNumber,
    );
  }

  async createShipment(insertShipment: InsertShipment): Promise<Shipment> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const shipment: Shipment = { 
      ...insertShipment, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.shipments.set(id, shipment);
    return shipment;
  }

  async updateShipment(id: string, updateData: Partial<InsertShipment>): Promise<Shipment | undefined> {
    const shipment = this.shipments.get(id);
    if (!shipment) return undefined;
    
    const updated: Shipment = {
      ...shipment,
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    this.shipments.set(id, updated);
    return updated;
  }

  // Prescriber methods
  async getPrescriber(id: string): Promise<Prescriber | undefined> {
    return this.prescribers.get(id);
  }

  async getPrescriberByNpi(npi: string): Promise<Prescriber | undefined> {
    return Array.from(this.prescribers.values()).find(
      (prescriber) => prescriber.npi === npi,
    );
  }

  async createPrescriber(insertPrescriber: InsertPrescriber): Promise<Prescriber> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const prescriber: Prescriber = { 
      ...insertPrescriber, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.prescribers.set(id, prescriber);
    return prescriber;
  }

  async importInitialPrescribers(): Promise<void> {
    const prescribersData = [
      {
        npi: "1234567890",
        firstName: "Sarah",
        lastName: "Johnson",
        specialty: "Internal Medicine",
        phone: "(555) 123-4567",
        fax: "(555) 123-4568",
        address: {
          street: "123 Medical Center Dr",
          city: "Boston",
          state: "MA",
          zipCode: "02115",
          country: "US"
        },
        licenseNumber: "MA123456",
        deaNumber: "BJ1234567"
      },
      {
        npi: "2345678901",
        firstName: "Michael",
        lastName: "Chen",
        specialty: "Cardiology",
        phone: "(555) 234-5678",
        fax: "(555) 234-5679",
        address: {
          street: "456 Heart Center Ave",
          city: "San Francisco",
          state: "CA",
          zipCode: "94102",
          country: "US"
        },
        licenseNumber: "CA234567",
        deaNumber: "BC2345678"
      },
      {
        npi: "3456789012",
        firstName: "Emily",
        lastName: "Rodriguez",
        specialty: "Endocrinology",
        phone: "(555) 345-6789",
        fax: "(555) 345-6780",
        address: {
          street: "789 Diabetes Way",
          city: "Miami",
          state: "FL",
          zipCode: "33101",
          country: "US"
        },
        licenseNumber: "FL345678",
        deaNumber: "BR3456789"
      },
      {
        npi: "4567890123",
        firstName: "David",
        lastName: "Thompson",
        specialty: "Family Medicine",
        phone: "(555) 456-7890",
        fax: "(555) 456-7891",
        address: {
          street: "321 Family Health Blvd",
          city: "Chicago",
          state: "IL",
          zipCode: "60601",
          country: "US"
        },
        licenseNumber: "IL456789",
        deaNumber: "BT4567890"
      },
      {
        npi: "5678901234",
        firstName: "Jessica",
        lastName: "Williams",
        specialty: "Psychiatry",
        phone: "(555) 567-8901",
        fax: "(555) 567-8902",
        address: {
          street: "654 Mental Health St",
          city: "Seattle",
          state: "WA",
          zipCode: "98101",
          country: "US"
        },
        licenseNumber: "WA567890",
        deaNumber: "BW5678901"
      },
      {
        npi: "6789012345",
        firstName: "Robert",
        lastName: "Davis",
        specialty: "Orthopedic Surgery",
        phone: "(555) 678-9012",
        fax: "(555) 678-9013",
        address: {
          street: "987 Bone & Joint Rd",
          city: "Dallas",
          state: "TX",
          zipCode: "75201",
          country: "US"
        },
        licenseNumber: "TX678901",
        deaNumber: "BD6789012"
      },
      {
        npi: "7890123456",
        firstName: "Lisa",
        lastName: "Anderson",
        specialty: "Dermatology",
        phone: "(555) 789-0123",
        fax: "(555) 789-0124",
        address: {
          street: "147 Skin Care Lane",
          city: "Phoenix",
          state: "AZ",
          zipCode: "85001",
          country: "US"
        },
        licenseNumber: "AZ789012",
        deaNumber: "BA7890123"
      },
      {
        npi: "8901234567",
        firstName: "James",
        lastName: "Wilson",
        specialty: "Neurology",
        phone: "(555) 890-1234",
        fax: "(555) 890-1235",
        address: {
          street: "258 Brain Center Pkwy",
          city: "Atlanta",
          state: "GA",
          zipCode: "30301",
          country: "US"
        },
        licenseNumber: "GA890123",
        deaNumber: "BW8901234"
      },
      {
        npi: "9012345678",
        firstName: "Rachel",
        lastName: "Brown",
        specialty: "Pediatrics",
        phone: "(555) 901-2345",
        fax: "(555) 901-2346",
        address: {
          street: "369 Children's Hospital Way",
          city: "Denver",
          state: "CO",
          zipCode: "80201",
          country: "US"
        },
        licenseNumber: "CO901234",
        deaNumber: "BB9012345"
      },
      {
        npi: "0123456789",
        firstName: "Kevin",
        lastName: "Martinez",
        specialty: "Ophthalmology",
        phone: "(555) 012-3456",
        fax: "(555) 012-3457",
        address: {
          street: "741 Eye Care Center Dr",
          city: "Las Vegas",
          state: "NV",
          zipCode: "89101",
          country: "US"
        },
        licenseNumber: "NV012345",
        deaNumber: "BM0123456"
      },
      {
        npi: "1357924680",
        firstName: "Amanda",
        lastName: "Garcia",
        specialty: "Oncology",
        phone: "(555) 135-7924",
        fax: "(555) 135-7925",
        address: {
          street: "852 Cancer Treatment Ave",
          city: "Portland",
          state: "OR",
          zipCode: "97201",
          country: "US"
        },
        licenseNumber: "OR135792",
        deaNumber: "BG1357924"
      },
      {
        npi: "2468013579",
        firstName: "Christopher",
        lastName: "Lee",
        specialty: "Gastroenterology",
        phone: "(555) 246-8013",
        fax: "(555) 246-8014",
        address: {
          street: "963 Digestive Health Blvd",
          city: "Nashville",
          state: "TN",
          zipCode: "37201",
          country: "US"
        },
        licenseNumber: "TN246801",
        deaNumber: "BL2468013"
      },
      {
        npi: "3691470258",
        firstName: "Nicole",
        lastName: "Taylor",
        specialty: "Rheumatology",
        phone: "(555) 369-1470",
        fax: "(555) 369-1471",
        address: {
          street: "159 Joint Care Center St",
          city: "Salt Lake City",
          state: "UT",
          zipCode: "84101",
          country: "US"
        },
        licenseNumber: "UT369147",
        deaNumber: "BT3691470"
      },
      {
        npi: "4815162342",
        firstName: "Mark",
        lastName: "White",
        specialty: "Pulmonology",
        phone: "(555) 481-5162",
        fax: "(555) 481-5163",
        address: {
          street: "753 Lung Health Dr",
          city: "Minneapolis",
          state: "MN",
          zipCode: "55401",
          country: "US"
        },
        licenseNumber: "MN481516",
        deaNumber: "BW4815162"
      },
      {
        npi: "5926284037",
        firstName: "Jennifer",
        lastName: "Clark",
        specialty: "Emergency Medicine",
        phone: "(555) 592-6284",
        fax: "(555) 592-6285",
        address: {
          street: "486 Emergency Care Way",
          city: "Kansas City",
          state: "MO",
          zipCode: "64101",
          country: "US"
        },
        licenseNumber: "MO592628",
        deaNumber: "BC5926284"
      }
    ];

    console.log('🔄 Importing prescribers...');
    let importedCount = 0;

    for (const prescriberData of prescribersData) {
      try {
        await this.createPrescriber(prescriberData);
        importedCount++;
      } catch (error) {
        console.error(`Error importing prescriber ${prescriberData.firstName} ${prescriberData.lastName}:`, error);
      }
    }

    console.log(`✅ Successfully imported ${importedCount} prescribers`);
  }

  // Pharmacy methods
  async getPharmacy(id: string): Promise<Pharmacy | undefined> {
    return this.pharmacies.get(id);
  }

  async getPharmacyByName(name: string): Promise<Pharmacy | undefined> {
    return Array.from(this.pharmacies.values()).find(
      (pharmacy) => pharmacy.name.toLowerCase().includes(name.toLowerCase()),
    );
  }

  async searchPharmacies(query: string): Promise<Pharmacy[]> {
    if (!query) {
      return Array.from(this.pharmacies.values());
    }
    
    return Array.from(this.pharmacies.values()).filter(pharmacy =>
      pharmacy.name.toLowerCase().includes(query.toLowerCase()) ||
      pharmacy.chain?.toLowerCase().includes(query.toLowerCase()) ||
      pharmacy.address.city.toLowerCase().includes(query.toLowerCase()) ||
      pharmacy.address.state.toLowerCase().includes(query.toLowerCase())
    );
  }

  async createPharmacy(insertPharmacy: InsertPharmacy): Promise<Pharmacy> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const pharmacy: Pharmacy = { 
      ...insertPharmacy, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.pharmacies.set(id, pharmacy);
    return pharmacy;
  }

  async importInitialPharmacies(): Promise<void> {
    const pharmaciesData = [
      {
        name: "CVS Pharmacy #1234",
        chain: "CVS",
        phone: "(555) 100-1000",
        fax: "(555) 100-1001",
        email: "cvs1234@cvs.com",
        address: {
          street: "123 Main St",
          city: "Boston",
          state: "MA",
          zipCode: "02101",
          country: "US"
        },
        hours: {
          monday: "8:00 AM - 10:00 PM",
          tuesday: "8:00 AM - 10:00 PM",
          wednesday: "8:00 AM - 10:00 PM",
          thursday: "8:00 AM - 10:00 PM",
          friday: "8:00 AM - 10:00 PM",
          saturday: "9:00 AM - 9:00 PM",
          sunday: "10:00 AM - 8:00 PM"
        },
        services: ["prescription_transfer", "vaccinations", "flu_shots", "covid_testing"],
        ncpdpId: "0000001"
      },
      {
        name: "Walgreens #2468",
        chain: "Walgreens",
        phone: "(555) 200-2000",
        fax: "(555) 200-2001",
        email: "wal2468@walgreens.com",
        address: {
          street: "456 Oak Ave",
          city: "San Francisco",
          state: "CA",
          zipCode: "94102",
          country: "US"
        },
        hours: {
          monday: "7:00 AM - 11:00 PM",
          tuesday: "7:00 AM - 11:00 PM",
          wednesday: "7:00 AM - 11:00 PM",
          thursday: "7:00 AM - 11:00 PM",
          friday: "7:00 AM - 11:00 PM",
          saturday: "8:00 AM - 10:00 PM",
          sunday: "9:00 AM - 9:00 PM"
        },
        services: ["prescription_transfer", "vaccinations", "diabetes_care", "blood_pressure_monitoring"],
        ncpdpId: "0000002"
      },
      {
        name: "Rite Aid #3691",
        chain: "Rite Aid",
        phone: "(555) 300-3000",
        fax: "(555) 300-3001",
        email: "riteaid3691@riteaid.com",
        address: {
          street: "789 Pine St",
          city: "Chicago",
          state: "IL",
          zipCode: "60601",
          country: "US"
        },
        hours: {
          monday: "9:00 AM - 9:00 PM",
          tuesday: "9:00 AM - 9:00 PM",
          wednesday: "9:00 AM - 9:00 PM",
          thursday: "9:00 AM - 9:00 PM",
          friday: "9:00 AM - 9:00 PM",
          saturday: "9:00 AM - 8:00 PM",
          sunday: "10:00 AM - 6:00 PM"
        },
        services: ["prescription_transfer", "wellness_screenings", "immunizations"],
        ncpdpId: "0000003"
      },
      {
        name: "Kroger Pharmacy #4815",
        chain: "Kroger",
        phone: "(555) 400-4000",
        fax: "(555) 400-4001",
        email: "pharmacy4815@kroger.com",
        address: {
          street: "321 Elm Dr",
          city: "Atlanta",
          state: "GA",
          zipCode: "30301",
          country: "US"
        },
        hours: {
          monday: "9:00 AM - 8:00 PM",
          tuesday: "9:00 AM - 8:00 PM",
          wednesday: "9:00 AM - 8:00 PM",
          thursday: "9:00 AM - 8:00 PM",
          friday: "9:00 AM - 8:00 PM",
          saturday: "10:00 AM - 6:00 PM",
          sunday: "11:00 AM - 5:00 PM"
        },
        services: ["prescription_transfer", "medication_therapy_management", "health_screenings"],
        ncpdpId: "0000004"
      },
      {
        name: "Publix Pharmacy #5926",
        chain: "Publix",
        phone: "(555) 500-5000",
        fax: "(555) 500-5001",
        email: "publix5926@publix.com",
        address: {
          street: "654 Sunset Blvd",
          city: "Miami",
          state: "FL",
          zipCode: "33101",
          country: "US"
        },
        hours: {
          monday: "9:00 AM - 9:00 PM",
          tuesday: "9:00 AM - 9:00 PM",
          wednesday: "9:00 AM - 9:00 PM",
          thursday: "9:00 AM - 9:00 PM",
          friday: "9:00 AM - 9:00 PM",
          saturday: "9:00 AM - 7:00 PM",
          sunday: "11:00 AM - 6:00 PM"
        },
        services: ["prescription_transfer", "vaccinations", "medication_synchronization"],
        ncpdpId: "0000005"
      },
      {
        name: "Walmart Pharmacy #6284",
        chain: "Walmart",
        phone: "(555) 600-6000",
        fax: "(555) 600-6001",
        email: "pharmacy6284@walmart.com",
        address: {
          street: "987 Commerce Way",
          city: "Dallas",
          state: "TX",
          zipCode: "75201",
          country: "US"
        },
        hours: {
          monday: "9:00 AM - 8:00 PM",
          tuesday: "9:00 AM - 8:00 PM",
          wednesday: "9:00 AM - 8:00 PM",
          thursday: "9:00 AM - 8:00 PM",
          friday: "9:00 AM - 8:00 PM",
          saturday: "9:00 AM - 7:00 PM",
          sunday: "10:00 AM - 6:00 PM"
        },
        services: ["prescription_transfer", "$4_generics", "specialty_pharmacy"],
        ncpdpId: "0000006"
      },
      {
        name: "Costco Pharmacy #7158",
        chain: "Costco",
        phone: "(555) 700-7000",
        fax: "(555) 700-7001",
        email: "pharmacy7158@costco.com",
        address: {
          street: "159 Wholesale Dr",
          city: "Seattle",
          state: "WA",
          zipCode: "98101",
          country: "US"
        },
        hours: {
          monday: "10:00 AM - 8:30 PM",
          tuesday: "10:00 AM - 8:30 PM",
          wednesday: "10:00 AM - 8:30 PM",
          thursday: "10:00 AM - 8:30 PM",
          friday: "10:00 AM - 8:30 PM",
          saturday: "9:30 AM - 6:00 PM",
          sunday: "10:00 AM - 6:00 PM"
        },
        services: ["prescription_transfer", "immunizations", "specialty_medications"],
        ncpdpId: "0000007"
      },
      {
        name: "Target Pharmacy #8369",
        chain: "Target",
        phone: "(555) 800-8000",
        fax: "(555) 800-8001",
        email: "pharmacy8369@target.com",
        address: {
          street: "753 Shopping Center Blvd",
          city: "Phoenix",
          state: "AZ",
          zipCode: "85001",
          country: "US"
        },
        hours: {
          monday: "9:00 AM - 9:00 PM",
          tuesday: "9:00 AM - 9:00 PM",
          wednesday: "9:00 AM - 9:00 PM",
          thursday: "9:00 AM - 9:00 PM",
          friday: "9:00 AM - 9:00 PM",
          saturday: "9:00 AM - 7:00 PM",
          sunday: "11:00 AM - 6:00 PM"
        },
        services: ["prescription_transfer", "vaccinations", "health_consultations"],
        ncpdpId: "0000008"
      },
      {
        name: "Safeway Pharmacy #9147",
        chain: "Safeway",
        phone: "(555) 900-9000",
        fax: "(555) 900-9001",
        email: "pharmacy9147@safeway.com",
        address: {
          street: "486 Grocery Lane",
          city: "Denver",
          state: "CO",
          zipCode: "80201",
          country: "US"
        },
        hours: {
          monday: "9:00 AM - 8:00 PM",
          tuesday: "9:00 AM - 8:00 PM",
          wednesday: "9:00 AM - 8:00 PM",
          thursday: "9:00 AM - 8:00 PM",
          friday: "9:00 AM - 8:00 PM",
          saturday: "9:00 AM - 6:00 PM",
          sunday: "10:00 AM - 5:00 PM"
        },
        services: ["prescription_transfer", "medication_review", "diabetes_education"],
        ncpdpId: "0000009"
      },
      {
        name: "H-E-B Pharmacy #0258",
        chain: "H-E-B",
        phone: "(555) 025-8000",
        fax: "(555) 025-8001",
        email: "pharmacy0258@heb.com",
        address: {
          street: "147 Texas Ave",
          city: "Austin",
          state: "TX",
          zipCode: "73301",
          country: "US"
        },
        hours: {
          monday: "8:00 AM - 8:00 PM",
          tuesday: "8:00 AM - 8:00 PM",
          wednesday: "8:00 AM - 8:00 PM",
          thursday: "8:00 AM - 8:00 PM",
          friday: "8:00 AM - 8:00 PM",
          saturday: "9:00 AM - 6:00 PM",
          sunday: "10:00 AM - 5:00 PM"
        },
        services: ["prescription_transfer", "immunizations", "medication_adherence"],
        ncpdpId: "0000010"
      }
    ];

    console.log('🔄 Importing pharmacies...');
    let importedCount = 0;

    for (const pharmacyData of pharmaciesData) {
      try {
        await this.createPharmacy(pharmacyData);
        importedCount++;
      } catch (error) {
        console.error(`Error importing pharmacy ${pharmacyData.name}:`, error);
      }
    }

    console.log(`✅ Successfully imported ${importedCount} pharmacies`);
  }

  protected async importDataOnStartup(): Promise<void> {
    // Import prescribers, pharmacies, and medications on startup
    console.log('🔄 Starting initial data import...');
    
    try {
      await this.importInitialPrescribers();
      await this.importInitialPharmacies();
      await this.loadImportedMedications();
      console.log('✅ Initial data import completed successfully');
    } catch (error) {
      console.error('❌ Error during initial data import:', error);
    }
  }

  // Prescription Requests
  async getPrescriptionRequest(id: string): Promise<PrescriptionRequest | undefined> {
    return this.prescriptionRequests.get(id);
  }

  async getAllPrescriptionRequests(): Promise<PrescriptionRequest[]> {
    return Array.from(this.prescriptionRequests.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getUserPrescriptionRequests(userId: string): Promise<PrescriptionRequest[]> {
    return Array.from(this.prescriptionRequests.values())
      .filter(req => req.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createPrescriptionRequest(insertRequest: InsertPrescriptionRequest): Promise<PrescriptionRequest> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const request: PrescriptionRequest = {
      ...insertRequest,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.prescriptionRequests.set(id, request);
    return request;
  }

  async updatePrescriptionRequest(id: string, updateData: Partial<InsertPrescriptionRequest>): Promise<PrescriptionRequest | undefined> {
    const request = this.prescriptionRequests.get(id);
    if (!request) return undefined;

    const updated: PrescriptionRequest = {
      ...request,
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    this.prescriptionRequests.set(id, updated);
    return updated;
  }

  // Refill Requests
  async getRefillRequest(id: string): Promise<any | undefined> {
    return this.refillRequests.get(id);
  }

  async getUserRefillRequests(userId: string): Promise<any[]> {
    return Array.from(this.refillRequests.values())
      .filter(req => req.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAllRefillRequests(): Promise<any[]> {
    return Array.from(this.refillRequests.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createRefillRequest(insertRequest: any): Promise<any> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const request = {
      ...insertRequest,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.refillRequests.set(id, request);
    return request;
  }

  async updateRefillRequest(id: string, updateData: any): Promise<any | undefined> {
    const request = this.refillRequests.get(id);
    if (!request) return undefined;

    const updated = {
      ...request,
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    this.refillRequests.set(id, updated);
    return updated;
  }

  async getPrescriptionsNeedingRefill(userId: string): Promise<any[]> {
    const userPrescriptions = Array.from(this.prescriptions.values())
      .filter(p => p.userId === userId && p.status === 'active' && p.refillsRemaining > 0);

    const today = new Date();
    const prescriptionsNeedingRefill: any[] = [];

    for (const prescription of userPrescriptions) {
      if (prescription.lastFillDate && prescription.daysSupply) {
        const lastFillDate = new Date(prescription.lastFillDate);
        const refillDueDate = new Date(lastFillDate);
        refillDueDate.setDate(lastFillDate.getDate() + prescription.daysSupply);

        // Check if refill is due within 7 days
        const daysUntilRefill = Math.floor((refillDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilRefill <= 7 && daysUntilRefill >= 0) {
          prescriptionsNeedingRefill.push({
            ...prescription,
            dueDate: refillDueDate.toISOString().split('T')[0],
            daysUntilRefill
          });
        }
      }
    }

    return prescriptionsNeedingRefill.sort((a, b) => a.daysUntilRefill - b.daysUntilRefill);
  }

  async getDashboardMetrics() {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // User Metrics
    const allUsers = Array.from(this.users.values());
    const totalUsers = allUsers.length;
    const newUsersThisWeek = allUsers.filter(u => u.createdAt && new Date(u.createdAt) >= oneWeekAgo).length;
    
    // Active users: users with active prescriptions or recent orders
    const activeUserIds = new Set<string>();
    Array.from(this.prescriptions.values())
      .filter(p => p.status === 'active')
      .forEach(p => activeUserIds.add(p.customerId));
    Array.from(this.orders.values())
      .filter(o => new Date(o.createdAt) >= oneMonthAgo)
      .forEach(o => activeUserIds.add(o.customerId));
    const activeUsers = activeUserIds.size;

    // Users by tier (Basic = incomplete/canceled/past_due, Plus = active subscription)
    const usersByTier = {
      basic: allUsers.filter(u => u.subscriptionStatus !== 'active').length,
      plus: allUsers.filter(u => u.subscriptionStatus === 'active').length
    };

    // Prescription Metrics
    const allPrescriptions = Array.from(this.prescriptions.values());
    const totalActivePrescriptions = allPrescriptions.filter(p => p.status === 'active').length;
    
    // Prescriptions needing refill (due within 7 days)
    let prescriptionsNeedingRefill = 0;
    for (const prescription of allPrescriptions) {
      if (prescription.status === 'active' && prescription.lastFillDate && prescription.daysSupply) {
        const lastFillDate = new Date(prescription.lastFillDate);
        const refillDueDate = new Date(lastFillDate);
        refillDueDate.setDate(lastFillDate.getDate() + prescription.daysSupply);
        const daysUntilRefill = Math.floor((refillDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilRefill <= 7 && daysUntilRefill >= 0) {
          prescriptionsNeedingRefill++;
        }
      }
    }

    const allPrescriptionRequests = Array.from(this.prescriptionRequests.values());
    const pendingPrescriptionRequests = allPrescriptionRequests.filter(r => r.status === 'pending').length;
    
    const prescriptionsByStatus: { [key: string]: number } = {};
    allPrescriptions.forEach(p => {
      prescriptionsByStatus[p.status] = (prescriptionsByStatus[p.status] || 0) + 1;
    });

    // Order Metrics
    const allOrders = Array.from(this.orders.values());
    const totalOrders = allOrders.length;
    const ordersThisMonth = allOrders.filter(o => new Date(o.createdAt) >= oneMonthAgo).length;
    
    const ordersByStatus: { [key: string]: number } = {};
    allOrders.forEach(o => {
      ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
    });

    const revenueEstimate = allOrders.reduce((sum, o) => sum + parseFloat(o.total.toString()), 0).toFixed(2);

    // Refill Metrics
    const allRefillRequests = Array.from(this.refillRequests.values());
    const totalRefillRequests = allRefillRequests.length;
    const pendingRefills = allRefillRequests.filter(r => r.status === 'pending').length;
    const urgentRefills = allRefillRequests.filter(r => r.priority === 'urgent' || r.priority === 'emergency').length;
    const refillsApprovedToday = allRefillRequests.filter(r => 
      r.status === 'approved' && new Date(r.approvedAt || '') >= startOfToday
    ).length;

    // Recent Activity
    const recentPrescriptionRequests = allPrescriptionRequests
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map(r => ({
        id: r.id,
        patientName: r.patientName,
        medicationName: r.medicationName,
        urgency: r.urgency,
        requestDate: r.requestDate
      }));

    const recentRefillRequests = allRefillRequests
      .sort((a, b) => new Date(b.requestedDate || b.createdAt).getTime() - new Date(a.requestedDate || a.createdAt).getTime())
      .slice(0, 10)
      .map(r => ({
        id: r.id,
        patientName: r.patientName || 'Unknown',
        medicationName: r.medicationName || 'Unknown',
        priority: r.priority || 'routine',
        requestedDate: r.requestedDate || r.createdAt
      }));

    const recentOrders = allOrders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: o.total.toString(),
        createdAt: o.createdAt
      }));

    return {
      userMetrics: {
        totalUsers,
        newUsersThisWeek,
        activeUsers,
        usersByTier
      },
      prescriptionMetrics: {
        totalActivePrescriptions,
        prescriptionsNeedingRefill,
        pendingPrescriptionRequests,
        prescriptionsByStatus
      },
      orderMetrics: {
        totalOrders,
        ordersThisMonth,
        ordersByStatus,
        revenueEstimate
      },
      refillMetrics: {
        totalRefillRequests,
        pendingRefills,
        urgentRefills,
        refillsApprovedToday
      },
      recentActivity: {
        recentPrescriptionRequests,
        recentRefillRequests,
        recentOrders
      }
    };
  }
}

export class DbStorage extends MemStorage {
  constructor() {
    super();
    // Clear in-memory users and medications to force database usage
    this.users.clear();
    this.medications.clear();
  }

  async initializeData(): Promise<void> {
    // Import pharmacy data
    await this.importDataOnStartup();
    
    // Seed test users if they don't exist
    await this.seedTestUsers();
  }

  async loadImportedMedications() {
    try {
      // Import medications from pharmacy CSV
      const { importMedicationsFromCSV } = await import('../scripts/import-pharmacy-csv');
      const medications = await importMedicationsFromCSV();
      
      // Save medications to database (not in-memory Map)
      for (const med of medications) {
        await this.createMedication(med);
      }
      
      console.log(`✅ Loaded ${medications.length} medications from pharmacy CSV to database`);
    } catch (error) {
      console.log('⚠️  Could not load pharmacy CSV medications:', error);
      console.log('Using sample medications only');
    }
  }
  
  private async seedTestUsers(): Promise<void> {
    try {
      // Create admin user if doesn't exist
      const existingAdmin = await this.getUserByEmail("seth@pillardrugclub.com");
      if (!existingAdmin) {
        const hashedAdminPassword = await bcrypt.hash("Spaceworm#25", 10);
        await db.insert(users).values({
          username: "seth@pillardrugclub.com",
          email: "seth@pillardrugclub.com",
          password: hashedAdminPassword,
          firstName: "Seth",
          lastName: "Admin",
          role: "admin",
          subscriptionStatus: "active",
          isActive: "true",
          smsConsent: "false",
        });
        console.log('✅ Admin user created: seth@pillardrugclub.com');
      }

      // Create SJC Pharmacy test user if doesn't exist
      const existingSjc = await this.getUserByEmail("sjcpharmacy@gmail.com");
      if (!existingSjc) {
        const hashedSjcPassword = await bcrypt.hash("password123", 10);
        await db.insert(users).values({
          username: "sjcpharmacy@gmail.com",
          email: "sjcpharmacy@gmail.com",
          password: hashedSjcPassword,
          firstName: "SJC",
          lastName: "Pharmacy",
          dateOfBirth: "04/21/1992",
          phoneNumber: "4238393523",
          role: "client",
          subscriptionStatus: "active",
          isActive: "true",
          smsConsent: "false",
        });
        console.log('✅ SJC Pharmacy test user created: sjcpharmacy@gmail.com');
      }
    } catch (error) {
      console.error('Error seeding test users:', error);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Hash password before storing
    const hashedPassword = insertUser.password 
      ? await bcrypt.hash(insertUser.password, 10)
      : null;
    
    const result = await db.insert(users).values({
      username: insertUser.email ?? null,
      email: insertUser.email ?? null,
      password: hashedPassword,
      firstName: insertUser.firstName ?? null,
      lastName: insertUser.lastName ?? null,
      dateOfBirth: insertUser.dateOfBirth ?? null,
      phoneNumber: insertUser.phoneNumber ?? null,
      smsConsent: insertUser.smsConsent ?? "false",
      role: "client",
    }).returning();
    return result[0];
  }

  async upsertUser(upsertUser: UpsertUser): Promise<User> {
    const existing = await this.getUserByEmail(upsertUser.email ?? "");
    if (existing) {
      const result = await db.update(users)
        .set({
          firstName: upsertUser.firstName ?? existing.firstName,
          lastName: upsertUser.lastName ?? existing.lastName,
          profileImageUrl: upsertUser.profileImageUrl ?? existing.profileImageUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existing.id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(users).values({
        id: upsertUser.id,
        email: upsertUser.email ?? null,
        firstName: upsertUser.firstName ?? null,
        lastName: upsertUser.lastName ?? null,
        profileImageUrl: upsertUser.profileImageUrl ?? null,
        username: upsertUser.email ?? null,
        role: "client",
      }).returning();
      return result[0];
    }
  }

  async updateUserStripeInfo(id: string, stripeCustomerId: string, stripeSubscriptionId: string | null): Promise<User | undefined> {
    const result = await db.update(users)
      .set({
        stripeCustomerId,
        stripeSubscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async updateSubscriptionStatus(id: string, status: "active" | "canceled" | "past_due" | "incomplete"): Promise<User | undefined> {
    const result = await db.update(users)
      .set({
        subscriptionStatus: status,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async updateUserPrimaryDoctor(id: string, doctor: { doctorId?: string; doctorName: string; doctorNpi?: string; doctorPhone?: string; doctorAddress?: any }): Promise<User | undefined> {
    const result = await db.update(users)
      .set({
        primaryDoctorId: doctor.doctorId ?? null,
        primaryDoctorName: doctor.doctorName,
        primaryDoctorNpi: doctor.doctorNpi ?? null,
        primaryDoctorPhone: doctor.doctorPhone ?? null,
        primaryDoctorAddress: doctor.doctorAddress ?? null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async updateUserAllergies(id: string, allergies: string[]): Promise<User | undefined> {
    const result = await db.update(users)
      .set({
        drugAllergies: allergies,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const result = await db.update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error(`User with id ${id} not found`);
    }
    return result[0];
  }

  async getAllUsers(filters?: { search?: string; role?: string; status?: string; page?: number; limit?: number }): Promise<{ users: User[]; total: number }> {
    // Get all users from database
    let allUsers = await db.select().from(users);
    
    // Apply search filter (search in name and email)
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      allUsers = allUsers.filter(user => 
        (user.firstName?.toLowerCase().includes(searchLower)) ||
        (user.lastName?.toLowerCase().includes(searchLower)) ||
        (user.email?.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply role filter
    if (filters?.role) {
      allUsers = allUsers.filter(user => user.role === filters.role);
    }
    
    // Apply status filter (subscription status)
    if (filters?.status) {
      allUsers = allUsers.filter(user => user.subscriptionStatus === filters.status);
    }
    
    const total = allUsers.length;
    
    // Apply pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedUsers = allUsers.slice(startIndex, endIndex);
    
    return { users: paginatedUsers, total };
  }
  
  // Order database methods
  async getUserOrders(userId: string): Promise<Order[]> {
    const result = await db.select().from(ordersTable).where(eq(ordersTable.userId, userId));
    return result.map(order => ({
      ...order,
      userId: order.userId as string,
      subtotal: order.subtotal.toString(),
      shippingCost: order.shippingCost.toString(),
      tax: order.tax.toString(),
      total: order.total.toString(),
      createdAt: order.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: order.updatedAt?.toISOString() || new Date().toISOString()
    })) as any[];
  }

  async getAllOrders(): Promise<Order[]> {
    const result = await db.select().from(ordersTable);
    return result.map(order => ({
      ...order,
      userId: order.userId as string,
      subtotal: order.subtotal.toString(),
      shippingCost: order.shippingCost.toString(),
      tax: order.tax.toString(),
      total: order.total.toString(),
      createdAt: order.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: order.updatedAt?.toISOString() || new Date().toISOString()
    })) as any[];
  }
  
  // Helper method to verify password
  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // Medication database methods
  async getMedication(id: string): Promise<Medication | undefined> {
    const result = await db.select().from(medicationsTable).where(eq(medicationsTable.id, id)).limit(1);
    if (!result[0]) return undefined;
    
    // Convert database types to application types
    return this.convertDBMedicationToAppMedication(result[0]);
  }

  async getMedicationByNdc(ndc: string): Promise<Medication | undefined> {
    const result = await db.select().from(medicationsTable).where(eq(medicationsTable.ndc, ndc)).limit(1);
    if (!result[0]) return undefined;
    
    return this.convertDBMedicationToAppMedication(result[0]);
  }

  async createMedication(insertMedication: InsertMedication): Promise<Medication> {
    const result = await db.insert(medicationsTable).values({
      ndc: insertMedication.ndc,
      name: insertMedication.name,
      genericName: insertMedication.genericName,
      brandName: insertMedication.brandName ?? null,
      strength: insertMedication.strength,
      dosageForm: insertMedication.dosageForm,
      manufacturer: insertMedication.manufacturer,
      category: insertMedication.category,
      description: insertMedication.description,
      price: String(insertMedication.price),
      wholesalePrice: String(insertMedication.wholesalePrice),
      annualPrice: insertMedication.annualPrice ? String(insertMedication.annualPrice) : null,
      dosesPerDay: insertMedication.dosesPerDay ? String(insertMedication.dosesPerDay) : null,
      isShortCourse: insertMedication.isShortCourse,
      fdaMetadata: insertMedication.fdaMetadata ?? null,
      inStock: insertMedication.inStock,
      quantity: insertMedication.quantity,
      requiresPrescription: insertMedication.requiresPrescription,
      controlledSubstance: insertMedication.controlledSubstance,
      imageUrl: insertMedication.imageUrl ?? null,
      sideEffects: insertMedication.sideEffects ?? [],
      warnings: insertMedication.warnings ?? [],
      interactions: insertMedication.interactions ?? [],
    }).returning();
    
    return this.convertDBMedicationToAppMedication(result[0]);
  }

  async updateMedication(id: string, updateData: Partial<InsertMedication>): Promise<Medication | undefined> {
    // Build update object with proper type conversions for database
    const dbUpdateData: any = {};
    
    if (updateData.price !== undefined) {
      dbUpdateData.price = String(updateData.price);
    }
    if (updateData.wholesalePrice !== undefined) {
      dbUpdateData.wholesalePrice = String(updateData.wholesalePrice);
    }
    if (updateData.annualPrice !== undefined) {
      dbUpdateData.annualPrice = String(updateData.annualPrice);
    }
    if (updateData.name !== undefined) {
      dbUpdateData.name = updateData.name;
    }
    if (updateData.genericName !== undefined) {
      dbUpdateData.genericName = updateData.genericName;
    }
    if (updateData.brandName !== undefined) {
      dbUpdateData.brandName = updateData.brandName;
    }
    if (updateData.strength !== undefined) {
      dbUpdateData.strength = updateData.strength;
    }
    if (updateData.dosageForm !== undefined) {
      dbUpdateData.dosageForm = updateData.dosageForm;
    }
    if (updateData.manufacturer !== undefined) {
      dbUpdateData.manufacturer = updateData.manufacturer;
    }
    if (updateData.category !== undefined) {
      dbUpdateData.category = updateData.category;
    }
    if (updateData.description !== undefined) {
      dbUpdateData.description = updateData.description;
    }
    if (updateData.inStock !== undefined) {
      dbUpdateData.inStock = updateData.inStock;
    }
    if (updateData.quantity !== undefined) {
      dbUpdateData.quantity = updateData.quantity;
    }
    if (updateData.dosesPerDay !== undefined) {
      dbUpdateData.dosesPerDay = String(updateData.dosesPerDay);
    }
    if (updateData.isShortCourse !== undefined) {
      dbUpdateData.isShortCourse = updateData.isShortCourse;
    }
    
    // Always update the updatedAt timestamp
    dbUpdateData.updatedAt = new Date();
    
    const result = await db.update(medicationsTable)
      .set(dbUpdateData)
      .where(eq(medicationsTable.id, id))
      .returning();
    
    if (!result[0]) return undefined;
    
    return this.convertDBMedicationToAppMedication(result[0]);
  }

  async searchMedications(params: MedicationSearch): Promise<{ medications: Medication[]; total: number }> {
    // Build query with filters
    let query = db.select().from(medicationsTable);
    
    // Note: For a production app, you'd want to use proper SQL filtering
    // For now, we'll get all and filter in memory (same as MemStorage)
    const allMedications = await query;
    const convertedMeds = allMedications.map(med => this.convertDBMedicationToAppMedication(med));
    
    // Apply filters (same logic as MemStorage)
    let filteredMeds = convertedMeds;
    
    if (params.query) {
      const searchTerm = params.query.toLowerCase();
      filteredMeds = filteredMeds.filter(med =>
        med.name.toLowerCase().includes(searchTerm) ||
        med.genericName.toLowerCase().includes(searchTerm) ||
        (med.brandName && med.brandName.toLowerCase().includes(searchTerm)) ||
        med.category.toLowerCase().includes(searchTerm)
      );
    }

    if (params.category) {
      filteredMeds = filteredMeds.filter(med => med.category === params.category);
    }

    if (params.minPrice !== undefined) {
      filteredMeds = filteredMeds.filter(med => med.wholesalePrice >= params.minPrice!);
    }

    if (params.maxPrice !== undefined) {
      filteredMeds = filteredMeds.filter(med => med.wholesalePrice <= params.maxPrice!);
    }

    if (params.inStockOnly) {
      filteredMeds = filteredMeds.filter(med => med.inStock && med.quantity > 0);
    }

    if (params.requiresPrescription !== undefined) {
      filteredMeds = filteredMeds.filter(med => med.requiresPrescription === params.requiresPrescription);
    }

    const total = filteredMeds.length;
    const offset = (params.page - 1) * params.limit;
    const paginatedMeds = filteredMeds.slice(offset, offset + params.limit);

    return { medications: paginatedMeds, total };
  }

  private convertDBMedicationToAppMedication(dbMed: any): Medication {
    return {
      id: dbMed.id,
      ndc: dbMed.ndc,
      name: dbMed.name,
      genericName: dbMed.genericName,
      brandName: dbMed.brandName ?? undefined,
      strength: dbMed.strength,
      dosageForm: dbMed.dosageForm,
      manufacturer: dbMed.manufacturer,
      category: dbMed.category,
      description: dbMed.description,
      price: parseFloat(dbMed.price),
      wholesalePrice: parseFloat(dbMed.wholesalePrice),
      annualPrice: dbMed.annualPrice ? parseFloat(dbMed.annualPrice) : undefined,
      dosesPerDay: dbMed.dosesPerDay ? parseFloat(dbMed.dosesPerDay) : undefined,
      isShortCourse: dbMed.isShortCourse,
      fdaMetadata: dbMed.fdaMetadata ?? undefined,
      inStock: dbMed.inStock,
      quantity: dbMed.quantity,
      requiresPrescription: dbMed.requiresPrescription,
      controlledSubstance: dbMed.controlledSubstance,
      imageUrl: dbMed.imageUrl ?? undefined,
      sideEffects: dbMed.sideEffects ?? [],
      warnings: dbMed.warnings ?? [],
      interactions: dbMed.interactions ?? [],
      createdAt: dbMed.createdAt.toISOString(),
      updatedAt: dbMed.updatedAt.toISOString(),
    };
  }

  async getDashboardMetrics() {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // User Metrics - fetch from database instead of in-memory Map
    const allUsers = await db.select().from(users);
    const totalUsers = allUsers.length;
    const newUsersThisWeek = allUsers.filter(u => u.createdAt && new Date(u.createdAt) >= oneWeekAgo).length;
    
    // Active users: users with active prescriptions or recent orders
    const activeUserIds = new Set<string>();
    Array.from(this.prescriptions.values())
      .filter(p => p.status === 'active')
      .forEach(p => activeUserIds.add(p.customerId));
    Array.from(this.orders.values())
      .filter(o => new Date(o.createdAt) >= oneMonthAgo)
      .forEach(o => activeUserIds.add(o.customerId));
    const activeUsers = activeUserIds.size;

    // Users by tier (Basic = incomplete/canceled/past_due, Plus = active subscription)
    const usersByTier = {
      basic: allUsers.filter(u => u.subscriptionStatus !== 'active').length,
      plus: allUsers.filter(u => u.subscriptionStatus === 'active').length
    };

    // Prescription Metrics - use in-memory Maps
    const allPrescriptions = Array.from(this.prescriptions.values());
    const totalActivePrescriptions = allPrescriptions.filter(p => p.status === 'active').length;
    
    // Prescriptions needing refill (due within 7 days)
    let prescriptionsNeedingRefill = 0;
    for (const prescription of allPrescriptions) {
      if (prescription.status === 'active' && prescription.lastFillDate && prescription.daysSupply) {
        const lastFillDate = new Date(prescription.lastFillDate);
        const refillDueDate = new Date(lastFillDate);
        refillDueDate.setDate(lastFillDate.getDate() + prescription.daysSupply);
        const daysUntilRefill = Math.floor((refillDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilRefill <= 7 && daysUntilRefill >= 0) {
          prescriptionsNeedingRefill++;
        }
      }
    }

    const allPrescriptionRequests = Array.from(this.prescriptionRequests.values());
    const pendingPrescriptionRequests = allPrescriptionRequests.filter(r => r.status === 'pending').length;
    
    const prescriptionsByStatus: { [key: string]: number } = {};
    allPrescriptions.forEach(p => {
      prescriptionsByStatus[p.status] = (prescriptionsByStatus[p.status] || 0) + 1;
    });

    // Order Metrics
    const allOrders = Array.from(this.orders.values());
    const totalOrders = allOrders.length;
    const ordersThisMonth = allOrders.filter(o => new Date(o.createdAt) >= oneMonthAgo).length;
    
    const ordersByStatus: { [key: string]: number } = {};
    allOrders.forEach(o => {
      ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
    });

    const revenueEstimate = allOrders.reduce((sum, o) => sum + parseFloat(o.total.toString()), 0).toFixed(2);

    // Refill Metrics
    const allRefillRequests = Array.from(this.refillRequests.values());
    const totalRefillRequests = allRefillRequests.length;
    const pendingRefills = allRefillRequests.filter(r => r.status === 'pending').length;
    const urgentRefills = allRefillRequests.filter(r => r.priority === 'urgent' || r.priority === 'emergency').length;
    const refillsApprovedToday = allRefillRequests.filter(r => 
      r.status === 'approved' && new Date(r.approvedAt || '') >= startOfToday
    ).length;

    // Recent Activity
    const recentPrescriptionRequests = allPrescriptionRequests
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map(r => ({
        id: r.id,
        patientName: r.patientName,
        medicationName: r.medicationName,
        urgency: r.urgency,
        requestDate: r.requestDate
      }));

    const recentRefillRequests = allRefillRequests
      .sort((a, b) => new Date(b.requestedDate || b.createdAt).getTime() - new Date(a.requestedDate || a.createdAt).getTime())
      .slice(0, 10)
      .map(r => ({
        id: r.id,
        patientName: r.patientName || 'Unknown',
        medicationName: r.medicationName || 'Unknown',
        priority: r.priority || 'routine',
        requestedDate: r.requestedDate || r.createdAt
      }));

    const recentOrders = allOrders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: o.total.toString(),
        createdAt: o.createdAt
      }));

    return {
      userMetrics: {
        totalUsers,
        newUsersThisWeek,
        activeUsers,
        usersByTier
      },
      prescriptionMetrics: {
        totalActivePrescriptions,
        prescriptionsNeedingRefill,
        pendingPrescriptionRequests,
        prescriptionsByStatus
      },
      orderMetrics: {
        totalOrders,
        ordersThisMonth,
        ordersByStatus,
        revenueEstimate
      },
      refillMetrics: {
        totalRefillRequests,
        pendingRefills,
        urgentRefills,
        refillsApprovedToday
      },
      recentActivity: {
        recentPrescriptionRequests,
        recentRefillRequests,
        recentOrders
      }
    };
  }
}

export const storage = new DbStorage();
