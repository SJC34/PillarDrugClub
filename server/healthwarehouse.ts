/**
 * HealthWarehouse Partner API Integration
 * API Version: 2025.01.01
 * Documentation: HealthWarehouse Partner API - 2025.01.01
 */

interface HWAddress {
  prefix?: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  suffix?: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  phone: string;
  phone_evening?: string;
  fax?: string;
  label?: string;
}

interface HWCustomer {
  id?: number;
  prefix?: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  suffix?: string;
  email?: string;
  gender?: "male" | "female";
  dob?: string; // YYYY-MM-DD
  billing_addresses: HWAddress[];
  shipping_addresses: HWAddress[];
  metadata?: {
    partner_customer_id?: string;
  };
}

interface HWPatient {
  id?: number;
  customer_id?: number;
  prefix?: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  suffix?: string;
  email?: string;
  gender?: "male" | "female";
  dob?: string; // YYYY-MM-DD
  shipping_address?: HWAddress;
  metadata?: {
    partner_patient_id?: string;
  };
}

interface HWPrescription {
  patient_info: {
    first_name: string;
    middle_name?: string;
    last_name: string;
    dob: string; // YYYY-MM-DD
    gender?: "male" | "female";
  };
  medication: {
    name: string;
    strength?: string;
    dosage_form?: string;
    quantity: number;
    days_supply?: number;
    refills?: number;
    directions?: string;
  };
  prescriber: {
    first_name: string;
    last_name: string;
    npi?: string;
    phone?: string;
    fax?: string;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
  };
}

interface HWTransfer {
  pharmacy: {
    name: string;
    phone: string;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
  };
  prescriber?: {
    first_name?: string;
    last_name?: string;
    npi?: string;
  };
  rx_number?: string;
}

interface HWLineItem {
  product_id: number; // Test: 100-102 for Rx, 200-202 for OTC
  quantity: number;
  patient_id?: number; // Required for Rx products if not set on order level
  prescription?: HWPrescription; // For new prescriptions
  transfer?: HWTransfer; // For prescription transfers
}

interface HWOrder {
  id?: number;
  order_number?: string;
  customer_id?: number;
  patient_id?: number; // Required for all Rx products if not set per line item
  line_items: HWLineItem[];
  status?: "processing" | "transfer_success" | "transfer_failure" | "dispensed" | "complete" | "canceled";
  metadata?: {
    partner_order_id?: string;
  };
  customer?: HWCustomer; // For nested API call
  patient?: HWPatient; // For nested API call
}

interface HWShipment {
  id: number;
  order_id: number;
  tracking_number: string;
  carrier: string;
  status: string;
  shipped_date?: string;
  estimated_delivery_date?: string;
  actual_delivery_date?: string;
  tracking_events?: Array<{
    timestamp: string;
    status: string;
    location?: string;
    description?: string;
  }>;
}

interface HWOrderNotification {
  order_id: number;
  status: string;
  comments?: string;
  timestamp: string;
}

interface HWShipmentNotification {
  shipment_id: number;
  order_id: number;
  tracking_number: string;
  carrier: string;
  status: string;
  tracking_events: Array<{
    timestamp: string;
    status: string;
    location?: string;
    description?: string;
  }>;
}

class HealthWarehouseAPI {
  private baseURL: string;
  private apiKey: string;

  constructor() {
    this.baseURL = process.env.HEALTHWAREHOUSE_BASE_URL || "https://partners.healthwarehouse.com";
    this.apiKey = process.env.HEALTHWAREHOUSE_API_KEY || "";
    
    if (!this.apiKey) {
      console.warn("⚠️  HealthWarehouse API key not configured. Set HEALTHWAREHOUSE_API_KEY environment variable.");
    }
  }

  private async request<T>(
    endpoint: string,
    options: {
      method?: string;
      body?: any;
    } = {}
  ): Promise<T> {
    const { method = "GET", body } = options;

    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "PillarDrugClub/1.0",
    };

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (body && (method === "POST" || method === "PUT")) {
      fetchOptions.body = JSON.stringify(body);
    }

    console.log(`📡 HealthWarehouse API: ${method} ${endpoint}`);

    try {
      const response = await fetch(url, fetchOptions);
      const data = await response.json();

      if (!response.ok) {
        console.error(`❌ HealthWarehouse API Error (${response.status}):`, data);
        throw new Error(data.message || `HealthWarehouse API error: ${response.status}`);
      }

      console.log(`✅ HealthWarehouse API: ${method} ${endpoint} succeeded`);
      return data;
    } catch (error: any) {
      console.error(`❌ HealthWarehouse API request failed:`, error);
      throw error;
    }
  }

  /**
   * Create a new customer
   */
  async createCustomer(customer: HWCustomer): Promise<{ customer: HWCustomer }> {
    return this.request("/v1/customers", {
      method: "POST",
      body: { customer },
    });
  }

  /**
   * Get an existing customer by ID
   */
  async getCustomer(customerId: number): Promise<{ customer: HWCustomer }> {
    return this.request(`/v1/customers/${customerId}`);
  }

  /**
   * Update an existing customer
   */
  async updateCustomer(customerId: number, customer: Partial<HWCustomer>): Promise<{ customer: HWCustomer }> {
    return this.request(`/v1/customers/${customerId}`, {
      method: "POST",
      body: { customer },
    });
  }

  /**
   * Create a new patient
   */
  async createPatient(patient: HWPatient): Promise<{ patient: HWPatient }> {
    return this.request("/v1/patients", {
      method: "POST",
      body: { patient },
    });
  }

  /**
   * Create a patient with nested customer creation
   */
  async createPatientWithCustomer(patient: HWPatient & { customer: HWCustomer }): Promise<{ patient: HWPatient; customer: HWCustomer }> {
    return this.request("/v1/patients", {
      method: "POST",
      body: { patient },
    });
  }

  /**
   * Get an existing patient by ID
   */
  async getPatient(patientId: number): Promise<{ patient: HWPatient }> {
    return this.request(`/v1/patients/${patientId}`);
  }

  /**
   * Update an existing patient
   */
  async updatePatient(patientId: number, patient: Partial<HWPatient>): Promise<{ patient: HWPatient }> {
    return this.request(`/v1/patients/${patientId}`, {
      method: "POST",
      body: { patient },
    });
  }

  /**
   * Create a new order
   */
  async createOrder(order: HWOrder): Promise<{ orders: HWOrder[] }> {
    return this.request("/v1/orders", {
      method: "POST",
      body: { order },
    });
  }

  /**
   * Create an order with nested customer/patient creation
   * This is the most convenient method for creating a complete order in one API call
   */
  async createOrderWithCustomerAndPatient(order: HWOrder): Promise<{ orders: HWOrder[]; customer?: HWCustomer; patient?: HWPatient }> {
    return this.request("/v1/orders", {
      method: "POST",
      body: { order },
    });
  }

  /**
   * Get an existing order by ID
   */
  async getOrder(orderId: number): Promise<{ order: HWOrder }> {
    return this.request(`/v1/orders/${orderId}`);
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: number): Promise<{ order: HWOrder }> {
    return this.request(`/v1/orders/${orderId}/cancel`, {
      method: "POST",
    });
  }

  /**
   * Get shipments for an order
   */
  async getShipments(orderId: number): Promise<{ shipments: HWShipment[] }> {
    return this.request(`/v1/orders/${orderId}/shipments`);
  }

  /**
   * Simulate order fulfillment in test environment
   * Advances order through workflow: processing → dispensed → complete
   */
  async simulateOrderFulfillment(orderId: number): Promise<{ order: HWOrder }> {
    return this.request(`/v1/test/orders/${orderId}/advance`, {
      method: "POST",
    });
  }

  /**
   * Helper: Convert Pillar user to HealthWarehouse customer format
   */
  static userToCustomer(user: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    dateOfBirth?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
    userAddress?: any;
  }): HWCustomer {
    const address = user.userAddress || {};
    
    const hwAddress: HWAddress = {
      first_name: user.firstName || "Unknown",
      last_name: user.lastName || "User",
      address1: address.street || "123 Main St",
      city: address.city || "Florence",
      state: address.state || "KY",
      country: "US",
      postal_code: address.zipCode || "41042",
      phone: user.phoneNumber || "555-555-5555",
    };

    return {
      first_name: user.firstName || "Unknown",
      last_name: user.lastName || "User",
      email: user.email || undefined,
      dob: user.dateOfBirth || undefined,
      billing_addresses: [{ ...hwAddress, label: "Billing Address" }],
      shipping_addresses: [{ ...hwAddress, label: "Shipping Address" }],
      metadata: {
        partner_customer_id: user.id,
      },
    };
  }

  /**
   * Helper: Convert Pillar user to HealthWarehouse patient format
   */
  static userToPatient(user: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    dateOfBirth?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
    userAddress?: any;
    hwCustomerId?: number | null;
  }): HWPatient {
    const address = user.userAddress || {};
    
    const hwAddress: HWAddress = {
      first_name: user.firstName || "Unknown",
      last_name: user.lastName || "User",
      address1: address.street || "123 Main St",
      city: address.city || "Florence",
      state: address.state || "KY",
      country: "US",
      postal_code: address.zipCode || "41042",
      phone: user.phoneNumber || "555-555-5555",
    };

    return {
      customer_id: user.hwCustomerId || undefined,
      first_name: user.firstName || "Unknown",
      last_name: user.lastName || "User",
      email: user.email || undefined,
      dob: user.dateOfBirth || undefined,
      shipping_address: hwAddress,
      metadata: {
        partner_patient_id: user.id,
      },
    };
  }
}

export const healthWarehouseAPI = new HealthWarehouseAPI();
export type { 
  HWCustomer, 
  HWPatient, 
  HWOrder, 
  HWLineItem, 
  HWShipment, 
  HWAddress,
  HWPrescription,
  HWTransfer,
  HWOrderNotification,
  HWShipmentNotification
};
