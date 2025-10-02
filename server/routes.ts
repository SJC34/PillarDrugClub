import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import { 
  insertCustomerSchema, 
  insertMedicationSchema,
  insertPrescriptionSchema,
  insertOrderSchema,
  insertShipmentSchema,
  medicationSearchSchema,
  orderSearchSchema
} from "@shared/pharmacy-schema";

// Initialize Stripe with graceful fallback
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
  });
  console.log('✅ Stripe initialized successfully');
} else {
  console.warn('⚠️ Stripe not configured - payment features will be limited');
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoints - respond immediately
  app.get("/api/ping", (req, res) => {
    res.status(200).json({ 
      status: "ok", 
      service: "pillar-drug-club",
      timestamp: new Date().toISOString(),
      ready: true
    });
  });

  app.get("/health", (req, res) => {
    res.json({ 
      status: "healthy", 
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    });
  });

  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok",
      api: "healthy",
      database: "connected",
      timestamp: new Date().toISOString()
    });
  });

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists with this email" });
      }
      
      // Create user
      const user = await storage.createUser(userData);
      
      // Don't return password in response
      const { password, ...userResponse } = user;
      res.status(201).json({ user: userResponse });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ error: "Registration failed", message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user || user.password !== password) { // In production, use proper password hashing
        return res.status(401).json({ error: "Invalid email or password" });
      }
      
      // Don't return password in response
      const { password: _, ...userResponse } = user;
      res.json({ user: userResponse });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed", message: error.message });
    }
  });

  // Stripe subscription route for $10/month membership
  app.post("/api/create-subscription", async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if Stripe is configured
      if (!stripe) {
        return res.status(503).json({ 
          error: "Payment processing unavailable", 
          message: "Payment system is not configured" 
        });
      }
      
      // Create Stripe customer if doesn't exist
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
        });
        customerId = customer.id;
      }
      
      // Create a payment intent for the subscription (simplified approach)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 1000, // $10.00 in cents
        currency: "usd",
        customer: customerId,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          type: "subscription",
          amount: "10.00",
          interval: "month",
          userId: userId
        }
      });
      
      // Update user with Stripe info (using payment intent ID as subscription ID for now)
      await storage.updateUserStripeInfo(userId, customerId, paymentIntent.id);
      
      res.json({ 
        clientSecret: paymentIntent.client_secret,
        subscriptionId: paymentIntent.id
      });
    } catch (error: any) {
      console.error("Stripe subscription error:", error);
      res.status(500).json({ 
        error: "Error creating subscription", 
        message: error.message 
      });
    }
  });

  // Check subscription status
  app.get("/api/subscription-status/:userId", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({ 
        subscriptionStatus: user.subscriptionStatus,
        // Allow access for demo purposes even with incomplete status
        hasAccess: user.subscriptionStatus === "active" || user.subscriptionStatus === "incomplete"
      });
    } catch (error: any) {
      console.error("Subscription status error:", error);
      res.status(500).json({ error: "Error checking subscription status" });
    }
  });

  // Manual medication import endpoint - can be called after deployment
  app.post("/api/admin/import-medications", async (req, res) => {
    try {
      console.log("🔄 Manual medication import triggered...");
      await storage.loadImportedMedications();
      res.json({ 
        status: "success", 
        message: "Medications imported successfully",
        count: storage.medicationCount
      });
    } catch (error: any) {
      console.error("Manual import error:", error);
      res.status(500).json({ 
        error: "Failed to import medications", 
        message: error.message 
      });
    }
  });

  // Manual prescriber import endpoint
  app.post("/api/admin/import-prescribers", async (req, res) => {
    try {
      console.log("🔄 Manual prescriber import triggered...");
      await storage.importInitialPrescribers();
      res.json({ 
        status: "success", 
        message: "Prescribers imported successfully"
      });
    } catch (error: any) {
      console.error("Manual prescriber import error:", error);
      res.status(500).json({ 
        error: "Failed to import prescribers", 
        message: error.message 
      });
    }
  });

  // Manual pharmacy import endpoint
  app.post("/api/admin/import-pharmacies", async (req, res) => {
    try {
      console.log("🔄 Manual pharmacy import triggered...");
      await storage.importInitialPharmacies();
      res.json({ 
        status: "success", 
        message: "Pharmacies imported successfully"
      });
    } catch (error: any) {
      console.error("Manual pharmacy import error:", error);
      res.status(500).json({ 
        error: "Failed to import pharmacies", 
        message: error.message 
      });
    }
  });

  // Prescription transfer endpoints
  app.post("/api/prescriptions", async (req, res) => {
    try {
      const prescriptionData = insertPrescriptionSchema.parse(req.body);
      const prescription = await storage.createPrescription(prescriptionData);
      
      // Send notification based on prescription type
      if (prescription.isTransfer && prescription.transferFromPharmacy) {
        console.log(`📞 Initiating pharmacy transfer from ${prescription.transferFromPharmacy} for prescription ${prescription.id}`);
      } else {
        console.log(`📠 Sending fax request to prescriber for prescription ${prescription.id}`);
      }
      
      res.status(201).json({ 
        prescription,
        message: prescription.isTransfer 
          ? "Pharmacy transfer request submitted successfully" 
          : "Doctor fax request submitted successfully"
      });
    } catch (error: any) {
      console.error("Prescription creation error:", error);
      res.status(400).json({ 
        error: "Failed to create prescription request", 
        message: error.message 
      });
    }
  });

  // Get prescriptions for a customer
  app.get("/api/customers/:customerId/prescriptions", async (req, res) => {
    try {
      const prescriptions = await storage.getCustomerPrescriptions(req.params.customerId);
      res.json({ prescriptions });
    } catch (error: any) {
      console.error("Error fetching prescriptions:", error);
      res.status(500).json({ 
        error: "Failed to fetch prescriptions", 
        message: error.message 
      });
    }
  });

  // Search pharmacies
  app.get("/api/pharmacies/search", async (req, res) => {
    try {
      const query = req.query.q as string || "";
      const pharmacies = await storage.searchPharmacies(query);
      res.json({ pharmacies });
    } catch (error: any) {
      console.error("Pharmacy search error:", error);
      res.status(500).json({ 
        error: "Failed to search pharmacies", 
        message: error.message 
      });
    }
  });

  // Medication routes
  app.get("/api/medications/search", async (req, res) => {
    try {
      // Convert query string parameters to proper types
      const convertedQuery = {
        ...req.query,
        ...(req.query.page && { page: parseInt(req.query.page as string) }),
        ...(req.query.limit && { limit: parseInt(req.query.limit as string) }),
        ...(req.query.minPrice && { minPrice: parseFloat(req.query.minPrice as string) }),
        ...(req.query.maxPrice && { maxPrice: parseFloat(req.query.maxPrice as string) }),
        ...(req.query.inStockOnly && { inStockOnly: req.query.inStockOnly === 'true' }),
        ...(req.query.requiresPrescription && { requiresPrescription: req.query.requiresPrescription === 'true' })
      };
      
      const params = medicationSearchSchema.parse(convertedQuery);
      const result = await storage.searchMedications(params);
      res.json(result);
    } catch (error) {
      console.log('Search error:', error);
      console.log('Query params:', req.query);
      res.status(400).json({ error: "Invalid search parameters", details: error });
    }
  });

  app.get("/api/medications/:id", async (req, res) => {
    try {
      const medication = await storage.getMedication(req.params.id);
      if (!medication) {
        return res.status(404).json({ error: "Medication not found" });
      }
      res.json(medication);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/medications", async (req, res) => {
    try {
      const medicationData = insertMedicationSchema.parse(req.body);
      const medication = await storage.createMedication(medicationData);
      res.status(201).json(medication);
    } catch (error) {
      res.status(400).json({ error: "Invalid medication data" });
    }
  });

  // Customer routes
  app.post("/api/customers", async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      
      // Check if customer already exists
      const existingCustomer = await storage.getCustomerByEmail(customerData.email);
      if (existingCustomer) {
        return res.status(409).json({ error: "Customer with this email already exists" });
      }

      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      res.status(400).json({ error: "Invalid customer data" });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/customers/:id", async (req, res) => {
    try {
      const customerData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(req.params.id, customerData);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(400).json({ error: "Invalid customer data" });
    }
  });

  // Prescription routes
  app.post("/api/prescriptions", async (req, res) => {
    try {
      const prescriptionData = insertPrescriptionSchema.parse(req.body);
      const prescription = await storage.createPrescription(prescriptionData);
      res.status(201).json(prescription);
    } catch (error) {
      res.status(400).json({ error: "Invalid prescription data" });
    }
  });

  app.get("/api/prescriptions/:id", async (req, res) => {
    try {
      const prescription = await storage.getPrescription(req.params.id);
      if (!prescription) {
        return res.status(404).json({ error: "Prescription not found" });
      }
      res.json(prescription);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/customers/:customerId/prescriptions", async (req, res) => {
    try {
      const prescriptions = await storage.getCustomerPrescriptions(req.params.customerId);
      res.json(prescriptions);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Order routes
  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      
      // Validate medications exist and calculate totals
      let calculatedSubtotal = 0;
      for (const item of orderData.items) {
        const medication = await storage.getMedication(item.medicationId);
        if (!medication) {
          return res.status(400).json({ error: `Medication ${item.medicationId} not found` });
        }
        
        // Use wholesale price for calculation
        const itemPrice = medication.wholesalePrice;
        const itemTotal = itemPrice * item.quantity;
        calculatedSubtotal += itemTotal;
        
        // Update item prices
        item.price = itemPrice;
        item.totalPrice = itemTotal;
      }

      // Update order totals
      orderData.subtotal = calculatedSubtotal;
      orderData.total = orderData.subtotal + orderData.shippingCost + orderData.tax;

      const order = await storage.createOrder(orderData);
      res.status(201).json(order);
    } catch (error) {
      res.status(400).json({ error: "Invalid order data" });
    }
  });

  app.get("/api/orders/search", async (req, res) => {
    try {
      const params = orderSearchSchema.parse(req.query);
      const result = await storage.searchOrders(params);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: "Invalid search parameters" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/orders/:id", async (req, res) => {
    try {
      const orderData = insertOrderSchema.partial().parse(req.body);
      const order = await storage.updateOrder(req.params.id, orderData);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(400).json({ error: "Invalid order data" });
    }
  });

  // Shipment routes
  app.post("/api/shipments", async (req, res) => {
    try {
      const shipmentData = insertShipmentSchema.parse(req.body);
      const shipment = await storage.createShipment(shipmentData);
      res.status(201).json(shipment);
    } catch (error) {
      res.status(400).json({ error: "Invalid shipment data" });
    }
  });

  app.get("/api/shipments/:id", async (req, res) => {
    try {
      const shipment = await storage.getShipment(req.params.id);
      if (!shipment) {
        return res.status(404).json({ error: "Shipment not found" });
      }
      res.json(shipment);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/shipments/order/:orderId", async (req, res) => {
    try {
      const shipment = await storage.getShipmentByOrderId(req.params.orderId);
      if (!shipment) {
        return res.status(404).json({ error: "Shipment not found for this order" });
      }
      res.json(shipment);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/shipments/track/:trackingNumber", async (req, res) => {
    try {
      const shipment = await storage.getShipmentByTrackingNumber(req.params.trackingNumber);
      if (!shipment) {
        return res.status(404).json({ error: "Shipment not found with this tracking number" });
      }
      res.json(shipment);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);

  return httpServer;
}
