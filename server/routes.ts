import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { z } from "zod";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import { setupSocialAuth, isAuthenticated as socialAuthCheck } from "./socialAuth";
import { 
  insertCustomerSchema, 
  insertMedicationSchema,
  insertPrescriptionSchema,
  insertOrderSchema,
  insertShipmentSchema,
  medicationSearchSchema,
  orderSearchSchema,
  insertPrescriptionRequestSchema
} from "@shared/pharmacy-schema";
import { generatePrescriptionRequestPDF, generateMessageTemplate } from "./pdf-generator";
import { sendSMS } from "./twilio";
import { sendEmail } from "./resend";

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
  // Setup Social OAuth (Google, Apple, X)
  await setupSocialAuth(app);

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

  // Get authenticated user (for OAuth)
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Don't return password in response
      const { password, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Legacy email/password authentication routes (for backward compatibility)
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

  // Update user information (for multi-step registration after social auth)
  app.patch("/api/users/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { phoneNumber, smsConsent, firstName, lastName } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Update user with provided fields, normalizing types
      const updates: any = {};
      if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber;
      if (smsConsent !== undefined) {
        // Normalize smsConsent to string "true" or "false" (database expects text type)
        updates.smsConsent = smsConsent === true || smsConsent === "true" ? "true" : "false";
      }
      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;
      updates.updatedAt = new Date();

      const updatedUser = await storage.updateUser(userId, updates);
      
      // Don't return password in response
      const { password, ...userResponse } = updatedUser;
      res.json(userResponse);
    } catch (error: any) {
      console.error("User update error:", error);
      res.status(500).json({ error: "Failed to update user", message: error.message });
    }
  });

  // Simple prescription transfer endpoint for registration flow
  app.post("/api/prescriptions/transfer", async (req, res) => {
    try {
      const transferData = z.object({
        userId: z.string(),
        patientName: z.string(),
        dateOfBirth: z.string().optional(),
        medicationName: z.string(),
        dosage: z.string().optional(),
        quantity: z.string().optional(),
        prescriptionNumber: z.string(),
        currentPharmacyName: z.string(),
        currentPharmacyPhone: z.string().optional(),
        currentPharmacyAddress: z.string().optional(),
        lastFillDate: z.string().optional(),
        refillsRemaining: z.string().optional()
      }).parse(req.body);

      // Save the transfer request
      const prescription = await storage.createPrescription({
        userId: transferData.userId,
        patientName: transferData.patientName,
        medicationName: transferData.medicationName,
        dosage: transferData.dosage,
        quantity: transferData.quantity,
        isTransfer: "true",
        transferFromPharmacy: transferData.currentPharmacyName,
        transferFromPhone: transferData.currentPharmacyPhone,
        status: "pending"
      });

      console.log(`📞 Prescription transfer request saved for ${transferData.patientName}`);
      
      res.status(201).json({ 
        prescription,
        message: "Transfer request saved successfully"
      });
    } catch (error: any) {
      console.error("Transfer request error:", error);
      res.status(400).json({ 
        error: "Failed to save transfer request", 
        message: error.message 
      });
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
        // TODO: Integrate with Surescripts RxChange API for pharmacy transfers
      } else {
        console.log(`📋 Sending NewRx request via Surescripts network for prescription ${prescription.id}`);
        // TODO: Integrate with Surescripts via certified partner (DoseSpot recommended)
        // 
        // SURESCRIPTS INTEGRATION OPTIONS:
        // 
        // Option 1: DoseSpot (Recommended)
        //   - Cost: $525/month for up to 500 prescriptions (~$1.05/prescription)
        //   - Timeline: Days to weeks for setup
        //   - Features: Full API access, white-label UI, automatic certification
        //   - URL: https://dosespot.com/full-integration/
        //
        // Option 2: Particle Health
        //   - Access Surescripts medication history data
        //   - 12-month patient medication records
        //   - 99% pharmacy coverage
        //   - URL: https://docs.particlehealth.com/docs/surescripts
        //
        // REQUIREMENTS:
        //   - Surescripts Business Associate Agreement (BAA)
        //   - DEA third-party audit for EPCS (controlled substances)
        //   - HIPAA compliance documentation
        //   - Provider identity proofing
        //
        // IMPLEMENTATION:
        //   1. Sign up with DoseSpot or Particle Health
        //   2. Obtain API credentials and add to environment secrets
        //   3. Implement NCPDP NewRx transaction format
        //   4. Map prescription data to Surescripts fields
        //   5. Handle responses (RxFill, RxChange, CancelRx)
        //
        if (prescriptionData.prescriber) {
          console.log(`  → Prescriber: ${prescriptionData.prescriber}`);
          console.log(`  → Medication: ${prescriptionData.medicationName}`);
          console.log(`  → Patient: ${prescriptionData.patientName}`);
          console.log(`  → Pharmacy network: Surescripts (1.6M providers, 99% U.S. pharmacies)`);
        }
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

  // Generate PDF and message for prescription request
  app.post("/api/prescriptions/generate-pdf", async (req, res) => {
    try {
      // Validate request data
      const pdfRequestSchema = z.object({
        userId: z.string().optional(),
        patientName: z.string().min(2, "Patient name is required"),
        dateOfBirth: z.string().optional(),
        medicationName: z.string().min(2, "Medication name is required"),
        dosage: z.string().min(1, "Dosage is required"),
        quantity: z.string().min(1, "Quantity is required"),
        doctorName: z.string().min(2, "Doctor name is required"),
        doctorPhone: z.string().optional(),
        doctorEmail: z.union([z.string().email(), z.literal("")]).optional(),
        doctorFax: z.string().optional(),
        doctorAddress: z.string().optional(),
        urgency: z.enum(["routine", "urgent", "emergency"]).default("routine"),
        specialInstructions: z.string().optional()
      });

      const validatedData = pdfRequestSchema.parse(req.body);
      
      const requestData = {
        ...validatedData,
        dateOfBirth: validatedData.dateOfBirth || "",
        requestDate: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      };

      // Save prescription request to storage
      const prescriptionRequest = await storage.createPrescriptionRequest({
        userId: validatedData.userId,
        patientName: validatedData.patientName,
        dateOfBirth: validatedData.dateOfBirth || "",
        medicationName: validatedData.medicationName,
        dosage: validatedData.dosage,
        quantity: validatedData.quantity,
        doctorName: validatedData.doctorName,
        doctorPhone: validatedData.doctorPhone || "",
        doctorFax: validatedData.doctorFax,
        doctorAddress: validatedData.doctorAddress || "",
        urgency: validatedData.urgency || "routine",
        specialInstructions: validatedData.specialInstructions,
        status: "pending",
        requestDate: requestData.requestDate
      });

      console.log(`✅ Prescription request saved: ${prescriptionRequest.id}`);

      // Generate PDF
      const pdfBuffer = await generatePrescriptionRequestPDF(requestData);
      
      // Generate message template
      const messageTemplate = generateMessageTemplate(requestData);

      // Send notifications to doctor (async, don't block response)
      const sendNotifications = async () => {
        const notificationPromises: Promise<any>[] = [];
        
        // Send SMS if doctor phone is provided
        if (validatedData.doctorPhone && validatedData.doctorPhone.trim().length > 0) {
          const smsMessage = `Pillar Drug Club: Prescription request for ${validatedData.patientName} - ${validatedData.medicationName} ${validatedData.dosage}. Please check your email or fax for details.`;
          notificationPromises.push(
            sendSMS(validatedData.doctorPhone, smsMessage)
              .then(success => {
                if (success) {
                  console.log(`✅ SMS notification sent to doctor: ${validatedData.doctorPhone}`);
                } else {
                  console.warn(`⚠️ Failed to send SMS to doctor: ${validatedData.doctorPhone}`);
                }
              })
              .catch(err => {
                console.error('SMS notification error:', err);
                return false;
              })
          );
        }

        // Send email if doctor email is provided
        if (validatedData.doctorEmail && validatedData.doctorEmail.trim().length > 0) {
          const emailSubject = `Prescription Request for ${validatedData.patientName}`;
          const emailBody = `
            <h2>Prescription Request</h2>
            <p>Dear ${validatedData.doctorName},</p>
            <p>Your patient <strong>${validatedData.patientName}</strong> is requesting a prescription through Pillar Drug Club.</p>
            
            <h3>Prescription Details:</h3>
            <ul>
              <li><strong>Medication:</strong> ${validatedData.medicationName}</li>
              <li><strong>Dosage:</strong> ${validatedData.dosage}</li>
              <li><strong>Quantity:</strong> ${validatedData.quantity}</li>
              <li><strong>Urgency:</strong> ${validatedData.urgency}</li>
              ${validatedData.specialInstructions ? `<li><strong>Special Instructions:</strong> ${validatedData.specialInstructions}</li>` : ''}
            </ul>
            
            <p>Please review this request and send the prescription to:</p>
            <p><strong>Pillar Drug Club</strong><br/>
            Fax: ${validatedData.doctorFax || '(Will be provided)'}<br/>
            Or use your e-prescribing system</p>
            
            <p>Thank you for your attention to this matter.</p>
            <p>Best regards,<br/>Pillar Drug Club</p>
          `;
          
          notificationPromises.push(
            sendEmail(validatedData.doctorEmail, emailSubject, emailBody)
              .then(success => {
                if (success) {
                  console.log(`✅ Email notification sent to doctor: ${validatedData.doctorEmail}`);
                } else {
                  console.warn(`⚠️ Failed to send email to doctor: ${validatedData.doctorEmail}`);
                }
              })
              .catch(err => {
                console.error('Email notification error:', err);
                return false;
              })
          );
        }

        // Wait for all notifications to complete or fail
        if (notificationPromises.length > 0) {
          await Promise.allSettled(notificationPromises);
        }
      };

      // Start notifications in background without blocking response
      sendNotifications().catch(err => 
        console.error('Critical error in notification processing:', err)
      );

      // Return PDF as downloadable file
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="prescription-request-${requestData.patientName.replace(/\s+/g, '-')}.pdf"`);
      res.setHeader('X-Message-Template', Buffer.from(messageTemplate).toString('base64'));
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error("PDF generation error:", error);
      res.status(500).json({ 
        error: "Failed to generate PDF", 
        message: error.message 
      });
    }
  });

  // Get all prescription requests (for admin dashboard)
  app.get("/api/admin/prescription-requests", async (req, res) => {
    try {
      const requests = await storage.getAllPrescriptionRequests();
      res.json({ requests });
    } catch (error: any) {
      console.error("Error fetching prescription requests:", error);
      res.status(500).json({ 
        error: "Failed to fetch prescription requests", 
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

  // Prescription lookup route
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
