import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

export function getSession() {
  // HIPAA 30-minute session timeout with rolling expiration
  // Rolling cookies automatically extend the session on every request,
  // eliminating the need for client-side keep-alive pings
  const sessionTimeoutMs = 30 * 60 * 1000; // 30 minutes (HIPAA compliance)
  const absoluteTtlMs = 7 * 24 * 60 * 60 * 1000; // 7 days absolute maximum
  
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: absoluteTtlMs, // Database TTL for cleanup (absolute max)
    tableName: "sessions",
  });
  
  const isProduction = process.env.NODE_ENV === 'production';
  const useSecureCookies = isProduction || process.env.REPLIT_DEPLOYMENT === '1' || !!process.env.REPLIT_DOMAINS;
  
  // Extract domain from REPLIT_DOMAINS for cookie sharing across subdomains
  const domain = process.env.REPLIT_DOMAINS?.split(',')[0]?.replace(/^https?:\/\//, '').split(':')[0] || undefined;
  
  return session({
    name: 'pillar.sid',  // Explicit cookie name for better tracking
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    rolling: true, // ✨ KEY FIX: Auto-extend session on every request (eliminates need for client keep-alive)
    cookie: {
      httpOnly: true,
      secure: useSecureCookies,
      sameSite: useSecureCookies ? 'none' : 'lax',  // 'none' for HTTPS to support mobile Safari
      domain: useSecureCookies && domain ? `.${domain}` : undefined,  // Share cookie across subdomains in production
      maxAge: sessionTimeoutMs, // 30-minute sliding window (not 7 days!)
    },
  });
}

async function upsertUserFromProfile(profile: any, provider: string) {
  const email = profile.emails?.[0]?.value || profile.email;
  const firstName = profile.name?.givenName || profile.given_name || profile.firstName || "";
  const lastName = profile.name?.familyName || profile.family_name || profile.lastName || "";
  const profileImageUrl = profile.photos?.[0]?.value || profile.picture || profile.profileImageUrl || "";

  // Validate email exists
  if (!email) {
    throw new Error(
      `${provider} authentication failed: Email address is required but was not provided. Please ensure email permissions are granted.`
    );
  }

  // First, try to find existing user by email
  let existingUser;
  let isNewUser = false;
  try {
    existingUser = await storage.getUserByEmail(email);
  } catch (error) {
    // User doesn't exist by email, this is a new user
    isNewUser = true;
  }

  let userId: string;
  
  if (existingUser) {
    // User already exists - use their existing ID
    userId = existingUser.id;
    
    // Update their profile with OAuth data (name, photo)
    await storage.upsertUser({
      id: userId,
      email: email,
      firstName: firstName || existingUser.firstName,
      lastName: lastName || existingUser.lastName,
      profileImageUrl: profileImageUrl || existingUser.profileImageUrl,
    });
  } else {
    // New user - create with Google-prefixed ID
    userId = `${provider}_${profile.id}`;
    
    await storage.upsertUser({
      id: userId,
      email: email,
      firstName: firstName,
      lastName: lastName,
      profileImageUrl: profileImageUrl,
    });
  }

  return {
    id: userId,
    email: email,
    firstName: firstName || existingUser?.firstName || "",
    lastName: lastName || existingUser?.lastName || "",
    provider: provider,
    isNewUser: isNewUser,
  };
}

export async function setupSocialAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Use custom domain for production, otherwise fall back to Replit domain or localhost
  const callbackURL = process.env.CUSTOM_DOMAIN
    ? `https://${process.env.CUSTOM_DOMAIN}`
    : process.env.REPLIT_DOMAINS 
      ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
      : "http://localhost:5000";

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: `${callbackURL}/api/auth/google/callback`,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const user = await upsertUserFromProfile(profile, "google");
            done(null, user);
          } catch (error) {
            done(error as Error);
          }
        }
      )
    );

    app.get(
      "/api/auth/google",
      passport.authenticate("google", { scope: ["profile", "email"] })
    );

    app.get(
      "/api/auth/google/callback",
      passport.authenticate("google", { failureRedirect: "/login" }),
      (req: any, res) => {
        // Check if this is a new user who needs to complete registration
        const user = req.user;
        if (user && user.isNewUser) {
          // New user - skip step 1 (social auth already done), go to step 2 (user details)
          res.redirect("/register?step=2");
        } else {
          // Existing user - go to dashboard
          res.redirect("/dashboard");
        }
      }
    );
  }


  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });

  // Fallback route for unconfigured Google OAuth
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    app.get("/api/auth/google", (req, res) => {
      res.redirect("/login?error=Google authentication is not available at this time.");
    });
  }

  // Logout route
  app.get("/api/auth/social-logout", (req, res) => {
    req.logout(() => {
      res.redirect("/login");
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};
