import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { z } from "zod";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import { setupAuth, isAuthenticated as replitAuthCheck } from "./replitAuth";
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
import multer from "multer";

// Initialize Stripe with graceful fallback
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
  try {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-08-27.basil",
    });
    console.log('✅ Stripe initialized successfully');
  } catch (error) {
    console.error('❌ Stripe initialization failed:', error);
    console.warn('⚠️ Stripe not configured - payment features will be limited');
  }
} else {
  if (process.env.STRIPE_SECRET_KEY) {
    console.warn('⚠️ Invalid Stripe secret key format (must start with sk_) - payment features will be limited');
  } else {
    console.warn('⚠️ Stripe not configured - payment features will be limited');
  }
}

// Helper function to generate unique referral codes
function generateReferralCode(firstName?: string, lastName?: string): string {
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  if (firstName && lastName) {
    const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    return `${initials}${randomPart}`;
  }
  return `PILLAR${randomPart}`;
}

export async function registerRoutes(app: Express, server: Server): Promise<void> {
  // Setup Replit Auth (handles Google login via OIDC)
  // This also sets up the session middleware that email/password auth will use
  await setupAuth(app);

  // Get authenticated user (handles both Replit Auth and legacy auth)
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Determine user ID based on auth method
      // Replit Auth uses req.user.claims.sub, legacy auth uses req.user.id
      const userId = req.user.claims?.sub || req.user.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
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
      if (!user || !user.password) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      
      // Verify password using bcrypt
      const dbStorage = storage as any;
      const isValidPassword = await dbStorage.verifyPassword(password, user.password);
      if (!isValidPassword) {
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
      const { phoneNumber, smsConsent, firstName, lastName, dateOfBirth, drugAllergies, userAddress } = req.body;
      
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
      if (userAddress !== undefined) updates.userAddress = userAddress;
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

  // Stripe subscription route with two-tier pricing
  app.post("/api/create-subscription", async (req, res) => {
    try {
      const { userId, plan = 'plus' } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      // Validate plan
      if (plan !== 'basic' && plan !== 'plus') {
        return res.status(400).json({ error: "Invalid plan. Must be 'basic' or 'plus'" });
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
      
      // Determine price based on plan
      const planConfig: Record<'basic' | 'plus', { amount: number; name: string; description: string }> = {
        basic: {
          amount: 1500, // $15.00 in cents
          name: 'Pillar Drug Club Foundation Plan',
          description: 'Monthly membership for 1-3 medications at wholesale pricing'
        },
        plus: {
          amount: 2500, // $25.00 in cents
          name: 'Pillar Drug Club Keystone Plan',
          description: 'Monthly membership for 4+ medications at wholesale pricing'
        }
      };

      const selectedPlan = planConfig[plan as 'basic' | 'plus'];
      
      // Create or retrieve the product and price
      // In production, you'd create these once via Stripe Dashboard or a setup script
      // For now, we'll use environment variables or create them dynamically
      let priceId = plan === 'basic' ? process.env.STRIPE_BASIC_PRICE_ID : process.env.STRIPE_PLUS_PRICE_ID;
      
      if (!priceId) {
        // Create product and price if not configured
        const product = await stripe.products.create({
          name: selectedPlan.name,
          description: selectedPlan.description,
        });
        
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: selectedPlan.amount,
          currency: 'usd',
          recurring: {
            interval: 'month',
          },
        });
        
        priceId = price.id;
        console.log(`✅ Created Stripe product and price for ${plan} plan: ${priceId}`);
      }
      
      // Check for available referral credits
      const availableCredits = await storage.getAvailableReferralCredits(userId);
      let couponId = null;
      let appliedCreditId = null;
      
      if (availableCredits.length > 0) {
        // Use the first available credit
        const credit = availableCredits[0];
        
        // Create or retrieve a Stripe coupon for 1 month free (100% off for 1 month)
        try {
          // Try to get existing coupon or create a new one
          const coupons = await stripe.coupons.list({ limit: 100 });
          let existingCoupon = coupons.data.find(c => 
            c.percent_off === 100 && 
            c.duration === 'repeating' && 
            c.duration_in_months === 1
          );
          
          if (!existingCoupon) {
            existingCoupon = await stripe.coupons.create({
              percent_off: 100,
              duration: 'repeating',
              duration_in_months: 1,
              name: 'Pillar Referral Credit - 1 Month Free',
            });
            console.log(`✅ Created Stripe coupon: ${existingCoupon.id}`);
          }
          
          couponId = existingCoupon.id;
          appliedCreditId = credit.id;
          
          // Update credit status to 'applied'
          await storage.updateReferralCredit(credit.id, {
            status: 'applied',
            stripeCouponId: couponId,
            appliedAt: new Date()
          });
          
          console.log(`✅ Applied referral credit ${credit.id} (coupon ${couponId}) for user ${userId}`);
        } catch (couponError) {
          console.error('Error creating/applying coupon:', couponError);
          // Continue with subscription creation even if coupon fails
        }
      }
      
      // Create the subscription
      const subscriptionParams: any = {
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId: userId,
          plan: plan
        }
      };
      
      // Add coupon if available
      if (couponId) {
        subscriptionParams.coupon = couponId;
      }
      
      const subscription = await stripe.subscriptions.create(subscriptionParams);
      
      // Get the client secret from the payment intent
      const invoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = (invoice as any).payment_intent as Stripe.PaymentIntent;
      
      if (!paymentIntent || !paymentIntent.client_secret) {
        throw new Error('Failed to create payment intent for subscription');
      }
      
      // Update user with subscription info
      await storage.updateUserStripeInfo(userId, customerId, subscription.id);
      
      // Set annual commitment tracking fields only if user doesn't have an active commitment
      if (!user.commitmentStartDate) {
        const now = new Date();
        const commitmentEnd = new Date(now);
        commitmentEnd.setFullYear(commitmentEnd.getFullYear() + 1); // 12 months from now
        
        await storage.updateUser(userId, {
          commitmentStartDate: now,
          commitmentEndDate: commitmentEnd,
          monthsPaid: 0, // Will be incremented by webhook on first payment
          monthlyRate: selectedPlan.amount.toString(), // Store as string for numeric type
        });
        
        console.log(`✅ Created subscription ${subscription.id} for user ${userId} with new 12-month commitment ending ${commitmentEnd.toISOString()}`);
      } else {
        // User has existing commitment, just update the monthly rate if plan changed
        await storage.updateUser(userId, {
          monthlyRate: selectedPlan.amount.toString(),
        });
        
        console.log(`✅ Updated subscription ${subscription.id} for user ${userId}, preserving existing commitment (${user.monthsPaid} months paid)`);
      }
      
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
          
          if (subscriptionId) {
            // Find user by Stripe subscription ID and mark as active
            console.log(`✅ Payment succeeded for subscription ${subscriptionId}`);
            
            // Get subscription to access userId from metadata
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const userId = subscription.metadata.userId;
            
            if (userId) {
              await storage.updateSubscriptionStatus(userId, 'active');
              console.log(`✅ Activated subscription for user ${userId}`);
              
              // Increment monthsPaid counter for annual commitment tracking
              const user = await storage.getUser(userId);
              if (user) {
                // Use nullish coalescing to default to 0 if monthsPaid is null/undefined
                const newMonthsPaid = (user.monthsPaid ?? 0) + 1;
                await storage.updateUser(userId, {
                  monthsPaid: newMonthsPaid
                });
                console.log(`✅ Incremented monthsPaid to ${newMonthsPaid} for user ${userId}`);
                
                // If this is the first payment and user has applied referral credits, mark them as redeemed
                if (newMonthsPaid === 1) {
                  const appliedCredits = await storage.getAvailableReferralCredits(userId);
                  const creditsToRedeem = appliedCredits.filter(c => c.status === 'applied');
                  
                  for (const credit of creditsToRedeem) {
                    await storage.updateReferralCredit(credit.id, {
                      status: 'redeemed',
                      redeemedAt: new Date()
                    });
                    console.log(`✅ Marked referral credit ${credit.id} as redeemed for user ${userId}`);
                  }
                }
              }
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
        hasAccess: true // Allow all users to bypass subscription requirement
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

  // Manual test user seeding endpoint (for production setup)
  app.post("/api/admin/seed-users", async (req, res) => {
    try {
      console.log("🔄 Manual user seeding triggered...");
      const dbStorage = storage as any;
      if (dbStorage.seedTestUsers) {
        await dbStorage.seedTestUsers();
        res.json({ 
          status: "success", 
          message: "Test users seeded successfully"
        });
      } else {
        res.status(400).json({
          error: "User seeding not available for current storage implementation"
        });
      }
    } catch (error: any) {
      console.error("Manual user seeding error:", error);
      res.status(500).json({ 
        error: "Failed to seed users", 
        message: error.message 
      });
    }
  });

  // Configure multer for CSV file upload (memory storage)
  const csvUpload = multer({ 
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
        cb(null, true);
      } else {
        cb(new Error('Only CSV files are allowed'));
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    }
  });

  // CSV upload endpoint for updating medication prices
  app.post("/api/admin/medications/upload-prices", csvUpload.single('file'), async (req: any, res) => {
    try {
      // Check authentication and admin role
      if (!req.isAuthenticated()) {
        return res.status(401).json({ 
          success: false,
          message: "Authentication required" 
        });
      }

      const userId = req.user.claims?.sub || req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ 
          success: false,
          message: "Admin access required" 
        });
      }

      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          message: "No file uploaded" 
        });
      }

      // Parse CSV content
      const csvContent = req.file.buffer.toString('utf-8');
      const lines = csvContent.split('\n').filter((line: string) => line.trim());
      
      if (lines.length < 2) {
        return res.status(400).json({ 
          success: false,
          message: "CSV file is empty or invalid" 
        });
      }

      // Parse header
      const header = lines[0].split(',').map((h: string) => h.trim());
      const ndcIndex = header.indexOf('ndc');
      const priceIndex = header.indexOf('price');
      const wholesalePriceIndex = header.indexOf('wholesalePrice');
      const annualPriceIndex = header.indexOf('annualPrice');

      if (ndcIndex === -1 || priceIndex === -1 || wholesalePriceIndex === -1) {
        return res.status(400).json({ 
          success: false,
          message: "CSV must contain 'ndc', 'price', and 'wholesalePrice' columns" 
        });
      }

      // Process each row
      const errors: string[] = [];
      let updatedCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map((cell: string) => cell.trim());
        
        try {
          const ndc = row[ndcIndex];
          const price = row[priceIndex];
          const wholesalePrice = row[wholesalePriceIndex];
          const annualPrice = annualPriceIndex !== -1 ? row[annualPriceIndex] : undefined;

          if (!ndc || !price || !wholesalePrice) {
            errors.push(`Row ${i + 1}: Missing required fields (ndc, price, or wholesalePrice)`);
            continue;
          }

          // Parse and validate numeric values
          const parsedPrice = parseFloat(price);
          const parsedWholesalePrice = parseFloat(wholesalePrice);
          const parsedAnnualPrice = annualPrice ? parseFloat(annualPrice) : undefined;

          // Validate that all parsed values are valid numbers
          if (isNaN(parsedPrice)) {
            errors.push(`Row ${i + 1}: Invalid price value "${price}"`);
            continue;
          }
          if (isNaN(parsedWholesalePrice)) {
            errors.push(`Row ${i + 1}: Invalid wholesalePrice value "${wholesalePrice}"`);
            continue;
          }
          if (annualPrice && isNaN(parsedAnnualPrice!)) {
            errors.push(`Row ${i + 1}: Invalid annualPrice value "${annualPrice}"`);
            continue;
          }

          // Find medication by NDC
          const medication = await storage.getMedicationByNdc(ndc);
          
          if (!medication) {
            errors.push(`Row ${i + 1}: Medication with NDC ${ndc} not found`);
            continue;
          }

          // Update medication prices with validated numbers
          const updates: any = {
            price: parsedPrice,
            wholesalePrice: parsedWholesalePrice,
          };

          if (parsedAnnualPrice !== undefined) {
            updates.annualPrice = parsedAnnualPrice;
          }

          await storage.updateMedication(medication.id, updates);
          updatedCount++;
          
          console.log(`✅ Updated medication ${medication.name} (NDC: ${ndc}): price=${updates.price}, wholesale=${updates.wholesalePrice}`);
        } catch (error: any) {
          errors.push(`Row ${i + 1}: ${error.message}`);
        }
      }

      res.json({
        success: true,
        message: `Successfully updated ${updatedCount} medication prices`,
        updatedCount,
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (error: any) {
      console.error("CSV upload error:", error);
      res.status(500).json({ 
        success: false,
        message: error.message || "Failed to process CSV file" 
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
        patientEmail: z.string().optional(),
        patientPhone: z.string().optional(),
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
        specialInstructions: z.string().optional(),
        sendEmail: z.boolean().optional().default(true),
        sendText: z.boolean().optional().default(false),
        downloadForm: z.boolean().optional().default(false)
      });

      const validatedData = pdfRequestSchema.parse(req.body);
      
      // Fetch patient email/phone from request or from user profile if userId is provided
      let patientEmail = validatedData.patientEmail || '';
      let patientPhone = validatedData.patientPhone || '';
      if (validatedData.userId) {
        const user = await storage.getUser(validatedData.userId);
        if (user) {
          // Use user profile data if not provided in request
          if (!patientEmail) patientEmail = user.email || '';
          if (!patientPhone) patientPhone = user.phoneNumber || '';
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

      console.log(`🔔 Starting notification process - sendEmail: ${validatedData.sendEmail}, sendText: ${validatedData.sendText}`);
      
      // Send notifications to patient, doctor (async, don't block response)
      const sendNotifications = async () => {
        console.log(`📬 Inside sendNotifications function`);
        const notificationPromises: Promise<any>[] = [];
        
        // Send PDF to patient via email (only if sendEmail is true)
        if (validatedData.sendEmail && patientEmail && patientEmail.trim().length > 0) {
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
        
        // Send SMS to patient with instructions (only if sendText is true)
        console.log(`📱 SMS check: sendText=${validatedData.sendText}, phone="${patientPhone}", length=${patientPhone.trim().length}`);
        if (validatedData.sendText && patientPhone && patientPhone.trim().length > 0) {
          console.log(`📤 Attempting to send SMS to: ${patientPhone}`);
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
        } else {
          console.log(`⚠️ SMS not sent: conditions not met`);
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
      res.setHeader('X-Prescription-Request-Id', prescriptionRequest.id);
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
      console.log(`📱 SMS request received for prescription ID: ${req.params.id}`);
      
      const requests = await storage.getAllPrescriptionRequests();
      console.log(`📋 Found ${requests.length} total prescription requests`);
      
      const request = requests.find(r => r.id === req.params.id);
      
      if (!request) {
        console.log(`❌ Prescription request not found: ${req.params.id}`);
        return res.status(404).json({ error: "Prescription request not found" });
      }

      console.log(`✅ Found prescription request for ${request.patientName}, medication: ${request.medicationName}`);

      if (!request.userId) {
        console.log(`❌ No user ID associated with prescription request`);
        return res.status(400).json({ error: "No user associated with this prescription request" });
      }

      console.log(`👤 Looking up user: ${request.userId}`);
      const user = await storage.getUser(request.userId);
      
      if (!user) {
        console.log(`❌ User not found: ${request.userId}`);
        return res.status(404).json({ error: "User not found" });
      }

      console.log(`👤 Found user: ${user.email}, phone: ${user.phoneNumber}`);

      if (!user.phoneNumber) {
        console.log(`❌ User has no phone number: ${user.email}`);
        return res.status(400).json({ error: "User has no phone number on file" });
      }

      // Generate download link - use full URL for SMS
      const host = req.get('host');
      const protocol = host?.includes('replit.dev') || host?.includes('replit.app') ? 'https' : req.protocol;
      const downloadUrl = `${protocol}://${host}/api/prescription-requests/${request.id}/pdf`;
      
      console.log(`📲 Sending SMS to ${user.phoneNumber} with download link: ${downloadUrl}`);
      
      // Short, clear SMS message
      const smsMessage = `Pillar Drug Club: ${request.medicationName} prescription form ready. Download here: ${downloadUrl}`;
      
      const success = await sendSMS(user.phoneNumber, smsMessage);
      
      if (success) {
        console.log(`✅ Prescription request PDF link sent to: ${user.phoneNumber}`);
        res.json({ success: true, message: "PDF link sent to your phone" });
      } else {
        console.log(`❌ Failed to send SMS to: ${user.phoneNumber}`);
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

  // ===== REFILL REQUEST ROUTES =====

  // Get prescriptions needing refill for a user
  app.get("/api/users/:userId/prescriptions-needing-refill", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    try {
      const prescriptions = await storage.getPrescriptionsNeedingRefill(req.params.userId);
      res.json({ prescriptions });
    } catch (error: any) {
      console.error("Error fetching prescriptions needing refill:", error);
      res.status(500).json({ 
        error: "Failed to fetch prescriptions", 
        message: error.message 
      });
    }
  });

  // Create a refill request
  app.post("/api/refill-requests", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const { prescriptionId, priority, patientNotes } = req.body;
      
      // Get the prescription details
      const prescription = await storage.getPrescription(prescriptionId);
      if (!prescription) {
        return res.status(404).json({ error: "Prescription not found" });
      }

      // Verify the prescription belongs to the authenticated user
      if (prescription.userId !== req.user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Calculate due date based on last fill and days supply
      let dueDate = null;
      if (prescription.lastFillDate && prescription.daysSupply) {
        const lastFillDate = new Date(prescription.lastFillDate);
        const dueDateObj = new Date(lastFillDate);
        dueDateObj.setDate(lastFillDate.getDate() + prescription.daysSupply);
        dueDate = dueDateObj.toISOString().split('T')[0];
      }

      const refillRequest = await storage.createRefillRequest({
        userId: req.user.id,
        prescriptionId,
        medicationName: prescription.medicationName,
        dosage: prescription.dosage,
        quantity: prescription.quantity,
        status: "pending",
        priority: priority || "routine",
        dueDate,
        requestedDate: new Date().toISOString().split('T')[0],
        doctorName: prescription.prescriberName,
        doctorPhone: prescription.prescriberPhone,
        patientNotes: patientNotes || null,
        autoRequested: false,
        reminderSent: false
      });

      res.json({ refillRequest });
    } catch (error: any) {
      console.error("Error creating refill request:", error);
      res.status(500).json({ 
        error: "Failed to create refill request", 
        message: error.message 
      });
    }
  });

  // Get user's refill requests
  app.get("/api/users/:userId/refill-requests", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    try {
      const refillRequests = await storage.getUserRefillRequests(req.params.userId);
      res.json({ refillRequests });
    } catch (error: any) {
      console.error("Error fetching refill requests:", error);
      res.status(500).json({ 
        error: "Failed to fetch refill requests", 
        message: error.message 
      });
    }
  });

  // User Medications Routes
  app.get("/api/users/:userId/medications", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    try {
      const medications = await storage.getUserActiveMedications(req.params.userId);
      
      // Fetch OpenFDA data for each medication if needed
      const { getDrugLabel, checkDrugInteractions } = await import("./openfda-service");
      
      // Enrich medications with FDA data
      const enrichedMeds = await Promise.all(medications.map(async (med) => {
        if (!med.fdaData || (med.lastFdaCheck && Date.now() - new Date(med.lastFdaCheck).getTime() > 24 * 60 * 60 * 1000)) {
          // Fetch fresh FDA data if not cached or older than 24 hours
          const fdaData = await getDrugLabel(med.genericName || med.medicationName);
          if (fdaData) {
            // Update cache
            await storage.updateUserMedication(med.id, {
              fdaData,
              lastFdaCheck: new Date()
            });
            return { ...med, fdaData };
          }
        }
        return med;
      }));
      
      // Check for drug interactions
      const interactionCheck = await checkDrugInteractions(
        enrichedMeds.map(m => ({ genericName: m.genericName || m.medicationName }))
      );
      
      res.json({ 
        medications: enrichedMeds,
        interactions: interactionCheck 
      });
    } catch (error: any) {
      console.error("Error fetching medications:", error);
      res.status(500).json({ 
        error: "Failed to fetch medications", 
        message: error.message 
      });
    }
  });

  app.post("/api/users/:userId/medications", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    try {
      const { getDrugLabel } = await import("./openfda-service");
      
      // Fetch FDA data for the new medication
      const fdaData = await getDrugLabel(req.body.genericName || req.body.medicationName);
      
      const medication = await storage.addUserMedication({
        userId: req.params.userId,
        ...req.body,
        fdaData,
        lastFdaCheck: new Date(),
        fromPrescription: req.body.fromPrescription || false,
      });
      
      res.json(medication);
    } catch (error: any) {
      console.error("Error adding medication:", error);
      res.status(500).json({ 
        error: "Failed to add medication", 
        message: error.message 
      });
    }
  });

  app.delete("/api/users/:userId/medications/:medicationId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    try {
      await storage.removeUserMedication(req.params.medicationId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error removing medication:", error);
      res.status(500).json({ 
        error: "Failed to remove medication", 
        message: error.message 
      });
    }
  });

  // ============= REFERRAL SYSTEM ROUTES =============

  // Get or generate user's referral code
  app.get("/api/users/:userId/referral-code", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.claims?.sub || req.user.id;
    if (userId !== req.params.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    try {
      // Check if user already has a referral code
      let referralCode = await storage.getReferralCode(req.params.userId);

      // If not, generate one with collision handling
      if (!referralCode) {
        const user = await storage.getUser(req.params.userId);
        let attempts = 0;
        const maxAttempts = 5;
        
        while (attempts < maxAttempts) {
          try {
            const code = generateReferralCode(user?.firstName, user?.lastName);
            referralCode = await storage.createReferralCode(req.params.userId, code);
            break;
          } catch (error: any) {
            attempts++;
            if (attempts >= maxAttempts) {
              throw new Error("Failed to generate unique referral code");
            }
          }
        }
      }

      res.json(referralCode);
    } catch (error: any) {
      console.error("Error getting referral code:", error);
      res.status(500).json({
        error: "Failed to get referral code",
        message: error.message
      });
    }
  });

  // Validate a referral code (public endpoint)
  app.post("/api/referrals/validate", async (req, res) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: "Referral code is required" });
      }

      const referralCode = await storage.validateReferralCode(code);
      
      if (!referralCode || !referralCode.isActive) {
        return res.status(404).json({ 
          valid: false, 
          message: "Invalid or inactive referral code" 
        });
      }

      // Get referrer information
      const referrer = await storage.getUser(referralCode.userId);
      
      res.json({
        valid: true,
        referrer: {
          firstName: referrer?.firstName,
          lastName: referrer?.lastName
        }
      });
    } catch (error: any) {
      console.error("Error validating referral code:", error);
      res.status(500).json({
        error: "Failed to validate referral code",
        message: error.message
      });
    }
  });

  // Apply a referral code (called during signup)
  app.post("/api/referrals/apply", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.claims?.sub || req.user.id;

    try {
      const { referralCode } = req.body;
      
      if (!referralCode) {
        return res.status(400).json({ error: "Referral code is required" });
      }

      const result = await storage.applyReferralCode(userId, referralCode);
      
      res.json({
        success: true,
        message: "Referral code applied successfully! Both you and your referrer will receive 1 free month.",
        referralHistory: result
      });
    } catch (error: any) {
      console.error("Error applying referral code:", error);
      res.status(400).json({
        error: "Failed to apply referral code",
        message: error.message
      });
    }
  });

  // Get user's referral stats
  app.get("/api/users/:userId/referral-stats", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.claims?.sub || req.user.id;
    if (userId !== req.params.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    try {
      const stats = await storage.getReferralStats(req.params.userId);
      res.json(stats);
    } catch (error: any) {
      console.error("Error getting referral stats:", error);
      res.status(500).json({
        error: "Failed to get referral stats",
        message: error.message
      });
    }
  });

  // Get user's referral history
  app.get("/api/users/:userId/referral-history", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.claims?.sub || req.user.id;
    if (userId !== req.params.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    try {
      const history = await storage.getUserReferralHistory(req.params.userId);
      
      // Enrich with referee information
      const enrichedHistory = await Promise.all(
        history.map(async (item: any) => {
          const referee = await storage.getUser(item.refereeId);
          return {
            ...item,
            refereeName: referee ? `${referee.firstName} ${referee.lastName}` : "Unknown",
            refereeEmail: referee?.email
          };
        })
      );

      res.json(enrichedHistory);
    } catch (error: any) {
      console.error("Error getting referral history:", error);
      res.status(500).json({
        error: "Failed to get referral history",
        message: error.message
      });
    }
  });

  // Get user's referral credits
  app.get("/api/users/:userId/referral-credits", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.claims?.sub || req.user.id;
    if (userId !== req.params.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    try {
      const credits = await storage.getUserReferralCredits(req.params.userId);
      res.json(credits);
    } catch (error: any) {
      console.error("Error getting referral credits:", error);
      res.status(500).json({
        error: "Failed to get referral credits",
        message: error.message
      });
    }
  });

  // ============= END REFERRAL SYSTEM ROUTES =============

  // Get all refill requests (admin only)
  app.get("/api/admin/refill-requests", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const refillRequests = await storage.getAllRefillRequests();
      res.json({ refillRequests });
    } catch (error: any) {
      console.error("Error fetching all refill requests:", error);
      res.status(500).json({ 
        error: "Failed to fetch refill requests", 
        message: error.message 
      });
    }
  });

  // Update refill request status (admin only)
  app.patch("/api/refill-requests/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const { status, pharmacyNotes, orderId } = req.body;
      
      const updateData: any = { status };
      
      if (pharmacyNotes !== undefined) {
        updateData.pharmacyNotes = pharmacyNotes;
      }
      
      if (orderId !== undefined) {
        updateData.orderId = orderId;
      }

      if (status === "approved") {
        updateData.approvedDate = new Date().toISOString().split('T')[0];
      } else if (status === "filled") {
        updateData.filledDate = new Date().toISOString().split('T')[0];
      }

      const refillRequest = await storage.updateRefillRequest(req.params.id, updateData);
      
      if (!refillRequest) {
        return res.status(404).json({ error: "Refill request not found" });
      }

      res.json({ refillRequest });
    } catch (error: any) {
      console.error("Error updating refill request:", error);
      res.status(500).json({ 
        error: "Failed to update refill request", 
        message: error.message 
      });
    }
  });

  // Admin dashboard metrics endpoint
  app.get("/api/admin/dashboard-metrics", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = req.user as any;
    
    // Fetch full user from storage to get role
    const fullUser = await storage.getUser(user.id);
    if (!fullUser || fullUser.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error: any) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ 
        error: "Failed to fetch dashboard metrics", 
        message: error.message 
      });
    }
  });

  // Admin user management endpoints

  // GET /api/admin/users - List all users with filtering
  app.get("/api/admin/users", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = req.user as any;
    const fullUser = await storage.getUser(user.id);
    if (!fullUser || fullUser.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const { search, role, status, page, limit } = req.query;
      
      const filters = {
        search: search as string | undefined,
        role: role as string | undefined,
        status: status as string | undefined,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10
      };

      const { users, total } = await storage.getAllUsers(filters);
      
      // Remove password from response
      const sanitizedUsers = users.map(({ password, ...user }) => user);
      
      res.json({ 
        users: sanitizedUsers,
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages: Math.ceil(total / filters.limit)
      });
    } catch (error: any) {
      console.error("Error fetching users:", error);
      res.status(500).json({ 
        error: "Failed to fetch users", 
        message: error.message 
      });
    }
  });

  // GET /api/admin/users/:userId - Get detailed user information
  app.get("/api/admin/users/:userId", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = req.user as any;
    const fullUser = await storage.getUser(user.id);
    if (!fullUser || fullUser.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const targetUser = await storage.getUser(req.params.userId);
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get additional user details
      const prescriptions = await storage.getUserPrescriptions(req.params.userId);
      const orders = await storage.getUserOrders(req.params.userId);
      
      // Calculate totals
      const activePrescriptionsCount = prescriptions.filter((p: any) => p.status === 'active').length;
      const ordersCount = orders.length;
      const totalSpent = orders.reduce((sum: number, order: any) => {
        const total = typeof order.total === 'string' ? parseFloat(order.total) : order.total;
        return sum + (isNaN(total) ? 0 : total);
      }, 0);

      // Get recent orders (last 5)
      const recentOrders = orders
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      // Remove password from response
      const { password, ...userResponse } = targetUser;

      res.json({
        ...userResponse,
        stats: {
          activePrescriptionsCount,
          ordersCount,
          totalSpent: totalSpent.toFixed(2),
          lastActive: targetUser.updatedAt
        },
        recentOrders: recentOrders.map((order: any) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          total: order.total,
          createdAt: order.createdAt
        }))
      });
    } catch (error: any) {
      console.error("Error fetching user details:", error);
      res.status(500).json({ 
        error: "Failed to fetch user details", 
        message: error.message 
      });
    }
  });

  // PATCH /api/admin/users/:userId - Update user information
  app.patch("/api/admin/users/:userId", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = req.user as any;
    const fullUser = await storage.getUser(user.id);
    if (!fullUser || fullUser.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      // Validate input with Zod
      const updateSchema = z.object({
        email: z.string().email().optional(),
        phoneNumber: z.string().optional(),
        role: z.enum(["admin", "client", "broker", "company"]).optional(),
        subscriptionStatus: z.enum(["active", "canceled", "past_due", "incomplete"]).optional(),
        isActive: z.string().optional()
      });

      const validatedData = updateSchema.parse(req.body);
      
      const targetUser = await storage.getUser(req.params.userId);
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const updatedUser = await storage.updateUser(req.params.userId, validatedData);
      
      // Remove password from response
      const { password, ...userResponse } = updatedUser;
      
      res.json({ user: userResponse });
    } catch (error: any) {
      console.error("Error updating user:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      res.status(500).json({ 
        error: "Failed to update user", 
        message: error.message 
      });
    }
  });

  // POST /api/admin/users/:userId/suspend - Suspend/unsuspend user account
  app.post("/api/admin/users/:userId/suspend", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = req.user as any;
    const fullUser = await storage.getUser(user.id);
    if (!fullUser || fullUser.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      // Validate input
      const suspendSchema = z.object({
        is_active: z.boolean(),
        reason: z.string().optional()
      });

      const { is_active, reason } = suspendSchema.parse(req.body);
      
      const targetUser = await storage.getUser(req.params.userId);
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Prevent self-suspension
      if (req.params.userId === user.id) {
        return res.status(400).json({ error: "Cannot suspend your own account" });
      }

      const updatedUser = await storage.updateUser(req.params.userId, {
        isActive: is_active ? "true" : "false"
      });
      
      console.log(`Admin ${user.email} ${is_active ? 'activated' : 'suspended'} user ${targetUser.email}${reason ? `: ${reason}` : ''}`);
      
      // Remove password from response
      const { password, ...userResponse } = updatedUser;
      
      res.json({ 
        user: userResponse,
        message: is_active ? "User account activated" : "User account suspended"
      });
    } catch (error: any) {
      console.error("Error suspending/activating user:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      res.status(500).json({ 
        error: "Failed to update user status", 
        message: error.message 
      });
    }
  });

  // Admin financial tracking endpoints

  // GET /api/admin/financial-metrics - Get financial overview and metrics
  app.get("/api/admin/financial-metrics", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = req.user as any;
    const fullUser = await storage.getUser(user.id);
    if (!fullUser || fullUser.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      // Get all users for subscription metrics
      const allUsers = await storage.getAllUsers({ page: 1, limit: 10000 });
      const users = allUsers.users as any[];
      
      // Get all orders for revenue metrics
      const allOrders = (await storage.getAllOrders()) as any[];
      
      // Calculate subscription metrics
      const activeSubscriptions = users.filter((u) => u.subscriptionStatus === 'active').length;
      const canceledSubscriptions = users.filter((u) => u.subscriptionStatus === 'canceled').length;
      const pastDueSubscriptions = users.filter((u) => u.subscriptionStatus === 'past_due').length;
      
      // Assuming Basic plan = $15, Plus plan = $25 (simplified - in production would check actual plan)
      // For now, estimate MRR based on active subscriptions
      const estimatedMRR = activeSubscriptions * 20; // Average of $15 and $25
      
      // Calculate revenue metrics
      const totalRevenue = allOrders.reduce((sum: number, order: any) => {
        const total = typeof order.total === 'string' ? parseFloat(order.total) : order.total;
        return sum + (isNaN(total) ? 0 : total);
      }, 0);
      
      // Calculate this month's revenue
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      
      const thisMonthRevenue = allOrders
        .filter((order: any) => {
          const orderDate = new Date(order.createdAt);
          return orderDate.getMonth() === thisMonth && orderDate.getFullYear() === thisYear;
        })
        .reduce((sum: number, order: any) => {
          const total = typeof order.total === 'string' ? parseFloat(order.total) : order.total;
          return sum + (isNaN(total) ? 0 : total);
        }, 0);
      
      // Get recent transactions (last 10 orders)
      const recentTransactions = allOrders
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
        .map((order: any) => {
          // Get user info for the order
          const orderUser = users.find((u: any) => u.id === order.userId);
          return {
            id: order.id,
            orderNumber: order.orderNumber,
            userName: orderUser ? `${orderUser.firstName || ''} ${orderUser.lastName || ''}`.trim() : 'Unknown',
            userEmail: orderUser?.email || 'Unknown',
            amount: order.total,
            status: order.status,
            createdAt: order.createdAt
          };
        });
      
      // Calculate daily revenue for the last 30 days
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        date.setHours(0, 0, 0, 0);
        return date;
      });
      
      const dailyRevenue = last30Days.map(date => {
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const dayRevenue = allOrders
          .filter((order: any) => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= date && orderDate < nextDate;
          })
          .reduce((sum: number, order: any) => {
            const total = typeof order.total === 'string' ? parseFloat(order.total) : order.total;
            return sum + (isNaN(total) ? 0 : total);
          }, 0);
        
        return {
          date: date.toISOString().split('T')[0],
          revenue: parseFloat(dayRevenue.toFixed(2))
        };
      });

      res.json({
        revenueMetrics: {
          totalRevenue: totalRevenue.toFixed(2),
          monthlyRevenue: thisMonthRevenue.toFixed(2),
          monthlyRecurringRevenue: estimatedMRR.toFixed(2),
          averageOrderValue: allOrders.length > 0 ? (totalRevenue / allOrders.length).toFixed(2) : "0.00"
        },
        subscriptionMetrics: {
          activeSubscriptions,
          canceledSubscriptions,
          pastDueSubscriptions,
          totalSubscriptions: activeSubscriptions + canceledSubscriptions + pastDueSubscriptions,
          churnRate: (canceledSubscriptions / (activeSubscriptions + canceledSubscriptions) * 100).toFixed(1)
        },
        recentTransactions,
        dailyRevenue
      });
    } catch (error: any) {
      console.error("Error fetching financial metrics:", error);
      res.status(500).json({ 
        error: "Failed to fetch financial metrics", 
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
  app.put("/api/users/:userId/primary-doctor", async (req: any, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (req.user.id !== req.params.userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

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

  // Update user's drug allergies
  app.put("/api/users/:userId/allergies", async (req: any, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (req.user.id !== req.params.userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { drugAllergies } = req.body;
      
      if (!Array.isArray(drugAllergies)) {
        return res.status(400).json({ error: "drugAllergies must be an array" });
      }

      // Validate each allergy is a string
      const allergyValidation = z.array(z.string()).safeParse(drugAllergies);
      if (!allergyValidation.success) {
        return res.status(400).json({ error: "All allergies must be strings" });
      }

      await storage.updateUserAllergies(req.params.userId, drugAllergies);

      res.json({ 
        success: true, 
        message: "Drug allergies updated successfully" 
      });
    } catch (error: any) {
      console.error("Error updating drug allergies:", error);
      res.status(500).json({ 
        error: "Failed to update drug allergies", 
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
      // If simple 'q' parameter is provided, search CSV medications
      if (req.query.q && typeof req.query.q === 'string') {
        const query = req.query.q as string;
        
        console.log(`💊 CSV medication search request: "${query}"`);
        
        if (!query.trim() || query.length < 2) {
          console.log(`⚠️ Query too short: "${query}"`);
          return res.json({ medications: [] });
        }

        // Search local CSV medications
        const result = await storage.searchMedications({ query, page: 1, limit: 20 });
        
        // Format results to match what frontend expects (name, rxcui, score)
        const medications = result.medications.map((med, index) => ({
          name: med.name,
          rxcui: med.id, // Use medication ID as rxcui
          score: String(100 - index) // Simple relevance score
        }));

        console.log(`✅ Returning ${medications.length} medications from CSV`);

        return res.json({ medications });
      }
      
      // Otherwise, use local medication database search
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

  // Cart routes
  app.get("/api/users/:userId/cart", async (req, res) => {
    try {
      const cartItems = await storage.getCartItems(req.params.userId);
      res.json(cartItems);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/cart", async (req, res) => {
    try {
      const { userId, medicationId, quantity } = req.body;
      const cartItem = await storage.addToCart(userId, medicationId, quantity || 1);
      res.status(201).json(cartItem);
    } catch (error) {
      res.status(400).json({ error: "Invalid cart data" });
    }
  });

  app.put("/api/cart/item/:id", async (req, res) => {
    try {
      const { quantity } = req.body;
      const cartItem = await storage.updateCartItem(req.params.id, quantity);
      if (!cartItem) {
        return res.status(404).json({ error: "Cart item not found" });
      }
      res.json(cartItem);
    } catch (error) {
      res.status(400).json({ error: "Invalid cart data" });
    }
  });

  app.delete("/api/cart/item/:id", async (req, res) => {
    try {
      const success = await storage.removeFromCart(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Cart item not found" });
      }
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/cart/user/:userId", async (req, res) => {
    try {
      await storage.clearCart(req.params.userId);
      res.json({ message: "Cart cleared" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
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

  app.get("/api/users/:userId/prescriptions", async (req: any, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Ensure user can only access their own prescriptions
      const requestedUserId = req.params.userId;
      const authenticatedUserId = req.user.id;

      if (requestedUserId !== authenticatedUserId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const prescriptions = await storage.getUserPrescriptions(requestedUserId);
      res.json(prescriptions);
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
        const itemPrice = parseFloat(medication.wholesalePrice as any);
        
        // Validate price is greater than zero
        if (!itemPrice || itemPrice <= 0) {
          return res.status(400).json({ 
            error: `Medication ${item.medicationId} has invalid price: ${medication.wholesalePrice}` 
          });
        }
        
        const itemTotal = itemPrice * item.quantity;
        calculatedSubtotal += itemTotal;
        
        // Update item prices
        item.price = itemPrice as any;
        item.totalPrice = itemTotal as any;
      }

      // Final validation: ensure total is greater than zero
      if (calculatedSubtotal <= 0) {
        return res.status(400).json({ error: "Order subtotal must be greater than $0" });
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

  app.get("/api/users/:userId/orders", async (req: any, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Ensure user can only access their own orders
      const requestedUserId = req.params.userId;
      const authenticatedUserId = req.user.id;

      if (requestedUserId !== authenticatedUserId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const orders = await storage.getUserOrders(requestedUserId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
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

  app.get("/api/shipments/tracking/:trackingNumber", async (req, res) => {
    try {
      const shipment = await storage.getShipmentByTrackingNumber(req.params.trackingNumber);
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

  app.post("/api/test/sms", async (req, res) => {
    try {
      const { phoneNumber, message } = req.body;
      console.log(`📱 Sending SMS to: ${phoneNumber}`);
      console.log(`📱 Message: ${message}`);
      
      if (!phoneNumber || !message) {
        return res.status(400).json({ error: "Phone number and message are required" });
      }
      
      const success = await sendSMS(phoneNumber, message);
      console.log(`📱 SMS send result: ${success}`);
      
      if (success) {
        res.json({ success: true, message: "SMS sent successfully" });
      } else {
        res.status(500).json({ error: "Failed to send SMS" });
      }
    } catch (error: any) {
      console.error("📱 Test SMS error:", error);
      res.status(500).json({ error: "Failed to send SMS", message: error.message });
    }
  });

  app.post("/api/test/email", async (req, res) => {
    try {
      const { to, subject, message } = req.body;
      console.log(`📧 Sending email to: ${to}`);
      console.log(`📧 Subject: ${subject}`);
      
      if (!to || !subject || !message) {
        return res.status(400).json({ error: "To, subject, and message are required" });
      }
      
      const success = await sendEmail(to, subject, message);
      console.log(`📧 Email send result: ${success}`);
      
      if (success) {
        res.json({ success: true, message: "Email sent successfully" });
      } else {
        res.status(500).json({ error: "Failed to send email" });
      }
    } catch (error: any) {
      console.error("📧 Test email error:", error);
      res.status(500).json({ error: "Failed to send email", message: error.message });
    }
  });
}
