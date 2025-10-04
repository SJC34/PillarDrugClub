import { type User, type InsertUser, type UpsertUser } from "@shared/schema";
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

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>; // For Replit OAuth
  updateUserStripeInfo(id: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User | undefined>;
  updateSubscriptionStatus(id: string, status: "active" | "canceled" | "past_due" | "incomplete"): Promise<User | undefined>;
  updateUserPrimaryDoctor(id: string, doctor: { doctorId?: string; doctorName: string; doctorNpi?: string; doctorPhone?: string; doctorAddress?: any }): Promise<User | undefined>;

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
  getCustomerPrescriptions(customerId: string): Promise<Prescription[]>;
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  updatePrescription(id: string, prescription: Partial<InsertPrescription>): Promise<Prescription | undefined>;

  // Orders
  getOrder(id: string): Promise<Order | undefined>;
  getOrderByNumber(orderNumber: string): Promise<Order | undefined>;
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private customers: Map<string, Customer>;
  private medications: Map<string, Medication>;
  private prescriptions: Map<string, Prescription>;
  private orders: Map<string, Order>;
  private shipments: Map<string, Shipment>;
  private prescribers: Map<string, Prescriber>;
  private pharmacies: Map<string, Pharmacy>;
  private prescriptionRequests: Map<string, PrescriptionRequest>;
  private orderCounter: number;

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
    this.orderCounter = 1000;
    this.seedMockData();
    this.importDataOnStartup();
  }

  private seedMockData() {
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

    // Create admin user
    const adminId = randomUUID();
    const now = new Date().toISOString();
    const adminUser: User = {
      id: adminId,
      username: "seth@pillardrugclub.com",
      email: "seth@pillardrugclub.com",
      password: "Spaceworm#25",
      firstName: "Seth",
      lastName: "Admin",
      phoneNumber: null,
      smsConsent: "false",
      role: "admin",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionStatus: "active",
      isActive: "true",
      createdAt: now,
      updatedAt: now
    };
    this.users.set(adminId, adminUser);
    console.log('✅ Admin user created: seth@pillardrugclub.com');
  }

  async loadImportedMedications() {
    try {
      // Import medications from Excel file after server startup
      const { importMedicationsFromExcel } = await import('../scripts/import-medications');
      await importMedicationsFromExcel();
      console.log(`✅ Loaded medications: ${this.medications.size} total`);
    } catch (error) {
      console.log('⚠️  Could not load imported medications:', error);
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
    const now = new Date().toISOString();
    const user: User = { 
      id,
      username: insertUser.email, // Use email as username for simplicity
      email: insertUser.email,
      password: insertUser.password, // In production, this should be hashed
      firstName: insertUser.firstName,
      lastName: insertUser.lastName,
      profileImageUrl: null,
      phoneNumber: insertUser.phoneNumber || null,
      smsConsent: insertUser.smsConsent || "false",
      role: "client",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionStatus: "incomplete",
      isActive: "true",
      createdAt: now,
      updatedAt: now
    };
    this.users.set(id, user);
    return user;
  }

  async upsertUser(upsertData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(upsertData.id);
    const now = new Date().toISOString();
    
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
      this.users.set(upsertData.id, updated);
      return updated;
    } else {
      // Create new user from OAuth
      const newUser: User = {
        id: upsertData.id,
        username: upsertData.email || null,
        email: upsertData.email || null,
        password: null, // OAuth users don't have passwords
        firstName: upsertData.firstName || null,
        lastName: upsertData.lastName || null,
        profileImageUrl: upsertData.profileImageUrl || null,
        phoneNumber: null,
        smsConsent: "false",
        role: "client",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionStatus: "incomplete",
        isActive: "true",
        createdAt: now,
        updatedAt: now
      };
      this.users.set(upsertData.id, newUser);
      return newUser;
    }
  }

  async updateUserStripeInfo(id: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = {
      ...user,
      stripeCustomerId,
      stripeSubscriptionId,
      subscriptionStatus: "active" as const,
      updatedAt: new Date().toISOString()
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
      updatedAt: new Date().toISOString()
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
      updatedAt: new Date().toISOString()
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
      primaryDoctorId: doctor.doctorId,
      primaryDoctorName: doctor.doctorName,
      primaryDoctorNpi: doctor.doctorNpi,
      primaryDoctorPhone: doctor.doctorPhone,
      primaryDoctorAddress: doctor.doctorAddress,
      updatedAt: new Date().toISOString()
    };
    this.users.set(id, updatedUser);
    return updatedUser;
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

  async getCustomerPrescriptions(customerId: string): Promise<Prescription[]> {
    return Array.from(this.prescriptions.values()).filter(
      (prescription) => prescription.customerId === customerId,
    );
  }

  async createPrescription(insertPrescription: InsertPrescription): Promise<Prescription> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const prescription: Prescription = { 
      ...insertPrescription, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.prescriptions.set(id, prescription);
    return prescription;
  }

  async updatePrescription(id: string, updateData: Partial<InsertPrescription>): Promise<Prescription | undefined> {
    const prescription = this.prescriptions.get(id);
    if (!prescription) return undefined;
    
    const updated: Prescription = {
      ...prescription,
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    this.prescriptions.set(id, updated);
    return updated;
  }

  // Order methods
  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    return Array.from(this.orders.values()).find(
      (order) => order.orderNumber === orderNumber,
    );
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

  private async importDataOnStartup(): Promise<void> {
    // Import prescribers and pharmacies on startup
    console.log('🔄 Starting initial data import...');
    
    try {
      await this.importInitialPrescribers();
      await this.importInitialPharmacies();
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
}

export const storage = new MemStorage();
