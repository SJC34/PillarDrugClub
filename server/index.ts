import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";

const app = express();

// CRITICAL: Add health check endpoint FIRST, before any middleware
// This ensures Replit deployment health checks get immediate responses
app.get("/", (req, res) => {
  res.status(200).json({ 
    status: "ok", 
    service: "pillar-drug-club",
    timestamp: new Date().toISOString()
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});

// Stripe webhook needs raw body for signature verification
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));

// Apply JSON parsing to all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
  
  // Create HTTP server FIRST so health checks can work immediately
  const { createServer } = await import("http");
  const server = createServer(app);
  
  // Start listening IMMEDIATELY to pass health checks
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, async () => {
    log(`✅ Server listening on port ${port} - ready for health checks`);
    log(`🚀 Initializing routes and services in background...`);
    
    // Initialize routes AFTER server is listening (non-blocking for health checks)
    try {
      await registerRoutes(app, server);
      log(`✅ Routes and authentication initialized`);
    } catch (error) {
      log(`⚠️ Warning: Route initialization encountered issues: ${error}`);
      // Continue serving even if some routes fail - critical for health checks
    }

    // Initialize storage data AFTER server is ready
    try {
      log(`🔄 Initializing storage data...`);
      await storage.initializeData();
      log(`✅ Storage data initialized`);
    } catch (error) {
      log(`⚠️ Warning: Storage initialization encountered issues: ${error}`);
    }
  });

  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // Setup Vite for development or static serving for production
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
    log(`✅ Vite dev server ready`);
  } else {
    serveStatic(app);
    log(`✅ Static files configured`);
  }

  log(`✅ Application fully initialized and ready`);
})();
