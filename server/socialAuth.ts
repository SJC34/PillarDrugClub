import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// @ts-ignore - passport-apple doesn't have TypeScript definitions
import { Strategy as AppleStrategy } from "passport-apple";
// @ts-ignore - passport-twitter doesn't have TypeScript definitions
import { Strategy as TwitterStrategy } from "passport-twitter";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  const isProduction = process.env.NODE_ENV === 'production';
  const useSecureCookies = isProduction || process.env.REPLIT_DEPLOYMENT === '1';
  
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: useSecureCookies,
      maxAge: sessionTtl,
    },
  });
}

async function upsertUserFromProfile(profile: any, provider: string) {
  const userId = `${provider}_${profile.id}`;
  const email = profile.emails?.[0]?.value || profile.email;
  const firstName = profile.name?.givenName || profile.given_name || profile.firstName || "";
  const lastName = profile.name?.familyName || profile.family_name || profile.lastName || "";
  const profileImageUrl = profile.photos?.[0]?.value || profile.picture || profile.profileImageUrl || "";

  // If provider doesn't send email, try to get it from existing user
  let finalEmail = email;
  if (!finalEmail) {
    try {
      const existingUser = await storage.getUser(userId);
      if (existingUser && existingUser.email) {
        finalEmail = existingUser.email;
      }
    } catch (error) {
      // User doesn't exist yet, and no email from provider
    }
  }

  // If we still don't have an email, we can't proceed
  if (!finalEmail) {
    throw new Error(
      `${provider} authentication failed: Email address is required but was not provided. Please ensure email permissions are granted.`
    );
  }

  await storage.upsertUser({
    id: userId,
    email: finalEmail,
    firstName: firstName,
    lastName: lastName,
    profileImageUrl: profileImageUrl,
  });

  return {
    id: userId,
    email: finalEmail,
    firstName: firstName,
    lastName: lastName,
    provider: provider,
  };
}

export async function setupSocialAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const callbackURL = process.env.REPLIT_DOMAINS 
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
      (req, res) => {
        res.redirect("/dashboard");
      }
    );
  }

  // Apple Sign In Strategy
  if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY) {
    passport.use(
      new AppleStrategy(
        {
          clientID: process.env.APPLE_CLIENT_ID,
          teamID: process.env.APPLE_TEAM_ID,
          keyID: process.env.APPLE_KEY_ID,
          privateKeyString: process.env.APPLE_PRIVATE_KEY,
          callbackURL: `${callbackURL}/api/auth/apple/callback`,
        },
        async (_accessToken: any, _refreshToken: any, _idToken: any, profile: any, done: any) => {
          try {
            const user = await upsertUserFromProfile(profile, "apple");
            done(null, user);
          } catch (error) {
            done(error as Error);
          }
        }
      )
    );

    app.get(
      "/api/auth/apple",
      passport.authenticate("apple", { scope: ["name", "email"] })
    );

    app.post(
      "/api/auth/apple/callback",
      passport.authenticate("apple", { failureRedirect: "/login" }),
      (req, res) => {
        res.redirect("/dashboard");
      }
    );
  }

  // X (Twitter) OAuth Strategy
  if (process.env.X_CONSUMER_KEY && process.env.X_CONSUMER_SECRET) {
    passport.use(
      new TwitterStrategy(
        {
          consumerKey: process.env.X_CONSUMER_KEY,
          consumerSecret: process.env.X_CONSUMER_SECRET,
          callbackURL: `${callbackURL}/api/auth/twitter/callback`,
          includeEmail: true,
        },
        async (_token: any, _tokenSecret: any, profile: any, done: any) => {
          try {
            const user = await upsertUserFromProfile(profile, "twitter");
            done(null, user);
          } catch (error) {
            done(error as Error);
          }
        }
      )
    );

    app.get(
      "/api/auth/twitter",
      passport.authenticate("twitter")
    );

    app.get(
      "/api/auth/twitter/callback",
      passport.authenticate("twitter", { failureRedirect: "/login" }),
      (req, res) => {
        res.redirect("/dashboard");
      }
    );
  }

  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });

  // Fallback routes for unconfigured OAuth providers
  // These redirect back to login with an error parameter
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    app.get("/api/auth/google", (req, res) => {
      res.redirect("/login?error=Google authentication is not available at this time.");
    });
  }

  if (!process.env.APPLE_CLIENT_ID || !process.env.APPLE_TEAM_ID || !process.env.APPLE_KEY_ID || !process.env.APPLE_PRIVATE_KEY) {
    app.get("/api/auth/apple", (req, res) => {
      res.redirect("/login?error=Apple Sign In is not available at this time.");
    });
  }

  if (!process.env.X_CONSUMER_KEY || !process.env.X_CONSUMER_SECRET) {
    app.get("/api/auth/twitter", (req, res) => {
      res.redirect("/login?error=X authentication is not available at this time.");
    });
  }

  // Logout route
  app.get("/api/auth/social-logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};
