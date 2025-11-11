import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

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
  
  // Only use secure cookies in production or when using HTTPS
  const isProduction = process.env.NODE_ENV === 'production';
  // IMPORTANT: Always use secure cookies on Replit (even in development) since it's served over HTTPS
  // This fixes mobile Safari cookie issues where sameSite='lax' doesn't work over HTTPS
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

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const claims: any = tokens.claims();
    
    if (!claims || !claims["sub"]) {
      return verified(new Error("Missing required claims from OIDC provider"));
    }
    
    const user: any = {
      id: claims["sub"],
      email: claims["email"] || "",
      firstName: claims["first_name"] || "",
      lastName: claims["last_name"] || "",
      role: claims["role"] || "client",
    };
    updateUserSession(user, tokens);
    await upsertUser(claims);
    verified(null, user);
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    // Try exact hostname match, fallback to first configured domain
    const domains = process.env.REPLIT_DOMAINS!.split(",");
    const strategyName = domains.includes(req.hostname) 
      ? `replitauth:${req.hostname}` 
      : `replitauth:${domains[0]}`;
    
    passport.authenticate(strategyName, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    // Try exact hostname match, fallback to first configured domain
    const domains = process.env.REPLIT_DOMAINS!.split(",");
    const strategyName = domains.includes(req.hostname) 
      ? `replitauth:${req.hostname}` 
      : `replitauth:${domains[0]}`;
    
    passport.authenticate(strategyName, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}/login`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
