import { type User, type InsertUser } from "@shared/schema";
import { 
  type Customer, type InsertCustomer,
  type Medication, type InsertMedication, type MedicationSearch,
  type Prescription, type InsertPrescription,
  type Order, type InsertOrder, type OrderSearch,
  type Shipment, type InsertShipment,
  type Prescriber, type InsertPrescriber
} from "@shared/pharmacy-schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private customers: Map<string, Customer>;
  private medications: Map<string, Medication>;
  private prescriptions: Map<string, Prescription>;
  private orders: Map<string, Order>;
  private shipments: Map<string, Shipment>;
  private prescribers: Map<string, Prescriber>;
  private orderCounter: number;

  constructor() {
    this.users = new Map();
    this.customers = new Map();
    this.medications = new Map();
    this.prescriptions = new Map();
    this.orders = new Map();
    this.shipments = new Map();
    this.prescribers = new Map();
    this.orderCounter = 1000;
    this.seedMockData();
  }

  private seedMockData() {
    // Add some sample medications
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
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
}

export const storage = new MemStorage();
