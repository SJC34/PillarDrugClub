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
  
  // 🔧 CRITICAL FIX: Only set cookie.domain for custom domains in production
  // Setting domain to REPLIT_DOMAINS causes browsers to reject cookies when accessed
  // from preview URLs, embedded browsers, or non-matching hostnames
  // Let browsers use the current request hostname by default (domain: undefined)
  const cookieDomain = process.env.CUSTOM_DOMAIN 
    ? `.${process.env.CUSTOM_DOMAIN}` 
    : undefined;
  
  return session({
    name: 'pillar.sid',  // Explicit cookie name for better tracking
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    rolling: true, // ✨ Auto-extend session on every request (eliminates need for client keep-alive)
    cookie: {
      httpOnly: true,
      secure: useSecureCookies,
      sameSite: useSecureCookies ? 'none' : 'lax',  // 'none' for HTTPS to support mobile Safari
      domain: cookieDomain,  // Only set for CUSTOM_DOMAIN, otherwise let browser use request hostname
      maxAge: sessionTimeoutMs, // 30-minute sliding window (HIPAA compliance)
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

  // Fetch the complete user record to ensure we have all fields including role
  const fullUser = await storage.getUser(userId);
  
  return {
    id: userId,
    email: email,
    firstName: firstName || existingUser?.firstName || "",
    lastName: lastName || existingUser?.lastName || "",
    role: fullUser?.role || existingUser?.role || "client",  // ✅ CRITICAL: Include role for admin checks
    profileImageUrl: profileImageUrl || existingUser?.profileImageUrl || "",
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
      passport.authenticate("google", { failureRedirect: "/login?error=auth_failed" }),
      (req: any, res) => {
        console.log('[OAuth] 🔍 Callback received');
        console.log('[OAuth] User object:', req.user ? 'EXISTS' : 'MISSING');
        console.log('[OAuth] Session ID:', req.sessionID);
        console.log('[OAuth] Is authenticated?', req.isAuthenticated());
        
        if (!req.user) {
          console.error('[OAuth] ❌ No user object after authentication');
          return res.redirect("/login?error=no_user");
        }
        
        // 🔧 CRITICAL FIX: Explicitly save session before redirect
        // Without this, the redirect can happen before session is committed to database,
        // causing the browser to hit /dashboard before cookies/session are ready
        req.session.save((err: any) => {
          if (err) {
            console.error('[OAuth] ❌ Session save error:', err);
            return res.redirect("/login?error=session_save_failed");
          }
          
          console.log('[OAuth] ✅ Session saved successfully');
          console.log('[OAuth] Session after save - authenticated?', req.isAuthenticated());
          
          // Check if this is a new user who needs to complete registration
          const user = req.user;
          if (user && user.isNewUser) {
            console.log('[OAuth] 🆕 New user - redirecting to registration step 2');
            // New user - skip step 1 (social auth already done), go to step 2 (user details)
            res.redirect("/register?step=2");
          } else {
            console.log('[OAuth] 👤 Existing user - redirecting to dashboard');
            // Existing user - go to dashboard
            res.redirect("/dashboard");
          }
        });
      }
    );
  }


  passport.serializeUser((user: any, done) => {
    console.log('[Passport] 💾 Serializing user:', user?.id || 'NO_ID');
    // Store the entire user object in the session
    // This works because our session store handles object serialization
    done(null, user);
  });

  passport.deserializeUser(async (user: any, done) => {
    console.log('[Passport] 🔓 Deserializing user:', user?.id || 'NO_ID');
    console.log('[Passport] 🔓 Session user role:', user?.role || 'NO_ROLE');
    
    try {
      // ✅ CRITICAL: Always fetch fresh user from database to ensure req.user has latest data including role
      // This prevents role drift and ensures admin checks work correctly
      if (user?.id) {
        const dbUser = await storage.getUser(user.id);
        if (dbUser) {
          console.log('[Passport] ✅ User verified from database:', dbUser.email);
          console.log('[Passport] ✅ Database user role:', dbUser.role || 'NO_ROLE');
          console.log('[Passport] ✅ Full user object:', JSON.stringify(dbUser, null, 2));
          done(null, dbUser); // ✅ Always use database user (includes role, subscriptionTier, etc.)
        } else {
          console.log('[Passport] ⚠️ User not found in database, using session data');
          done(null, user);
        }
      } else {
        console.log('[Passport] ⚠️ No user ID in session');
        done(null, user);
      }
    } catch (error) {
      console.error('[Passport] ❌ Deserialization error:', error);
      done(null, user); // Fallback to session user
    }
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
