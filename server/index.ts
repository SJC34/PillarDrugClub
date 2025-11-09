import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { 
  securityHeaders, 
  generalRateLimiter, 
  validateSessionTimeout 
} from "./securityMiddleware";
import { autoAuditMiddleware } from "./auditLogger";

const app = express();

// CRITICAL: Add health check endpoints FIRST, before any middleware
// This ensures Replit deployment health checks get immediate responses
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/ping", (req, res) => {
  res.status(200).json({ 
    status: "ok", 
    service: "pillar-drug-club",
    timestamp: new Date().toISOString()
  });
});

// Security Headers - Apply HIPAA-compliant security headers
app.use(securityHeaders);

// Stripe webhook needs raw body for signature verification
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));

// Apply JSON parsing to all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Rate Limiting - General rate limiter for all API routes
app.use('/api/', generalRateLimiter);

// Session Timeout - Validate session hasn't expired (30 min inactivity)
app.use(validateSessionTimeout);

// Audit Logging - Automatically log all PHI access and admin actions
app.use(autoAuditMiddleware);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  const port = parseInt(process.env.PORT || '5000', 10);
  
  // Create HTTP server
  const { createServer } = await import("http");
  const server = createServer(app);
  
  // Initialize ALL middleware and routes BEFORE starting the server
  // This ensures health checks work immediately when server starts listening
  try {
    log(`🚀 Initializing routes and authentication...`);
    await registerRoutes(app, server);
    log(`✅ Routes and authentication initialized`);
  } catch (error) {
    log(`❌ Error: Route initialization failed: ${error}`);
    process.exit(1);
  }

  // Setup Vite for development or static serving for production BEFORE listening
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
    log(`✅ Vite dev server ready`);
  } else {
    serveStatic(app);
    log(`✅ Static files configured`);
  }

  // Error handler (must be registered after routes)
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // Initialize storage data in background (non-blocking)
  // This can happen while server is starting
  storage.initializeData()
    .then(() => log(`✅ Storage data initialized`))
    .catch((error) => log(`⚠️ Warning: Storage initialization encountered issues: ${error}`));

  // Initialize content automation scheduler
  import("./services/scheduler-service")
    .then((scheduler) => {
      scheduler.initializeScheduler();
      log(`✅ Content scheduler initialized`);
    })
    .catch((error) => log(`⚠️ Warning: Scheduler initialization failed: ${error}`));

  // Start listening AFTER all critical middleware is ready
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`✅ Server listening on port ${port}`);
    log(`✅ Application fully initialized and ready`);
  });
})();
