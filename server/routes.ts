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
import { sendEmail, sendEmailWithAttachment } from "./resend";

// Initialize Stripe with graceful fallback
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-08-27.basil",
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

  // Email/password authentication routes with session management
  app.post("/api/auth/register", async (req: any, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email || "");
      if (existingUser) {
        return res.status(400).json({ error: "User already exists with this email" });
      }
      
      // Create user
      const user = await storage.createUser(userData);
      
      // Create session for the newly registered user
      req.login({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName }, (err: any) => {
        if (err) {
          console.error("Session creation error:", err);
          return res.status(500).json({ error: "Registration successful but session creation failed" });
        }
        
        // Don't return password in response
        const { password, ...userResponse } = user;
        res.status(201).json({ user: userResponse });
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ error: "Registration failed", message: error.message });
    }
  });

  app.post("/api/auth/login", async (req: any, res) => {
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
      
      // Establish session using passport
      req.login({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName }, (err: any) => {
        if (err) {
          console.error("Session creation error:", err);
          return res.status(500).json({ error: "Login failed - could not create session" });
        }
        
        // Don't return password in response
        const { password: _, ...userResponse } = user;
        res.json({ user: userResponse });
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed", message: error.message });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", async (req: any, res) => {
    req.logout((err: any) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      req.session.destroy((err: any) => {
        if (err) {
          return res.status(500).json({ error: "Session destruction failed" });
        }
        res.json({ message: "Logged out successfully" });
      });
    });
  });

  // Update user information (for multi-step registration after social auth)
  app.patch("/api/users/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { phoneNumber, smsConsent, firstName, lastName, dateOfBirth, drugAllergies } = req.body;
      
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
      if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth;
      if (drugAllergies !== undefined) updates.drugAllergies = drugAllergies;
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
        refillsRemaining: z.string().optional(),
        sendEmail: z.boolean().optional().default(true),
        sendText: z.boolean().optional().default(false)
      }).parse(req.body);

      // Save the transfer request as a prescription request
      const prescription = await storage.createPrescriptionRequest({
        userId: transferData.userId,
        patientName: transferData.patientName,
        dateOfBirth: transferData.dateOfBirth || "",
        medicationName: transferData.medicationName,
        dosage: transferData.dosage || "",
        quantity: transferData.quantity || "30",
        doctorName: "",
        doctorPhone: "",
        doctorFax: "",
        doctorAddress: "",
        urgency: "routine",
        specialInstructions: `Transfer from ${transferData.currentPharmacyName}. Prescription #: ${transferData.prescriptionNumber}`,
        status: "pending",
        requestDate: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      });

      console.log(`📞 Prescription transfer request saved for ${transferData.patientName}`);

      // Get user information for notifications
      const user = await storage.getUser(transferData.userId);
      
      if (user) {
        // Check if user has a primary doctor
        if (user.primaryDoctorName && user.primaryDoctorPhone) {
          // Generate PDF for doctor
          const doctorAddress = user.primaryDoctorAddress as any;
          const requestData = {
            patientName: transferData.patientName,
            patientEmail: user.email || "",
            dateOfBirth: transferData.dateOfBirth || "",
            medicationName: transferData.medicationName,
            dosage: transferData.dosage || "",
            quantity: transferData.quantity || "30",
            doctorName: user.primaryDoctorName || "",
            doctorPhone: user.primaryDoctorPhone || "",
            doctorFax: "",
            doctorAddress: doctorAddress ? 
              `${doctorAddress.street || ""}, ${doctorAddress.city || ""}, ${doctorAddress.state || ""} ${doctorAddress.zipCode || ""}`.trim() : 
              "",
            urgency: "routine" as const,
            specialInstructions: `Transfer from ${transferData.currentPharmacyName}. Prescription #: ${transferData.prescriptionNumber}`,
            requestDate: new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })
          };

          const pdfBuffer = await generatePrescriptionRequestPDF(requestData);
          const messageTemplate = generateMessageTemplate(requestData);

          // Build notification promises based on user preferences
          const notifications: Promise<any>[] = [];

          // Send email if requested
          if (transferData.sendEmail && user.email) {
            notifications.push(
              sendEmailWithAttachment(
                user.email,
                "Prescription Transfer Request - Forward to Your Doctor",
                `Hi ${transferData.patientName},\n\nYour prescription transfer request for ${transferData.medicationName} has been submitted.\n\nAttached is a prescription request form. Please forward this email with the attachment to your doctor (${user.primaryDoctorName}) to authorize the transfer.\n\nAlternatively, you can download the form from your dashboard and send it to your doctor.\n\nBest regards,\nPillar Drug Club`,
                {
                  filename: `prescription-transfer-${transferData.patientName.replace(/\s+/g, '-')}.pdf`,
                  content: pdfBuffer
                }
              )
            );
          }

          // Send SMS if requested and user has consented
          if (transferData.sendText && user.smsConsent === "true" && user.phoneNumber) {
            notifications.push(
              sendSMS(
                user.phoneNumber,
                `Pillar Drug Club: Your prescription transfer for ${transferData.medicationName} has been submitted. ${transferData.sendEmail ? 'Check your email for the form to forward to your doctor.' : 'You can download the form from your dashboard.'}`
              )
            );
          }

          // Send notifications if any were requested
          if (notifications.length > 0) {
            Promise.allSettled(notifications).then(results => {
              const labels: string[] = [];
              if (transferData.sendEmail) labels.push('Patient Email');
              if (transferData.sendText) labels.push('Patient SMS');

              results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                  console.log(`✅ ${labels[index]} notification sent`);
                } else if (result.status === 'rejected') {
                  console.error(`❌ ${labels[index]} notification failed:`, result.reason);
                }
              });
            }).catch(err => {
              console.error('Unexpected notification error:', err);
            });

            console.log('📧 Transfer notifications queued');
          }
        }

        // If no doctor but text was requested and user consented
        else if (transferData.sendText && user.smsConsent === "true" && user.phoneNumber) {
          sendSMS(
            user.phoneNumber,
            `Pillar Drug Club: Your prescription transfer for ${transferData.medicationName} has been submitted and is being processed.`
          ).then(() => {
            console.log('✅ Patient SMS notification sent');
          }).catch(err => {
            console.error('❌ Patient SMS notification failed:', err);
          });
        }
      }
      
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
          email: user.email || undefined,
          name: `${user.firstName} ${user.lastName}`,
          metadata: {
            userId: userId
          }
        });
        customerId = customer.id;
        // Save customer ID immediately
        await storage.updateUserStripeInfo(userId, customerId, null);
      }
      
      // Create or retrieve the product and price
      // In production, you'd create these once via Stripe Dashboard or a setup script
      // For now, we'll use a hardcoded price ID or create it dynamically
      let priceId = process.env.STRIPE_PRICE_ID;
      
      if (!priceId) {
        // Create product and price if not configured
        const product = await stripe.products.create({
          name: 'Pillar Drug Club Membership',
          description: 'Monthly membership for wholesale prescription pricing',
        });
        
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: 1000, // $10.00 in cents
          currency: 'usd',
          recurring: {
            interval: 'month',
          },
        });
        
        priceId = price.id;
        console.log(`✅ Created Stripe product and price: ${priceId}`);
      }
      
      // Create the subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId: userId
        }
      });
      
      // Get the client secret from the payment intent
      const invoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = (invoice as any).payment_intent as Stripe.PaymentIntent;
      
      if (!paymentIntent || !paymentIntent.client_secret) {
        throw new Error('Failed to create payment intent for subscription');
      }
      
      // Update user with subscription info
      await storage.updateUserStripeInfo(userId, customerId, subscription.id);
      
      console.log(`✅ Created subscription ${subscription.id} for user ${userId}`);
      
      res.json({ 
        clientSecret: paymentIntent.client_secret,
        subscriptionId: subscription.id
      });
    } catch (error: any) {
      console.error("Stripe subscription error:", error);
      res.status(500).json({ 
        error: "Error creating subscription", 
        message: error.message 
      });
    }
  });

  // Stripe webhook endpoint for subscription events
  app.post("/api/webhooks/stripe", async (req, res) => {
    if (!stripe) {
      return res.status(503).json({ error: "Stripe not configured" });
    }

    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig) {
      return res.status(400).json({ error: "Missing stripe-signature header" });
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature if secret is configured
      if (webhookSecret) {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } else {
        // In development, accept events without verification
        event = req.body as Stripe.Event;
        console.warn('⚠️ Webhook signature verification skipped - configure STRIPE_WEBHOOK_SECRET for production');
      }
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    // Handle the event
    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          const userId = subscription.metadata.userId;
          
          if (userId) {
            let status: "active" | "canceled" | "past_due" | "incomplete";
            
            switch (subscription.status) {
              case 'active':
                status = 'active';
                break;
              case 'past_due':
                status = 'past_due';
                break;
              case 'canceled':
              case 'unpaid':
                status = 'canceled';
                break;
              default:
                status = 'incomplete';
            }
            
            await storage.updateSubscriptionStatus(userId, status);
            console.log(`✅ Updated subscription status for user ${userId}: ${status}`);
          }
          break;
        }
        
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const userId = subscription.metadata.userId;
          
          if (userId) {
            await storage.updateSubscriptionStatus(userId, 'canceled');
            console.log(`✅ Subscription canceled for user ${userId}`);
          }
          break;
        }
        
        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          const subscriptionId = (invoice as any).subscription as string;
          
          if (subscriptionId && invoice.customer_email) {
            // Find user by Stripe subscription ID and mark as active
            console.log(`✅ Payment succeeded for subscription ${subscriptionId}`);
            
            // Get subscription to access userId from metadata
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const userId = subscription.metadata.userId;
            
            if (userId) {
              await storage.updateSubscriptionStatus(userId, 'active');
              console.log(`✅ Activated subscription for user ${userId}`);
            }
          }
          break;
        }
        
        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          const subscriptionId = (invoice as any).subscription as string;
          
          if (subscriptionId) {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const userId = subscription.metadata.userId;
            
            if (userId) {
              await storage.updateSubscriptionStatus(userId, 'past_due');
              console.log(`⚠️ Payment failed for user ${userId}, marked as past_due`);
            }
          }
          break;
        }
        
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
      
      res.json({ received: true });
    } catch (error: any) {
      console.error('Error processing webhook:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
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
        hasAccess: user.subscriptionStatus === "active"
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

  // Prescription transfer endpoints (Legacy - use /api/prescription-transfers instead)
  app.post("/api/prescriptions", async (req, res) => {
    try {
      // This endpoint is deprecated - prescription transfer flow now uses PrescriptionRequest
      return res.status(410).json({ error: "This endpoint is deprecated. Please use /api/prescription-transfers instead." });
      
      /*
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
      */
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
      
      // Fetch patient email if userId is provided
      let patientEmail = '';
      let patientPhone = '';
      if (validatedData.userId) {
        const user = await storage.getUser(validatedData.userId);
        if (user) {
          patientEmail = user.email || '';
          patientPhone = user.phoneNumber || '';
        }
      }
      
      const requestData = {
        patientName: validatedData.patientName,
        patientEmail,
        dateOfBirth: validatedData.dateOfBirth || "",
        medicationName: validatedData.medicationName,
        dosage: validatedData.dosage,
        quantity: validatedData.quantity,
        doctorName: validatedData.doctorName,
        doctorPhone: validatedData.doctorPhone || "",
        doctorFax: validatedData.doctorFax || "",
        doctorAddress: validatedData.doctorAddress || "",
        urgency: validatedData.urgency || "routine",
        specialInstructions: validatedData.specialInstructions || "",
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

      // Send notifications to patient, doctor (async, don't block response)
      const sendNotifications = async () => {
        const notificationPromises: Promise<any>[] = [];
        
        // Send PDF to patient via email
        if (patientEmail && patientEmail.trim().length > 0) {
          const patientEmailSubject = `Your Prescription Request Form - Pillar Drug Club`;
          const patientEmailBody = `
            <h2>Your Prescription Request Form</h2>
            <p>Dear ${validatedData.patientName},</p>
            <p>Thank you for your prescription request. We've attached your completed prescription request form.</p>
            
            <h3>What to do next:</h3>
            <ol>
              <li>Review the attached PDF form</li>
              <li>Forward this email with the form to your doctor</li>
              <li>Or upload the form to your doctor's secure portal</li>
              <li>Your doctor will electronically submit the prescription to Pillar Drug Club</li>
            </ol>
            
            <h3>Requested Medication:</h3>
            <ul>
              <li><strong>Medication:</strong> ${validatedData.medicationName}</li>
              <li><strong>Dosage:</strong> ${validatedData.dosage}</li>
              <li><strong>Quantity:</strong> ${validatedData.quantity}</li>
            </ul>
            
            <p>If you have any questions, please contact us.</p>
            <p>Best regards,<br/>Pillar Drug Club Team</p>
          `;
          
          notificationPromises.push(
            sendEmailWithAttachment(
              patientEmail,
              patientEmailSubject,
              patientEmailBody,
              {
                filename: `prescription-request-${validatedData.patientName.replace(/\s+/g, '-')}.pdf`,
                content: pdfBuffer
              }
            )
              .then(success => {
                if (success) {
                  console.log(`✅ PDF sent to patient: ${patientEmail}`);
                } else {
                  console.warn(`⚠️ Failed to send PDF to patient: ${patientEmail}`);
                }
              })
              .catch(err => {
                console.error('Patient email error:', err);
                return false;
              })
          );
        }
        
        // Send SMS to patient with instructions
        if (patientPhone && patientPhone.trim().length > 0) {
          const patientSmsMessage = `Pillar Drug Club: Your prescription request form has been emailed to you. Please forward it to your doctor ${validatedData.doctorName} or upload to their secure portal.`;
          notificationPromises.push(
            sendSMS(patientPhone, patientSmsMessage)
              .then(success => {
                if (success) {
                  console.log(`✅ SMS sent to patient: ${patientPhone}`);
                } else {
                  console.warn(`⚠️ Failed to send SMS to patient: ${patientPhone}`);
                }
              })
              .catch(err => {
                console.error('Patient SMS error:', err);
                return false;
              })
          );
        }
        
        // Send PDF to doctor via email
        if (validatedData.doctorEmail && validatedData.doctorEmail.trim().length > 0) {
          const doctorEmailSubject = `Prescription Request for ${validatedData.patientName}`;
          const doctorEmailBody = `
            <h2>Prescription Request</h2>
            <p>Dear ${validatedData.doctorName},</p>
            <p>Your patient <strong>${validatedData.patientName}</strong> is requesting a prescription through Pillar Drug Club, their wholesale pharmacy.</p>
            
            <h3>Prescription Details:</h3>
            <ul>
              <li><strong>Medication:</strong> ${validatedData.medicationName}</li>
              <li><strong>Dosage:</strong> ${validatedData.dosage}</li>
              <li><strong>Quantity:</strong> ${validatedData.quantity}</li>
              <li><strong>Urgency:</strong> ${validatedData.urgency}</li>
              ${validatedData.specialInstructions ? `<li><strong>Special Instructions:</strong> ${validatedData.specialInstructions}</li>` : ''}
            </ul>
            
            <p><strong>Please review the attached prescription request form and submit electronically to:</strong></p>
            <p><strong>Pillar Drug Club</strong><br/>
            Search pharmacy: "Pillar Drug Club"<br/>
            <strong>IMPORTANT:</strong> Include patient email: ${patientEmail || validatedData.patientName}<br/>
            Or fax: ${validatedData.doctorFax || '(Contact Pillar Drug Club)'}</p>
            
            <p>Thank you for your attention to this matter.</p>
            <p>Best regards,<br/>Pillar Drug Club</p>
          `;
          
          notificationPromises.push(
            sendEmailWithAttachment(
              validatedData.doctorEmail,
              doctorEmailSubject,
              doctorEmailBody,
              {
                filename: `prescription-request-${validatedData.patientName.replace(/\s+/g, '-')}.pdf`,
                content: pdfBuffer
              }
            )
              .then(success => {
                if (success) {
                  console.log(`✅ PDF sent to doctor: ${validatedData.doctorEmail}`);
                } else {
                  console.warn(`⚠️ Failed to send PDF to doctor: ${validatedData.doctorEmail}`);
                }
              })
              .catch(err => {
                console.error('Doctor email error:', err);
                return false;
              })
          );
        }
        
        // Send SMS to doctor
        if (validatedData.doctorPhone && validatedData.doctorPhone.trim().length > 0) {
          const doctorSmsMessage = `Pillar Drug Club: Prescription request for ${validatedData.patientName} - ${validatedData.medicationName} ${validatedData.dosage}. Please check your email for the prescription request form.`;
          notificationPromises.push(
            sendSMS(validatedData.doctorPhone, doctorSmsMessage)
              .then(success => {
                if (success) {
                  console.log(`✅ SMS sent to doctor: ${validatedData.doctorPhone}`);
                } else {
                  console.warn(`⚠️ Failed to send SMS to doctor: ${validatedData.doctorPhone}`);
                }
              })
              .catch(err => {
                console.error('Doctor SMS error:', err);
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

  // Get user's prescription requests
  app.get("/api/prescription-requests/user/:userId", async (req, res) => {
    try {
      const requests = await storage.getUserPrescriptionRequests(req.params.userId);
      res.json({ requests });
    } catch (error: any) {
      console.error("Error fetching user prescription requests:", error);
      res.status(500).json({ 
        error: "Failed to fetch prescription requests", 
        message: error.message 
      });
    }
  });

  // Regenerate and download PDF for a specific prescription request
  app.get("/api/prescription-requests/:id/pdf", async (req, res) => {
    try {
      const requests = await storage.getAllPrescriptionRequests();
      const request = requests.find(r => r.id === req.params.id);
      
      if (!request) {
        return res.status(404).json({ error: "Prescription request not found" });
      }

      // Get patient email if userId is available
      let patientEmail = '';
      if (request.userId) {
        const user = await storage.getUser(request.userId);
        if (user) {
          patientEmail = user.email || '';
        }
      }

      const requestData = {
        patientName: request.patientName,
        patientEmail,
        dateOfBirth: request.dateOfBirth,
        medicationName: request.medicationName,
        dosage: request.dosage,
        quantity: request.quantity,
        doctorName: request.doctorName,
        doctorPhone: request.doctorPhone,
        doctorFax: request.doctorFax,
        doctorAddress: request.doctorAddress,
        urgency: request.urgency,
        specialInstructions: request.specialInstructions,
        requestDate: request.requestDate
      };

      const pdfBuffer = await generatePrescriptionRequestPDF(requestData);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="prescription-request-${request.patientName.replace(/\s+/g, '-')}.pdf"`);
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error("Error regenerating PDF:", error);
      res.status(500).json({ 
        error: "Failed to generate PDF", 
        message: error.message 
      });
    }
  });

  // Send prescription request PDF link via SMS
  app.post("/api/prescription-requests/:id/text", async (req, res) => {
    try {
      const requests = await storage.getAllPrescriptionRequests();
      const request = requests.find(r => r.id === req.params.id);
      
      if (!request) {
        return res.status(404).json({ error: "Prescription request not found" });
      }

      if (!request.userId) {
        return res.status(400).json({ error: "No user associated with this prescription request" });
      }

      const user = await storage.getUser(request.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!user.phoneNumber) {
        return res.status(400).json({ error: "User has no phone number on file" });
      }

      // Generate download link - use full URL for SMS
      const host = req.get('host');
      const protocol = host?.includes('replit.dev') || host?.includes('replit.app') ? 'https' : req.protocol;
      const downloadUrl = `${protocol}://${host}/api/prescription-requests/${request.id}/pdf`;
      
      // Short, clear SMS message
      const smsMessage = `Pillar Drug Club: ${request.medicationName} prescription form ready. Download here: ${downloadUrl}`;
      
      const success = await sendSMS(user.phoneNumber, smsMessage);
      
      if (success) {
        console.log(`✅ Prescription request PDF link sent to: ${user.phoneNumber}`);
        res.json({ success: true, message: "PDF link sent to your phone" });
      } else {
        res.status(500).json({ error: "Failed to send SMS" });
      }
    } catch (error: any) {
      console.error("Error sending prescription request SMS:", error);
      res.status(500).json({ 
        error: "Failed to send SMS", 
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

  // Get user's current medications (active prescriptions)
  app.get("/api/users/:userId/medications", async (req, res) => {
    try {
      // For now, return mock data since we need customer ID mapping
      // In production, this would fetch real prescription data
      res.json({ medications: [] });
    } catch (error: any) {
      console.error("Error fetching user medications:", error);
      res.status(500).json({ 
        error: "Failed to fetch medications", 
        message: error.message 
      });
    }
  });

  // Get user's primary doctor information
  app.get("/api/users/:userId/primary-doctor", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!user.primaryDoctorId) {
        return res.json({ doctor: null });
      }

      const doctor = {
        id: user.primaryDoctorId,
        name: user.primaryDoctorName,
        npi: user.primaryDoctorNpi,
        phone: user.primaryDoctorPhone,
        address: user.primaryDoctorAddress
      };

      res.json({ doctor });
    } catch (error: any) {
      console.error("Error fetching primary doctor:", error);
      res.status(500).json({ 
        error: "Failed to fetch primary doctor", 
        message: error.message 
      });
    }
  });

  // Update user's primary doctor
  app.put("/api/users/:userId/primary-doctor", async (req, res) => {
    try {
      const { doctorId, doctorName, doctorNpi, doctorPhone, doctorAddress } = req.body;
      
      if (!doctorName) {
        return res.status(400).json({ error: "Doctor name is required" });
      }

      await storage.updateUserPrimaryDoctor(req.params.userId, {
        doctorId,
        doctorName,
        doctorNpi,
        doctorPhone,
        doctorAddress
      });

      res.json({ 
        success: true, 
        message: "Primary doctor updated successfully" 
      });
    } catch (error: any) {
      console.error("Error updating primary doctor:", error);
      res.status(500).json({ 
        error: "Failed to update primary doctor", 
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
